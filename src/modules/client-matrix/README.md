# Client Matrix Module

## Overview
The Client Matrix module provides comprehensive management of clients, services, and technicians for the UYTECH Sales Dashboard. This module enables managers to track client relationships, assigned services, and technician assignments.

## Features
- **Client Management**: View, create, edit, and delete client records
- **Services Management**: Manage service offerings including creation, editing, and assignment to clients
- **Technicians Management**: Track technical staff assigned to services and clients
- **Client Matrix View**: Visualize client-service relationships in a matrix format

## Module Structure
```
client-matrix/
├── ClientMatrix.jsx       # Main module router component
├── ClientManagement.jsx   # Client listing and management
├── ClienteDetail.jsx      # Detailed client information view
├── ServiciosManagement.jsx # Services management interface
├── TecnicosManagement.jsx # Technicians management interface
└── hooks/                 # Custom React Query hooks for data fetching
    ├── useClientDetail.js
    ├── useFetchClients.js
    ├── useFetchServices.js
    ├── useFetchTechnicians.js
    ├── useSaveClient.js
    ├── useSaveService.js
    └── useSaveTechnician.js
```

## API Integration
This module interacts with the following API endpoints:
- `/api/clientes` - Client CRUD operations
- `/api/servicios` - Service CRUD operations
- `/api/tecnicos` - Technician CRUD operations
- `/api/client-service` - Client-service relationship management

## Usage
The module is accessible through the main navigation at `/client-matrix` with the following routes:
- `/client-matrix` - Main client matrix view
- `/client-matrix/clients` - Client management
- `/client-matrix/services` - Services management 
- `/client-matrix/technicians` - Technicians management
- `/client-matrix/clients/:id` - Client detail view

## Development Guidelines
When extending this module:
1. Follow the established React Query pattern for data fetching
2. Maintain consistent UI using Tailwind CSS utility classes per the style guide
3. Implement proper error handling and loading states
4. Use the hooks directory for all data operations

## Maintainers
This module is maintained by the Client Management team. For questions or issues, contact the team lead. 