const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Script para crear la estructura de proyectos separados
 */
async function createSeparateProjects() {
  console.log('🚀 Creando estructura de proyectos separados...');

  const currentDir = process.cwd();
  const parentDir = path.dirname(currentDir);
  const projectName = path.basename(currentDir);

  // Crear directorios principales
  const directories = [
    'uytech-current',
    'uytech-saas',
    'shared'
  ];

  for (const dir of directories) {
    const fullPath = path.join(parentDir, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`✅ Creado directorio: ${dir}`);
    }
  }

  // Copiar archivos actuales a uytech-current
  console.log('\n📁 Copiando archivos actuales a uytech-current...');
  
  const filesToCopy = [
    'src',
    'server.js',
    'package.json',
    'package-lock.json',
    'vite.config.js',
    'tailwind.config.js',
    'postcss.config.js',
    'jest.config.js',
    'babel.config.js',
    'sequelize.config.js',
    'config',
    'migrations',
    'seeders',
    'scripts',
    'public',
    'index.html',
    'README.md',
    '.env.example',
    '.gitignore'
  ];

  for (const file of filesToCopy) {
    const sourcePath = path.join(currentDir, file);
    const destPath = path.join(parentDir, 'uytech-current', file);
    
    if (fs.existsSync(sourcePath)) {
      if (fs.lstatSync(sourcePath).isDirectory()) {
        copyDirectory(sourcePath, destPath);
      } else {
        fs.copyFileSync(sourcePath, destPath);
      }
      console.log(`✅ Copiado: ${file}`);
    }
  }

  // Crear estructura para uytech-saas
  console.log('\n🚀 Configurando uytech-saas...');
  
  const saasDir = path.join(parentDir, 'uytech-saas');
  
  // Crear package.json para SaaS
  const saasPackageJson = {
    "name": "uytech-saas",
    "version": "0.1.0",
    "private": true,
    "engines": {
      "node": "18.x",
      "npm": "10.x"
    },
    "dependencies": {
      "@auth0/auth0-react": "2.3.0",
      "@emotion/react": "11.14.0",
      "@emotion/styled": "11.14.0",
      "@heroicons/react": "2.2.0",
      "@mui/icons-material": "7.1.0",
      "@mui/material": "7.1.0",
      "@mui/x-date-pickers": "8.3.1",
      "@tanstack/react-query": "^5.74.11",
      "@testing-library/jest-dom": "^5.16.5",
      "@testing-library/react": "^13.4.0",
      "@testing-library/user-event": "^13.5.0",
      "@vitejs/plugin-react": "^4.4.1",
      "chart.js": "^4.4.9",
      "cors": "^2.8.5",
      "date-fns": "4.1.0",
      "dotenv": "^16.5.0",
      "express": "^4.18.2",
      "express-jwt": "8.5.1",
      "joi": "^17.13.3",
      "jwks-rsa": "3.2.0",
      "multer": "1.4.5-lts.2",
      "pg": "^8.15.6",
      "pg-hstore": "^2.3.4",
      "react": "^18.3.1",
      "react-chartjs-2": "^5.2.0",
      "react-dom": "^18.3.1",
      "react-hot-toast": "2.5.2",
      "react-query": "^3.39.3",
      "react-router-dom": "^6.30.0",
      "react-scripts": "5.0.1",
      "sequelize": "^6.37.7",
      "serve": "14.2.4",
      "stripe": "^14.0.0",
      "uuid": "^9.0.1",
      "vite": "^5.4.19",
      "web-vitals": "^2.1.4"
    },
    "scripts": {
      "dev": "vite",
      "build": "vite build",
      "lint": "eslint . --ext js,jsx --report-unused-disable-directives --max-warnings 0",
      "preview": "vite preview",
      "server": "nodemon server.js",
      "start": "node server.js",
      "test": "jest --passWithNoTests",
      "postinstall": "echo 'Skipping automatic build during install'",
      "start:static": "serve -s dist",
      "db:setup": "node scripts/setup-db.js",
      "db:setup:supabase": "node scripts/supabase-setup.js setup",
      "db:migrate:supabase": "node scripts/supabase-setup.js migrate",
      "format": "prettier --write 'src/**/*.{js,jsx,css}'",
      "auth0:review": "node scripts/auth0-review.js",
      "docs:review": "node scripts/documentation-agent.js"
    },
    "eslintConfig": {
      "extends": [
        "react-app",
        "react-app/jest"
      ]
    },
    "browserslist": {
      "production": [
        ">0.2%",
        "not dead",
        "not op_mini all"
      ],
      "development": [
        "last 1 chrome version",
        "last 1 firefox version",
        "last 1 safari version"
      ]
    },
    "devDependencies": {
      "@babel/preset-env": "7.27.1",
      "@babel/preset-react": "7.27.1",
      "autoprefixer": "^10.4.14",
      "babel-jest": "29.7.0",
      "eslint": "^8.40.0",
      "eslint-config-airbnb": "^19.0.4",
      "eslint-plugin-import": "^2.27.5",
      "eslint-plugin-jsx-a11y": "^6.7.1",
      "eslint-plugin-react": "^7.32.2",
      "eslint-plugin-react-hooks": "^4.6.0",
      "identity-obj-proxy": "3.0.0",
      "jest": "^29.7.0",
      "jsdom": "26.1.0",
      "nodemon": "^3.1.0",
      "postcss": "^8.4.23",
      "prettier": "^2.8.8",
      "sequelize-cli": "^6.6.2",
      "tailwindcss": "^3.4.17"
    }
  };

  fs.writeFileSync(
    path.join(saasDir, 'package.json'),
    JSON.stringify(saasPackageJson, null, 2)
  );

  // Crear estructura de directorios para SaaS
  const saasDirectories = [
    'src',
    'src/auth',
    'src/common',
    'src/common/components',
    'src/common/hooks',
    'src/common/utils',
    'src/config',
    'src/middleware',
    'src/models',
    'src/modules',
    'src/modules/dashboard',
    'src/modules/salespersons',
    'src/modules/objectives',
    'src/modules/client-matrix',
    'src/modules/admin',
    'src/routes',
    'src/services',
    'src/contexts',
    'scripts',
    'migrations',
    'seeders',
    'config',
    'public'
  ];

  for (const dir of saasDirectories) {
    const fullPath = path.join(saasDir, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  }

  // Crear README para SaaS
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

- **Frontend**: Vercel
- **Backend**: Supabase Edge Functions
- **Base de datos**: Supabase PostgreSQL
- **Autenticación**: Auth0
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

  fs.writeFileSync(path.join(saasDir, 'README.md'), saasReadme);

  // Crear estructura para shared
  console.log('\n🔄 Configurando shared components...');
  
  const sharedDir = path.join(parentDir, 'shared');
  const sharedDirectories = [
    'components',
    'utils',
    'styles',
    'hooks',
    'constants'
  ];

  for (const dir of sharedDirectories) {
    const fullPath = path.join(sharedDir, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  }

  // Crear README para shared
  const sharedReadme = `# Shared Components

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
\`\`\`
`;

  fs.writeFileSync(path.join(sharedDir, 'README.md'), sharedReadme);

  // Crear script de setup
  const setupScript = `#!/bin/bash

echo "🚀 Configurando proyectos UYTECH separados..."

# Instalar dependencias para uytech-current
echo "📦 Instalando dependencias para uytech-current..."
cd uytech-current
npm install

# Instalar dependencias para uytech-saas
echo "📦 Instalando dependencias para uytech-saas..."
cd ../uytech-saas
npm install

# Crear archivos .env de ejemplo
echo "📝 Creando archivos .env de ejemplo..."

# Para uytech-current
cd ../uytech-current
if [ ! -f .env ]; then
  cp .env.example .env 2>/dev/null || echo "# Variables de entorno para UYTECH Current" > .env
fi

# Para uytech-saas
cd ../uytech-saas
if [ ! -f .env ]; then
  echo "# Variables de entorno para UYTECH SaaS" > .env
  echo "SUPABASE_DATABASE_URL=" >> .env
  echo "STRIPE_SECRET_KEY=" >> .env
  echo "STRIPE_PUBLISHABLE_KEY=" >> .env
  echo "VITE_AUTH0_DOMAIN=" >> .env
  echo "VITE_AUTH0_CLIENT_ID=" >> .env
  echo "FRONTEND_URL=" >> .env
fi

echo "✅ Configuración completada!"
echo ""
echo "📁 Estructura creada:"
echo "├── uytech-current/     # Versión actual"
echo "├── uytech-saas/       # Versión SaaS"
echo "└── shared/            # Componentes compartidos"
echo ""
echo "🚀 Próximos pasos:"
echo "1. cd uytech-current && npm run dev    # Ejecutar versión actual"
echo "2. cd uytech-saas && npm run dev       # Ejecutar versión SaaS"
echo "3. Configurar variables de entorno"
echo "4. Implementar características SaaS"
`;

  fs.writeFileSync(path.join(parentDir, 'setup-projects.sh'), setupScript);
  fs.chmodSync(path.join(parentDir, 'setup-projects.sh'), '755');

  console.log('\n🎉 ¡Estructura de proyectos creada exitosamente!');
  console.log('\n📁 Estructura:');
  console.log('├── uytech-current/     # Versión actual');
  console.log('├── uytech-saas/       # Versión SaaS');
  console.log('└── shared/            # Componentes compartidos');
  
  console.log('\n🚀 Próximos pasos:');
  console.log('1. cd ../uytech-current && npm install');
  console.log('2. cd ../uytech-saas && npm install');
  console.log('3. Configurar variables de entorno');
  console.log('4. Implementar características SaaS');
}

/**
 * Función auxiliar para copiar directorios
 */
function copyDirectory(source, destination) {
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }

  const files = fs.readdirSync(source);
  
  for (const file of files) {
    const sourcePath = path.join(source, file);
    const destPath = path.join(destination, file);
    
    if (fs.lstatSync(sourcePath).isDirectory()) {
      copyDirectory(sourcePath, destPath);
    } else {
      fs.copyFileSync(sourcePath, destPath);
    }
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  createSeparateProjects().catch(console.error);
}

module.exports = { createSeparateProjects }; 