# AWS infrastructure (Terraform)

Provisions: VPC (2 AZ, public+private subnets, NAT), ALB, ECS Fargate service, RDS Postgres (Multi-AZ), ElastiCache Redis, S3 (uploads) + CloudFront, ECR, Secrets Manager, IAM.

## Prerequisites

- Terraform >= 1.9
- AWS CLI configured with credentials that can create these resources
- Docker (to build and push the app image)

## First-time bootstrap

Infra and the app image have a chicken-and-egg dependency: the ECS service needs an image in ECR, but ECR only exists after `terraform apply`. Bootstrap order:

```bash
cd infra
cp terraform.tfvars.example terraform.tfvars   # fill in real secrets
terraform init
terraform apply                                 # creates ECR among everything else

# Build and push a first image so the ECS service has something to run
aws ecr get-login-password --region <region> | docker login --username AWS --password-stdin <account>.dkr.ecr.<region>.amazonaws.com
docker build -t <ecr_repository_url>:latest ..
docker push <ecr_repository_url>:latest

# ECS will pick up the new image on its own retry loop, or force it:
aws ecs update-service --cluster <ecs_cluster_name> --service <ecs_service_name> --force-new-deployment
```

After that, `app_url` in `terraform.tfvars` should be set to the `cloudfront_domain_name` output (or your custom domain once attached), then `terraform apply` again so OAuth/payment return URLs are correct.

## Cost notes

Defaults are already cost-conscious for a new/low-traffic deployment (~$90-110/mo: 1 NAT gateway, single-AZ `db.t4g.micro`, 1 Fargate task, `cache.t4g.micro`, ALB, CloudFront). Flip these back on once real traffic/revenue justifies it:

- `db_multi_az = true` — Multi-AZ RDS failover (roughly doubles RDS cost).
- `single_nat_gateway = false` — one NAT gateway per AZ instead of a shared one (removes a single point of failure for private-subnet egress).
- `desired_count` / `min_capacity` = 2+ — no-downtime deploys and AZ redundancy for the app tier.
- `rds.tf`: `deletion_protection` and `skip_final_snapshot` are relaxed for easy iteration during initial setup — set `deletion_protection = true` and `skip_final_snapshot = false` once the database holds real data.

## Custom domain + HTTPS

Both the ALB and CloudFront default to HTTP-origin/CloudFront's shared cert. Once you own a domain:

1. Request an ACM certificate in `us-east-1` for CloudFront and in your app's region for the ALB (`aws_acm_certificate` + DNS validation).
2. Add an HTTPS listener on the ALB using the regional cert; redirect the HTTP listener to it.
3. Set `viewer_certificate.acm_certificate_arn` on the CloudFront distribution and switch `origin_protocol_policy` to `https-only`.
4. Point your domain's DNS at the CloudFront distribution (ALIAS/CNAME).

## CI/CD (GitHub Actions)

`.github/workflows/ci.yml` runs lint/typecheck/build on every PR and push to `main`. `.github/workflows/deploy.yml` builds the Docker image, pushes it to ECR, and deploys a new ECS task definition revision — triggered on push to `main`.

To enable the deploy workflow:

1. Set `github_repository = "your-org/your-repo"` in `terraform.tfvars` and `terraform apply` — this provisions an OIDC-federated IAM role (no long-lived AWS keys in GitHub).
2. In the GitHub repo, go to Settings → Secrets and variables → Actions → Variables, and add:
   - `AWS_REGION` — same as `var.aws_region`
   - `AWS_DEPLOY_ROLE_ARN` — the `github_deploy_role_arn` Terraform output
   - `ECR_REPOSITORY` — value of `var.project_name` (the ECR repo name)
   - `ECS_CLUSTER` — the `ecs_cluster_name` output
   - `ECS_SERVICE` — the `ecs_service_name` output
   - `ECS_TASK_FAMILY` — same as `var.project_name` (the task definition family)
3. Push to `main` — the workflow builds, pushes, and deploys automatically.

## Day-2 operations

- `terraform plan` before every `apply` — review the diff, especially anything touching `aws_db_instance` (some changes force replacement).
- Task definition updates are handled by CI/CD (see `.github/workflows/deploy.yml`), not `terraform apply` — that's why `aws_ecs_service.app` ignores `task_definition` changes.
- Remote state: uncomment the `backend "s3"` block in `versions.tf` once more than one person/pipeline runs Terraform against this stack.
