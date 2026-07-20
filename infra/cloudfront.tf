resource "aws_cloudfront_distribution" "app" {
  count = var.enable_cloudfront ? 1 : 0

  enabled             = true
  is_ipv6_enabled     = true
  comment             = "${var.project_name} (${var.environment})"
  default_root_object = ""
  price_class         = "PriceClass_200"

  origin {
    origin_id   = "alb"
    domain_name = aws_lb.main.dns_name

    custom_origin_config {
      http_port              = 80
      https_port              = 443
      origin_protocol_policy  = "http-only" # switch to https-only once the ALB has an ACM cert
      origin_ssl_protocols    = ["TLSv1.2"]
    }
  }

  origin {
    origin_id                = "uploads"
    domain_name               = aws_s3_bucket.uploads.bucket_regional_domain_name
    origin_access_control_id  = aws_cloudfront_origin_access_control.uploads[0].id
  }

  default_cache_behavior {
    target_origin_id       = "alb"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods         = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods           = ["GET", "HEAD"]

    # Forward everything through to Next.js (App Router pages, RSC payloads,
    # server actions all key off headers/cookies) — cache selectively via
    # `Cache-Control` response headers in the app instead of edge rules.
    forwarded_values {
      query_string = true
      headers      = ["Host", "Accept", "Accept-Language", "Authorization", "Content-Type"]
      cookies {
        forward = "all"
      }
    }

    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 0
  }

  ordered_cache_behavior {
    path_pattern            = "/uploads/*"
    target_origin_id        = "uploads"
    viewer_protocol_policy  = "redirect-to-https"
    allowed_methods          = ["GET", "HEAD"]
    cached_methods            = ["GET", "HEAD"]
    compress                  = true

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 86400
    default_ttl = 604800
    max_ttl     = 31536000
  }

  ordered_cache_behavior {
    path_pattern            = "/_next/static/*"
    target_origin_id        = "alb"
    viewer_protocol_policy  = "redirect-to-https"
    allowed_methods          = ["GET", "HEAD"]
    cached_methods            = ["GET", "HEAD"]
    compress                  = true

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 31536000
    default_ttl = 31536000
    max_ttl     = 31536000
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
    # Once you attach a custom domain, replace with an ACM cert (us-east-1)
    # via acm_certificate_arn + ssl_support_method = "sni-only".
  }

  tags = { Name = "${var.project_name}-cdn" }
}
