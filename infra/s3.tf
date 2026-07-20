resource "aws_s3_bucket" "uploads" {
  bucket = "${var.project_name}-uploads-${data.aws_caller_identity.current.account_id}"
  tags   = { Name = "${var.project_name}-uploads" }
}

resource "aws_s3_bucket_public_access_block" "uploads" {
  bucket = aws_s3_bucket.uploads.id
  # Without CloudFront (see enable_cloudfront), the bucket has to serve
  # objects directly over its public S3 URL, so public policy access can't be
  # blocked. Re-lock this down once CloudFront is enabled.
  block_public_acls       = true
  block_public_policy     = !var.enable_cloudfront ? false : true
  ignore_public_acls      = true
  restrict_public_buckets = !var.enable_cloudfront ? false : true
}

resource "aws_s3_bucket_versioning" "uploads" {
  bucket = aws_s3_bucket.uploads.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_cors_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id
  cors_rule {
    allowed_methods = ["PUT", "POST", "GET"]
    allowed_origins = var.app_url != "" ? [var.app_url] : ["*"]
    allowed_headers = ["*"]
    max_age_seconds = 3000
  }
}

resource "aws_cloudfront_origin_access_control" "uploads" {
  count = var.enable_cloudfront ? 1 : 0

  name                              = "${var.project_name}-uploads-oac"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

data "aws_iam_policy_document" "uploads_bucket_policy" {
  dynamic "statement" {
    for_each = var.enable_cloudfront ? [1] : []
    content {
      sid       = "AllowCloudFrontRead"
      actions   = ["s3:GetObject"]
      resources = ["${aws_s3_bucket.uploads.arn}/*"]

      principals {
        type        = "Service"
        identifiers = ["cloudfront.amazonaws.com"]
      }

      condition {
        test     = "StringEquals"
        variable = "AWS:SourceArn"
        values   = [aws_cloudfront_distribution.app[0].arn]
      }
    }
  }

  # Fallback while CloudFront is disabled: serve uploaded images directly
  # from the bucket's public URL. Switch back to CloudFront-only access
  # (the block above) once enable_cloudfront = true.
  dynamic "statement" {
    for_each = var.enable_cloudfront ? [] : [1]
    content {
      sid       = "AllowPublicReadWhileCloudFrontDisabled"
      actions   = ["s3:GetObject"]
      resources = ["${aws_s3_bucket.uploads.arn}/*"]
      principals {
        type        = "*"
        identifiers = ["*"]
      }
    }
  }
}

resource "aws_s3_bucket_policy" "uploads" {
  bucket     = aws_s3_bucket.uploads.id
  policy     = data.aws_iam_policy_document.uploads_bucket_policy.json
  depends_on = [aws_s3_bucket_public_access_block.uploads]
}

data "aws_caller_identity" "current" {}
