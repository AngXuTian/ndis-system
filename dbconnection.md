# Database Setup, Connection, and Verification Guide

This guide outlines how to configure, run, connect to, and verify your local PostgreSQL database via Docker.

---

## 1. Environment Configuration

Ensure your `.env` file and `docker-compose.yml` contain matching credentials for your local database.

### `.env` Example
```env
DATABASE_URL=postgresql://ndis:ndispass@127.0.0.1:5432/ndis

### docker-compose.yml Example

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ndis
      POSTGRES_PASSWORD: ndispass
      POSTGRES_DB: ndis
    ports:
      - "5432:5432"


2. Running Migrations and Seeding
To create your database schema and automatically seed initial data (such as roles, permissions, and the default super admin user):

Start your Docker containers:

docker compose up -d
Run your database migration script:

npm run db:migrate
Generate TypeScript types (Kysely):

npm run db:codegen

3. Connecting to the Database via Terminal (psql)
To interact directly with your database using the PostgreSQL command-line tool, connect using your configured credentials (forcing IPv4 127.0.0.1 to avoid loopback resolution issues):


psql "postgresql://ndis:ndispass@127.0.0.1:5432/ndis"
Once connected, your terminal will show the database prompt:

ndis=#

4. Verifying Tables and Seed Data
Once inside the ndis=# prompt, run the following SQL commands to verify your setup:

Check all tables:


\dt

Check if seed data was successfully inserted:

SELECT id, email, full_name, is_default FROM app_user;
(You should see the default super admin user test@wittydata.com listed).

Exit the prompt:
SQL
\q

5. Connecting via a Database GUI Client (e.g., VS Code Extension / TablePlus)
If you prefer using a graphical interface, configure your connection with these parameters:

Server Type: PostgreSQL
Host: 127.0.0.1 (or localhost)
Port: 5432
Username: ndis
Password: ndispass
Database: ndis