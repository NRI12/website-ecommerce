output "cloudfront_domain_name" {
  description = "Public URL of the app via CloudFront (null while enable_cloudfront = false)"
  value       = var.enable_cloudfront ? aws_cloudfront_distribution.app[0].domain_name : null
}

output "alb_dns_name" {
  description = "ALB DNS name — public HTTP entrypoint while CloudFront is disabled"
  value       = aws_lb.main.dns_name
}

output "app_public_url" {
  description = "The URL to actually open — CloudFront if enabled, otherwise the ALB directly over HTTP"
  value       = var.enable_cloudfront ? "https://${aws_cloudfront_distribution.app[0].domain_name}" : "http://${aws_lb.main.dns_name}"
}

output "ecr_repository_url" {
  description = "Push Docker images here; referenced by ecs.tf's image_tag var"
  value       = aws_ecr_repository.app.repository_url
}

output "ecs_cluster_name" {
  value = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  value = aws_ecs_service.app.name
}

output "rds_endpoint" {
  description = "Postgres endpoint (private, only reachable from ECS tasks)"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "uploads_bucket_name" {
  value = aws_s3_bucket.uploads.bucket
}

output "app_secrets_arn" {
  value = aws_secretsmanager_secret.app.arn
}
