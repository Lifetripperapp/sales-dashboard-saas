# UYTECH SaaS - Versión Multi-Tenant

## Descripción

Versión SaaS del UYTECH Sales Dashboard con soporte multi-tenant y modelo Freemium.

## Características

- 🏢 Multi-tenant architecture
- 💰 Modelo Freemium con Stripe
- 🔐 Auth0 multi-tenant
- 📊 Dashboard por empresa
- 🎯 Gestión de objetivos
- 👥 Gestión de vendedores
- 🏢 Matriz de clientes

## Planes Disponibles

| Plan | Usuarios | Clientes | Objetivos | Precio |
|------|----------|----------|-----------|--------|
| Free | 5 | 50 | 10 | $0 |
| Basic | 20 | 200 | 50 | $29/mes |
| Premium | 100 | 1000 | 200 | $99/mes |

## Tecnologías

- **Frontend**: React + Tailwind CSS
- **Backend**: Supabase Edge Functions
- **Base de datos**: Supabase PostgreSQL
- **Autenticación**: Auth0
- **Pagos**: Stripe
- **Despliegue**: Vercel

## Configuración

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Configurar base de datos
npm run db:setup:supabase

# Ejecutar en desarrollo
npm run dev
```

## Despliegue

- **URL**: https://uytech-saas.vercel.app
- **Base de datos**: Supabase
- **Auth**: Auth0
- **Pagos**: Stripe

## Variables de Entorno

```bash
# Supabase
SUPABASE_DATABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# Auth0
VITE_AUTH0_DOMAIN=
VITE_AUTH0_CLIENT_ID=
VITE_AUTH0_AUDIENCE=

# App
FRONTEND_URL=
```
