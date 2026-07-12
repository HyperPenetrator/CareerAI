variable "aws_region" {
  type        = string
  default     = "us-east-1"
  description = "AWS region for deployments"
}

variable "app_name" {
  type        = string
  default     = "careercompass-ai"
  description = "Application name suffix"
}

variable "gemini_api_key" {
  type        = string
  sensitive   = true
  default     = ""
  description = "Google Gemini API key passed as an environment variable to the backend"
}

variable "anthropic_api_key" {
  type        = string
  sensitive   = true
  default     = ""
  description = "Anthropic Claude API key passed as an environment variable to the backend"
}
