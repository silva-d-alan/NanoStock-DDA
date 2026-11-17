# NanoStock-DDA

Sistema de controle de estoque desenvolvido como projeto da disciplina **Projeto Aplicado IV**. A aplicação permite cadastrar pastilhas, registrar entradas e saídas e acompanhar o estoque por meio de uma interface web.

O projeto é um **monorepo** (contém frontend, backend e tipos compartilhados no mesmo repositório), roda em **Node.js** e utiliza **Docker** para orquestrar o banco de dados, o backend e o frontend de forma integrada.

---

## 📋 Pré-requisitos

Você precisa ter instalado em sua máquina:

- **Git** — para baixar o código. [Download](https://git-scm.com/downloads)
- **Docker** — para orquestrar os containers da aplicação. [Download](https://www.docker.com/products/docker-desktop/)

---

## 🚀 Como rodar o projeto

Siga os passos abaixo na ordem indicada:


1º	git clone https://github.com/silva-d-alan/NanoStock-DDA.git
2º	cd NanoStock-DDA
3º	docker compose up -d –build (este comando demorará alguns minutos até ser totalmente descarregado)
4º	Uma vez feito, a solução está aguardando ser acessada no navegador, mas antes é necessário abrir o software Docker. Pronto, agora é só seguir para o Navegador.
5º	Com o navegador aberto, acesse com o endereço: http://localhost:8080
6º	Pronto! Agora é só criar o controle de materiais de estoque de acordo com a sua necessidade.
