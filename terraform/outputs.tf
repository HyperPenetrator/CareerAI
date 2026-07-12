output "app_url" {
  value       = aws_app_runner_service.app.service_url
  description = "URL for the unified CareerCompass AI App Runner service"
}

output "ecr_repository_url" {
  value       = aws_ecr_repository.app.repository_url
  description = "Repository URL for the unified Docker image"
}
