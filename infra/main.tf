# Arquitetura: uma única instância EC2 rodando via Docker Compose
# postgres + backend (NestJS) + frontend (nginx). Somente a porta 80 fica pública;
# o nginx serve o React e repassa /v1 para o backend na rede interna do Docker.

data "aws_vpc" "default" {
  default = true
}

# AMI mais recente do Ubuntu 24.04 LTS (publicada pela Canonical no SSM).
data "aws_ssm_parameter" "ubuntu" {
  name = "/aws/service/canonical/ubuntu/server/24.04/stable/current/amd64/hvm/ebs-gp3/ami-id"
}

resource "aws_security_group" "app" {
  name        = "nanostock-app"
  description = "NanoStock-DDA: HTTP publico"
  vpc_id      = data.aws_vpc.default.id
}

resource "aws_vpc_security_group_ingress_rule" "http" {
  security_group_id = aws_security_group.app.id
  description       = "HTTP"
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "tcp"
  from_port         = 80
  to_port           = 80
}

resource "aws_vpc_security_group_egress_rule" "all" {
  security_group_id = aws_security_group.app.id
  description       = "Saida liberada (apt, GitHub, Docker Hub, npm)"
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
}

# Acesso ao terminal da instância via SSM Session Manager (sem SSH / porta 22).
resource "aws_iam_role" "ec2" {
  name = "nanostock-ec2"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ssm" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "ec2" {
  name = "nanostock-ec2"
  role = aws_iam_role.ec2.name
}

resource "aws_instance" "app" {
  ami                         = data.aws_ssm_parameter.ubuntu.value
  instance_type               = var.instance_type
  vpc_security_group_ids      = [aws_security_group.app.id]
  iam_instance_profile        = aws_iam_instance_profile.ec2.name
  associate_public_ip_address = true

  user_data = templatefile("${path.module}/templates/user_data.sh.tftpl", {
    repo_url              = var.repo_url
    repo_branch           = var.repo_branch
    compose_file          = file("${path.module}/templates/docker-compose.prod.yml")
    nginx_conf            = file("${path.module}/templates/nginx.conf")
    seed_admin_password   = var.seed_admin_password
    seed_default_password = var.seed_default_password
  })
  user_data_replace_on_change = true

  root_block_device {
    volume_type = "gp3"
    volume_size = 20
    encrypted   = true
  }

  metadata_options {
    http_tokens = "required" # IMDSv2
  }

  tags = {
    Name = "nanostock-app"
  }

  # A AMI muda com o tempo; não recriar a instância só por isso.
  lifecycle {
    ignore_changes = [ami]
  }
}
