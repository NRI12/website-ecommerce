resource "aws_secretsmanager_secret" "app" {
  name        = "${var.project_name}/app-secrets"
  description = "Runtime secrets for the ${var.project_name} ECS task"
}

resource "aws_secretsmanager_secret_version" "app" {
  secret_id = aws_secretsmanager_secret.app.id
  secret_string = jsonencode({
    # sslmode=no-verify: RDS uses Amazon's RDS CA, which isn't in Node's
    # default trust store. Connection is still encrypted; it just doesn't
    # verify the CA chain. Harden later by bundling the RDS CA cert and
    # using sslmode=verify-full.
    DATABASE_URL          = "postgresql://${var.db_username}:${random_password.db.result}@${aws_db_instance.main.endpoint}/${var.db_name}?schema=public&sslmode=no-verify"
    REDIS_URL              = "redis://${aws_elasticache_cluster.main.cache_nodes[0].address}:${aws_elasticache_cluster.main.cache_nodes[0].port}"
    AUTH_SECRET             = var.app_secrets.auth_secret
    AUTH_GOOGLE_ID          = var.app_secrets.auth_google_id
    AUTH_GOOGLE_SECRET      = var.app_secrets.auth_google_secret
    STRIPE_SECRET_KEY       = var.app_secrets.stripe_secret_key
    STRIPE_WEBHOOK_SECRET   = var.app_secrets.stripe_webhook_secret
    RESEND_API_KEY          = var.app_secrets.resend_api_key
  })
}
