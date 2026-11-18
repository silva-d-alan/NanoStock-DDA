# Infra AWS (Terraform)

Publica o NanoStock-DDA em **uma única instância EC2** (Ubuntu 24.04, `t3.small`) rodando
Docker Compose: PostgreSQL + backend NestJS + frontend React servido pelo nginx.

```
Internet ──► :80 EC2 ──► nginx (frontend) ──/v1──► backend:3000 ──► postgres:5432
                         (só a porta 80 é pública; backend e banco ficam na rede interna do Docker)
```

Recursos criados: security group (porta 80), IAM role + instance profile (acesso via SSM,
sem SSH) e a instância EC2 com disco de 20 GB criptografado. Usa a VPC default da região.

## Pré-requisitos

- [Terraform](https://developer.hashicorp.com/terraform/install) >= 1.5
- AWS CLI autenticado (`aws login`) na região do projeto (`us-east-2`)
- O código publicado vem do **GitHub** (`repo_url` / `repo_branch`), não da sua máquina:
  faça push das alterações antes do `apply`.

## Subir

```bash
cd infra

# Se o Terraform não reconhecer a sessão do `aws login`, exporte as credenciais:
eval "$(aws configure export-credentials --format env)"

cat > terraform.tfvars <<'EOF'
seed_admin_password   = "troque-esta-senha"
seed_default_password = "troque-esta-tambem"
EOF

terraform init
terraform apply
```

A saída `app_url` mostra o endereço. O primeiro boot leva **~5–10 min** (instala Docker,
clona o repositório e faz o build das imagens). Usuários do seed: `admin@dda.com`
(senha `seed_admin_password`) e `almoxarife@dda.com`, `comprador@dda.com`, `gestor@dda.com`
(senha `seed_default_password`).

> `terraform.tfvars` e `*.tfstate` contêm as senhas e **não devem ser commitados**
> (já estão no `.gitignore`).

## Acompanhar / depurar

```bash
$(terraform output -raw ssm_session_command)   # requer o Session Manager plugin
sudo tail -f /var/log/nanostock-setup.log
cd /opt/nanostock && sudo docker compose -f docker-compose.prod.yml ps
```

## Atualizar o código publicado

Após um push no GitHub, recrie a instância (o banco é recriado junto):

```bash
terraform apply -replace=aws_instance.app
```

## Remover tudo

```bash
terraform destroy
```
