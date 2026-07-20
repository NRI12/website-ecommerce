terraform {
  required_version = ">= 1.9.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  # Uncomment and configure once you have an S3 bucket + DynamoDB table for
  # remote state (recommended before a second person touches this infra):
  # backend "s3" {
  #   bucket         = "website-ecommerce-tfstate"
  #   key            = "prod/terraform.tfstate"
  #   region         = "ap-southeast-1"
  #   dynamodb_table = "website-ecommerce-tflock"
  #   encrypt        = true
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}
