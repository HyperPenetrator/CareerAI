provider "aws" {
  region = var.aws_region
}

# 1. Unified ECR Repository
resource "aws_ecr_repository" "app" {
  name                 = var.app_name
  image_tag_mutability = "MUTABLE"
  image_scanning_configuration {
    scan_on_push = true
  }
}

# 2. IAM Roles for App Runner
resource "aws_iam_role" "apprunner_execution_role" {
  name = "${var.app_name}-apprunner-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "build.apprunner.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "apprunner_ecr_access" {
  role       = aws_iam_role.apprunner_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSAppRunnerServicePolicyForECRAccess"
}

# 3. AWS App Runner Unified Service
resource "aws_app_runner_service" "app" {
  service_name = var.app_name

  instance_configuration {
    cpu    = "0.25 vCPU"
    memory = "0.5 GB"
  }

  source_configuration {
    authentication_configuration {
      access_role_arn = aws_iam_role.apprunner_execution_role.arn
    }
    image_repository {
      image_identifier      = "${aws_ecr_repository.app.repository_url}:latest"
      image_repository_type = "ECR"
      image_configuration {
        port = "8080"
        runtime_environment_variables = {
          GEMINI_API_KEY    = var.gemini_api_key
          ANTHROPIC_API_KEY = var.anthropic_api_key
        }
      }
    }
    # Manual deployment trigger as specified by user
    auto_deployments_enabled = false
  }

  tags = {
    Name = var.app_name
  }
}
