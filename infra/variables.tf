variable "project_name" {
  description = "Short name used to prefix all resources"
  type        = string
  default     = "website-ecommerce"
}

variable "environment" {
  description = "Deployment environment name"
  type        = string
  default     = "prod"
}

variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "ap-southeast-1"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.20.0.0/16"
}

variable "az_count" {
  description = "Number of availability zones to spread subnets across"
  type        = number
  default     = 2
}

variable "single_nat_gateway" {
  description = "Use one shared NAT gateway instead of one per AZ (cuts cost ~50%, trades away AZ-isolated egress HA)"
  type        = bool
  default     = true
}

variable "container_port" {
  description = "Port the Next.js container listens on"
  type        = number
  default     = 3000
}

variable "task_cpu" {
  description = "Fargate task vCPU units (256 = 0.25 vCPU)"
  type        = number
  default     = 512
}

variable "task_memory" {
  description = "Fargate task memory in MB"
  type        = number
  default     = 1024
}

variable "desired_count" {
  description = "Number of running Fargate tasks"
  type        = number
  default     = 1
}

variable "min_capacity" {
  description = "Minimum ECS service task count for autoscaling"
  type        = number
  default     = 1
}

variable "max_capacity" {
  description = "Maximum ECS service task count for autoscaling"
  type        = number
  default     = 3
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t4g.micro"
}

variable "db_multi_az" {
  description = "Run RDS in Multi-AZ (roughly doubles RDS cost; enable once you need HA)"
  type        = bool
  default     = false
}

variable "db_allocated_storage" {
  description = "RDS allocated storage in GB"
  type        = number
  default     = 20
}

variable "db_name" {
  description = "Postgres database name"
  type        = string
  default     = "ecommerce"
}

variable "db_username" {
  description = "Postgres master username"
  type        = string
  default     = "ecommerce_admin"
}

variable "image_tag" {
  description = "Docker image tag to deploy (set by CI/CD pipeline)"
  type        = string
  default     = "latest"
}

variable "app_secrets" {
  description = <<-EOT
    Application secrets injected as ECS task environment variables via Secrets
    Manager. Populate via terraform.tfvars (gitignored) or CI/CD secret
    injection — never commit real values.
  EOT
  type = object({
    auth_secret            = string
    auth_google_id         = string
    auth_google_secret     = string
    stripe_secret_key      = string
    stripe_webhook_secret  = string
    resend_api_key         = string
  })
  sensitive = true
}

variable "enable_cloudfront" {
  description = "Create the CloudFront distribution. Disable if the AWS account isn't yet verified for CloudFront (new accounts sometimes need AWS Support to lift this restriction)."
  type        = bool
  default     = false
}

variable "app_url" {
  description = "Public URL of the application (used for OAuth/payment return URLs). Set after the first apply once you know the CloudFront domain, or point a custom domain at it."
  type        = string
  default     = ""
}
