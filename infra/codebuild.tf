# Builds the Docker image and runs DB migrations entirely on AWS (CodeBuild),
# so deploying never depends on Docker being available on a local machine.

resource "aws_s3_bucket" "build_source" {
  bucket        = "${var.project_name}-build-source-${data.aws_caller_identity.current.account_id}"
  force_destroy = true
  tags          = { Name = "${var.project_name}-build-source" }
}

resource "aws_s3_bucket_public_access_block" "build_source" {
  bucket                  = aws_s3_bucket.build_source.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_cloudwatch_log_group" "codebuild" {
  name              = "/codebuild/${var.project_name}"
  retention_in_days = 14
}

data "aws_iam_policy_document" "codebuild_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["codebuild.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "codebuild" {
  name               = "${var.project_name}-codebuild"
  assume_role_policy = data.aws_iam_policy_document.codebuild_assume_role.json
}

data "aws_iam_policy_document" "codebuild_policy" {
  statement {
    sid = "Logs"
    actions = [
      "logs:CreateLogStream",
      "logs:PutLogEvents",
    ]
    resources = ["${aws_cloudwatch_log_group.codebuild.arn}:*"]
  }

  statement {
    sid       = "S3Source"
    actions   = ["s3:GetObject", "s3:GetObjectVersion", "s3:ListBucket"]
    resources = [aws_s3_bucket.build_source.arn, "${aws_s3_bucket.build_source.arn}/*"]
  }

  statement {
    sid = "ECR"
    actions = [
      "ecr:GetAuthorizationToken",
      "ecr:BatchCheckLayerAvailability",
      "ecr:GetDownloadUrlForLayer",
      "ecr:BatchGetImage",
      "ecr:PutImage",
      "ecr:InitiateLayerUpload",
      "ecr:UploadLayerPart",
      "ecr:CompleteLayerUpload",
    ]
    resources = ["*"]
  }

  statement {
    sid       = "ECSRedeploy"
    actions   = ["ecs:UpdateService", "ecs:DescribeServices"]
    resources = [aws_ecs_service.app.id]
  }

  statement {
    sid       = "Secrets"
    actions   = ["secretsmanager:GetSecretValue"]
    resources = [aws_secretsmanager_secret.app.arn]
  }

  statement {
    sid = "VPC"
    actions = [
      "ec2:CreateNetworkInterface",
      "ec2:DescribeNetworkInterfaces",
      "ec2:DeleteNetworkInterface",
      "ec2:DescribeSubnets",
      "ec2:DescribeSecurityGroups",
      "ec2:DescribeDhcpOptions",
      "ec2:DescribeVpcs",
    ]
    resources = ["*"]
  }

  statement {
    sid       = "VPCNetworkInterfacePermission"
    actions   = ["ec2:CreateNetworkInterfacePermission"]
    resources = ["arn:aws:ec2:${var.aws_region}:${data.aws_caller_identity.current.account_id}:network-interface/*"]
  }
}

resource "aws_iam_role_policy" "codebuild" {
  name   = "${var.project_name}-codebuild"
  role   = aws_iam_role.codebuild.id
  policy = data.aws_iam_policy_document.codebuild_policy.json
}

resource "aws_security_group" "codebuild" {
  name_prefix = "${var.project_name}-codebuild-"
  description = "CodeBuild jobs (image build + DB migration)"
  vpc_id      = aws_vpc.main.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  lifecycle { create_before_destroy = true }
  tags = { Name = "${var.project_name}-codebuild-sg" }
}

# Not currently used (the VPC-config CodeBuild migrate project is disabled
# above), and mixing a standalone aws_security_group_rule with the inline
# ingress {} block on aws_security_group.rds causes plan churn. Re-add once
# the migrate project is re-enabled.
# resource "aws_security_group_rule" "rds_from_codebuild" {
#   type                     = "ingress"
#   from_port                = 5432
#   to_port                  = 5432
#   protocol                 = "tcp"
#   security_group_id        = aws_security_group.rds.id
#   source_security_group_id = aws_security_group.codebuild.id
# }

