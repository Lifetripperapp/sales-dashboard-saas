const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Script para configurar repositorios de GitHub
 */
async function setupGitHubRepos() {
  console.log('🚀 Configurando repositorios de GitHub...');

  const currentDir = process.cwd();
  const parentDir = path.dirname(currentDir);
  const projectName = path.basename(currentDir);

  // Crear estructura de directorios
  const repos = [
    'uytech-current',
    'uytech-saas',
    'uytech-shared'
  ];

  for (const repo of repos) {
    const repoPath = path.join(parentDir, repo);
    
    if (!fs.existsSync(repoPath)) {
      fs.mkdirSync(repoPath, { recursive: true });
      console.log(`✅ Creado directorio: ${repo}`);
    }

    // Inicializar Git en cada repositorio
    if (!fs.existsSync(path.join(repoPath, '.git'))) {
      execSync('git init', { cwd: repoPath });
      console.log(`✅ Inicializado Git en: ${repo}`);
    }
  }

  // Crear README para cada repositorio
  createReadmeFiles(parentDir);

  // Crear scripts de gestión
  createManagementScripts(parentDir);

  console.log('\n🎉 Repositorios configurados exitosamente!');
  console.log('\n📁 Estructura creada:');
  console.log('├── uytech-current/     # Versión actual');
  console.log('├── uytech-saas/       # Versión SaaS');
  console.log('└── uytech-shared/     # Componentes compartidos');
  
  console.log('\n🚀 Próximos pasos:');
  console.log('1. Crear repositorios en GitHub');
  console.log('2. Configurar remotes');
  console.log('3. Hacer push inicial');
  console.log('4. Configurar CI/CD');
}

/**
 * Crear README para cada repositorio
 */
function createReadmeFiles(parentDir) {
  // README para uytech-current
  const currentReadme = `# UYTECH Current - Versión Actual

## Descripción

Versión actual del UYTECH Sales Dashboard sin cambios.

## Características

- 📊 Dashboard de ventas
- 🎯 Gestión de objetivos
- 👥 Gestión de vendedores
- 🏢 Matriz de clientes
- 📈 Reportes y analytics

## Tecnologías

- **Frontend**: React + Tailwind CSS
- **Backend**: Express.js + Sequelize
- **Base de datos**: PostgreSQL (Heroku)
- **Autenticación**: Auth0
- **Despliegue**: Heroku

## Configuración

\`\`\`bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Ejecutar en desarrollo
npm run dev
\`\`\`

## Despliegue

- **URL**: https://uytech-dashboard.herokuapp.com
- **Base de datos**: Heroku Postgres
- **Auth**: Auth0

## Variables de Entorno

\`\`\`bash
DATABASE_URL=postgresql://...
AUTH0_DOMAIN=uytech.auth0.com
AUTH0_CLIENT_ID=your_client_id
AUTH0_AUDIENCE=your_audience
\`\`\`

## Desarrollo

Este repositorio mantiene la funcionalidad actual sin cambios mientras se desarrolla la versión SaaS en paralelo.
`;

  fs.writeFileSync(path.join(parentDir, 'uytech-current', 'README.md'), currentReadme);

  // README para uytech-saas
  const saasReadme = `# UYTECH SaaS - Versión Multi-Tenant

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

\`\`\`bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Configurar base de datos
npm run db:setup:supabase

# Ejecutar en desarrollo
npm run dev
\`\`\`

## Despliegue

- **URL**: https://uytech-saas.vercel.app
- **Base de datos**: Supabase
- **Auth**: Auth0
- **Pagos**: Stripe

## Variables de Entorno

\`\`\`bash
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
\`\`\`
`;

  fs.writeFileSync(path.join(parentDir, 'uytech-saas', 'README.md'), saasReadme);

  // README para uytech-shared
  const sharedReadme = `# UYTECH Shared - Componentes Compartidos

## Descripción

Componentes, utilidades y estilos compartidos entre UYTECH Current y UYTECH SaaS.

## Estructura

- \`components/\`: Componentes React reutilizables
- \`utils/\`: Funciones utilitarias
- \`styles/\`: Estilos CSS/Tailwind compartidos
- \`hooks/\`: Custom React hooks
- \`constants/\`: Constantes compartidas

## Uso

\`\`\`javascript
// En uytech-current o uytech-saas
import { Button } from '../shared/components/Button';
import { formatCurrency } from '../shared/utils/formatters';
import { useLocalStorage } from '../shared/hooks/useLocalStorage';
\`\`\`

## Instalación

\`\`\`bash
# Como dependencia local
npm install ../uytech-shared

# O como submodule de Git
git submodule add https://github.com/uytech/uytech-shared
\`\`\`

## Componentes Disponibles

- \`Button\`: Botón reutilizable
- \`Modal\`: Modal genérico
- \`Table\`: Tabla con paginación
- \`Loading\`: Componente de carga
- \`ErrorBoundary\`: Manejo de errores

## Utilidades

- \`formatters\`: Formateo de datos
- \`validators\`: Validación de formularios
- \`helpers\`: Funciones auxiliares
- \`api\`: Cliente API común

## Estilos

- \`tailwind.css\`: Configuración de Tailwind
- \`components.css\`: Estilos de componentes
- \`variables.css\`: Variables CSS
`;

  fs.writeFileSync(path.join(parentDir, 'uytech-shared', 'README.md'), sharedReadme);
}

/**
 * Crear scripts de gestión
 */
function createManagementScripts(parentDir) {
  // Script para sincronizar cambios
  const syncScript = `#!/bin/bash

echo "🔄 Sincronizando cambios entre repositorios..."

# Función para sincronizar cambios
sync_changes() {
  local source_repo=\$1
  local target_repo=\$2
  local file_path=\$3
  
  if [ -f "\$source_repo/\$file_path" ]; then
    cp "\$source_repo/\$file_path" "\$target_repo/\$file_path"
    echo "✅ Sincronizado: \$file_path"
  fi
}

# Sincronizar componentes compartidos
echo "📦 Sincronizando componentes compartidos..."

# Desde shared a current
sync_changes "uytech-shared" "uytech-current" "src/common/components/Button.jsx"
sync_changes "uytech-shared" "uytech-current" "src/common/utils/formatters.js"

# Desde shared a saas
sync_changes "uytech-shared" "uytech-saas" "src/common/components/Button.jsx"
sync_changes "uytech-shared" "uytech-saas" "src/common/utils/formatters.js"

echo "✅ Sincronización completada!"
`;

  fs.writeFileSync(path.join(parentDir, 'sync-changes.sh'), syncScript);
  fs.chmodSync(path.join(parentDir, 'sync-changes.sh'), '755');

  // Script para deploy
  const deployScript = `#!/bin/bash

echo "🚀 Deployando aplicaciones..."

# Deploy versión actual
echo "📦 Deployando UYTECH Current..."
cd uytech-current
git add .
git commit -m "Update: $(date)"
git push origin main

# Deploy versión SaaS
echo "📦 Deployando UYTECH SaaS..."
cd ../uytech-saas
git add .
git commit -m "Update: $(date)"
git push origin main

echo "✅ Deploy completado!"
`;

  fs.writeFileSync(path.join(parentDir, 'deploy.sh'), deployScript);
  fs.chmodSync(path.join(parentDir, 'deploy.sh'), '755');
}

// Ejecutar si se llama directamente
if (require.main === module) {
  setupGitHubRepos().catch(console.error);
}

module.exports = { setupGitHubRepos }; 