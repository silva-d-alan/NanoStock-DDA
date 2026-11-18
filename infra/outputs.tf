output "app_url" {
  description = "URL pública da aplicação (fica disponível alguns minutos após o apply)."
  value       = "http://${aws_instance.app.public_ip}"
}

output "instance_id" {
  value = aws_instance.app.id
}

output "ssm_session_command" {
  description = "Abre um terminal na instância (requer o Session Manager plugin do AWS CLI)."
  value       = "aws ssm start-session --region ${var.aws_region} --target ${aws_instance.app.id}"
}