# --- Build & push the Docker image, then roll the ECS service ---
resource "aws_codebuild_project" "image_build" {
  name         = "${var.project_name}-image-build"
  service_role = aws_iam_role.codebuild.arn
  build_timeout = 20

  artifacts {
    type = "NO_ARTIFACTS"
  }

  environment {
    type                        = "LINUX_CONTAINER"
    compute_type                = "BUILD_GENERAL1_MEDIUM"
    image                       = "aws/codebuild/standard:7.0"
    privileged_mode             = true
    image_pull_credentials_type = "CODEBUILD"

    environment_variable {
      name  = "AWS_ACCOUNT_ID"
      value = data.aws_caller_identity.current.account_id
    }
    environment_variable {
      name  = "IMAGE_REPO_NAME"
      value = aws_ecr_repository.app.name
    }
    environment_variable {
      name  = "ECS_CLUSTER"
      value = aws_ecs_cluster.main.name
    }
    environment_variable {
      name  = "ECS_SERVICE"
      value = aws_ecs_service.app.name
    }
  }

  source {
    type      = "S3"
    location  = "${aws_s3_bucket.build_source.bucket}/source.zip"
    buildspec = <<-BUILDSPEC
      version: 0.2
      phases:
        pre_build:
          commands:
            - echo "$AWS_ACCOUNT_ID"
            - aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com
            - IMAGE_TAG=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c1-12)
            - if [ -z "$IMAGE_TAG" ] || [ "$IMAGE_TAG" = "" ]; then IMAGE_TAG=$(date +%s); fi
        build:
          commands:
            - docker build -t $IMAGE_REPO_NAME:$IMAGE_TAG .
            - docker tag $IMAGE_REPO_NAME:$IMAGE_TAG $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG
            - docker tag $IMAGE_REPO_NAME:$IMAGE_TAG $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:latest
        post_build:
          commands:
            - docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG
            - docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:latest
            - aws ecs update-service --cluster $ECS_CLUSTER --service $ECS_SERVICE --force-new-deployment --region $AWS_DEFAULT_REGION
    BUILDSPEC
  }

  logs_config {
    cloudwatch_logs {
      group_name = aws_cloudwatch_log_group.codebuild.name
    }
  }

  tags = { Name = "${var.project_name}-image-build" }
}

# --- Run Prisma migrations (+ optional seed) against RDS from inside the VPC ---
#
# Disabled for now: creating a CodeBuild project with vpc_config on this AWS
# account fails with "Not authorized to perform DescribeSecurityGroups" — a
# new-account restriction (account was created the day of this deploy), not
# an IAM policy gap (the deploying user has AdministratorAccess). Re-enable
# once AWS lifts new-account service restrictions (usually resolves within a
# few days, or after contacting AWS Support). Migrations run via `ecs
# run-task` with a command override instead — see infra/README.md.
#
# resource "aws_codebuild_project" "migrate" {
#   name          = "${var.project_name}-migrate"
#   service_role  = aws_iam_role.codebuild.arn
#   build_timeout = 15
#
#   artifacts {
#     type = "NO_ARTIFACTS"
#   }
#
#   environment {
#     type                        = "LINUX_CONTAINER"
#     compute_type                = "BUILD_GENERAL1_SMALL"
#     image                       = "aws/codebuild/standard:7.0"
#     image_pull_credentials_type = "CODEBUILD"
#
#     environment_variable {
#       name  = "DATABASE_URL"
#       type  = "SECRETS_MANAGER"
#       value = "${aws_secretsmanager_secret.app.name}:DATABASE_URL"
#     }
#   }
#
#   vpc_config {
#     vpc_id             = aws_vpc.main.id
#     subnets            = aws_subnet.private[*].id
#     security_group_ids = [aws_security_group.codebuild.id]
#   }
#
#   source {
#     type      = "S3"
#     location  = "${aws_s3_bucket.build_source.bucket}/source.zip"
#     buildspec = <<-BUILDSPEC
#       version: 0.2
#       phases:
#         install:
#           runtime-versions:
#             nodejs: 22
#           commands:
#             - npm ci
#         build:
#           commands:
#             - npx prisma migrate deploy
#             - npx prisma db seed
#     BUILDSPEC
#   }
#
#   logs_config {
#     cloudwatch_logs {
#       group_name = aws_cloudwatch_log_group.codebuild.name
#     }
#   }
#
#   tags = { Name = "${var.project_name}-migrate" }
# }
