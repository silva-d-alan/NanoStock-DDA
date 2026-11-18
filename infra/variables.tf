variable "aws_region" {
  description = "Região do projeto AWS (confirme em AWS Settings > View all projects > Overview > Additional Info > Region)."
  type        = string
  default     = "us-east-2"
}

variable "instance_type" {
  description = "Tipo da instância EC2. t3.small (2 GB RAM) é elegível ao Free Tier e aguenta o build dos containers."
  type        = string
  default     = "t3.small"
}

variable "repo_url" {
  description = "Repositório Git (público) clonado pela instância."
  type        = string
  default     = "https://github.com/silva-d-alan/NanoStock-DDA.git"
}

variable "repo_branch" {
  description = "Branch a ser publicada."
  type        = string
  default     = "main"
}

variable "seed_admin_password" {
  description = "Senha do usuário admin@dda.com criado pelo seed."
  type        = string
  sensitive   = true

  validation {
    condition     = length(var.seed_admin_password) >= 8 && !strcontains(var.seed_admin_password, "'")
    error_message = "A senha do admin precisa ter pelo menos 8 caracteres e não pode conter aspas simples."
  }
}

variable "seed_default_password" {
  description = "Senha dos demais usuários criados pelo seed (almoxarife, comprador, gestor)."
  type        = string
  sensitive   = true

  validation {
    condition     = length(var.seed_default_password) >= 8 && !strcontains(var.seed_default_password, "'")
    error_message = "A senha padrão precisa ter pelo menos 8 caracteres e não pode conter aspas simples."
  }
}
