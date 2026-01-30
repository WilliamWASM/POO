# 🏨 Hotel Paradise - Sistema de Gestão Hoteleira Fullstack

Este projeto consiste em uma aplicação web completa para gerenciamento de reservas, check-in e check-out de um hotel. O sistema foi desenvolvido com foco na implementação de regras de negócio reais, controle de estados e persistência de dados relacional.

---

## 📋 Sobre o Projeto

O **Hotel Paradise** simula o ciclo de vida operacional de uma hospedagem. O objetivo principal foi criar um sistema onde o fluxo de dados entre o cliente (Frontend) e o servidor (Backend) fosse consistente e seguro, tratando concorrência de reservas e transições de estado dos quartos.

### Principais Funcionalidades

* **Painel do Cliente:** Visualização de quartos, filtragem por disponibilidade e sistema de reserva online.
* **Painel Administrativo:** Dashboard para recepcionistas com controle total sobre as estadias.
* **Controle de Estados:** Implementação rigorosa do ciclo de vida do quarto (Disponível → Reservado → Ocupado → Sujo → Disponível).
* **Autenticação:** Sistema de login seguro para funcionários (Admin) e hóspedes (Guest) utilizando JWT.
* **Validações de Regra de Negócio:** Prevenção de duplicidade de reservas e conflitos de check-in.

---

## 🛠️ Tecnologias Utilizadas

O projeto foi construído utilizando uma stack moderna e amplamente adotada no mercado:

* **Frontend:** React.js (Vite) com TypeScript.
* **Backend:** Node.js com Express e TypeScript.
* **Banco de Dados:** SQLite (ambiente de desenvolvimento) gerenciado pelo **Prisma ORM**.
* **Segurança:** Autenticação via JSON Web Tokens (JWT) e hash de senhas com Bcrypt.
* **Estilização:** CSS Modules e layouts responsivos.

---

## 🔄 Regras de Negócio e Ciclo de Vida

Um dos diferenciais deste projeto é a gestão de estados dos quartos, que segue o fluxo abaixo:

1.  🟢 **AVAILABLE (Disponível):** Estado inicial. O quarto está limpo e pronto para receber hóspedes.
2.  🔵 **RESERVED (Reservado):** O cliente efetuou a reserva pelo site. O quarto fica bloqueado para outros clientes, aguardando a chegada do hóspede.
3.  🔴 **OCCUPIED (Ocupado):** O recepcionista confirmou a entrada (Check-in). A contagem de diárias é iniciada.
4.  🟠 **DIRTY (Sujo):** Após o check-out, o quarto é marcado automaticamente como sujo, impedindo novas reservas imediatas até que a limpeza seja realizada.

---

## 🚀 Instalação e Execução

Siga os passos abaixo para rodar o projeto localmente.

### Pré-requisitos
* Node.js (v16 ou superior)
* NPM ou Yarn

### 1. Configuração do Backend

No terminal, acesse a pasta `backend`:

```bash
# Instalar as dependências do projeto
npm install

# Executar as migrações para criar o Banco de Dados
npx prisma migrate dev --name init

# (Opcional) Popular o banco com dados de teste (Seed)
npx prisma db seed 

# Iniciar o servidor de desenvolvimento
npm run dev
O servidor iniciará na porta 3000.

2. Configuração do Frontend
Em um novo terminal, acesse a pasta frontend:
# Instalar as dependências
npm install

# Iniciar a aplicação React
npm run dev
Acesse a aplicação através do link indicado (geralmente http://localhost:5173).

🧪 Instruções para Teste (Ambiente de Desenvolvimento)
Caso não tenha executado o script de seed, você pode criar um usuário Administrador manualmente para acessar o painel:

- Abra o Console do Desenvolvedor no navegador (F12).

- Execute o seguinte comando fetch para criar o usuário admin:

fetch('http://localhost:3000/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: "Admin Sistema",
    email: "admin@hotel.com",
    password: "123" 
  })
}).then(res => res.json()).then(data => console.log(data));

Utilize as credenciais abaixo para login na área "Sou Funcionário":

E-mail: admin@hotel.com

Senha: 123
