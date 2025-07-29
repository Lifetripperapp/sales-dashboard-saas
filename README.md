# Sales Dashboard SaaS - Multi-Tenant Version

A comprehensive SaaS sales dashboard with multi-tenant architecture and Freemium model.

## Features

- 🏢 Multi-tenant architecture
- 💰 Freemium model with Stripe integration
- 🔐 Auth0 authentication
- 📊 Sales performance tracking
- 🎯 Objectives management
- 👥 Salesperson management
- 🏢 Client matrix management

## Plans Available

| Plan | Users | Clients | Objectives | Price |
|------|-------|---------|------------|-------|
| Free | 5 | 50 | 10 | $0 |
| Basic | 20 | 200 | 50 | $29/month |
| Premium | 100 | 1000 | 200 | $99/month |

## Technology Stack

- **Frontend**: React + Tailwind CSS
- **Backend**: Express.js + Supabase Edge Functions
- **Database**: Supabase PostgreSQL
- **Authentication**: Auth0
- **Payments**: Stripe
- **Deployment**: Vercel

## Setup

### Prerequisites

- Node.js 18+
- Supabase account
- Auth0 account
- Stripe account
- Vercel account (for deployment)

### Environment Variables

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
SUPABASE_DATABASE_URL=postgresql://...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Auth0
VITE_AUTH0_DOMAIN=your-domain.auth0.com
VITE_AUTH0_CLIENT_ID=your_client_id
VITE_AUTH0_AUDIENCE=your_audience

# App
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

### Local Development

```bash
# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your credentials

# Setup Supabase database
npm run db:setup:supabase

# Start development server
npm run dev
```

### Deployment

```bash
# Deploy to Vercel
npm run vercel:deploy
```

## Multi-Tenant Architecture

- **Row Level Security (RLS)**: Database-level tenant isolation
- **JWT-based context**: Tenant information embedded in Auth0 tokens
- **Middleware validation**: Server-side tenant validation and limits
- **Feature toggling**: Plan-based feature access control

## Subscription Management

- **Stripe Integration**: Checkout, billing, and customer portal
- **Webhooks**: Automatic plan updates and cancellations
- **Usage limits**: Enforced at application level
- **Grace periods**: Configurable limits and notifications

## API Structure

- `/api/tenants` - Tenant management
- `/api/auth` - Authentication and user sync
- `/api/subscriptions` - Stripe integration
- `/api/salespersons` - Salesperson management (tenant-scoped)
- `/api/objectives` - Objectives management (tenant-scoped)
- `/api/clients` - Client management (tenant-scoped)
