import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';

// Auth0 Components
import Auth0ProviderWithHistory from './auth/Auth0Provider.jsx';
import AuthCallback from './auth/AuthCallback.jsx';
import ProtectedRoute from './auth/ProtectedRoute.jsx';
import AuthInitializer from './auth/AuthInitializer.jsx';

// Components
import SideMenu from './common/components/SideMenu.jsx';

// Placeholder Components - Dashboard
import Dashboard from './modules/dashboard/Dashboard.jsx';

// Admin Tools Components
import TabsAdminToolsView from './modules/admin/TabsAdminToolsView.jsx';

// Placeholder Components - Salespersons
import SalespersonManagement from './modules/salespersons/SalespersonManagement.jsx';
import SalespersonFullDetail from './modules/salespersons/SalespersonFullDetail.jsx';
import SalespersonEdit from './modules/salespersons/SalespersonEdit.jsx';

// Placeholder Components - Objectives
import TabsObjectivesView from './modules/objectives/TabsObjectivesView.jsx';

// Placeholder Components - Client Matrix
import TabsClientMatrixView from './modules/client-matrix/TabsClientMatrixView.jsx';
import ClientDetail from './modules/client-matrix/ClienteDetail.jsx';
import TechnicianDetail from './modules/client-matrix/TechnicianDetail.jsx';
import ClientManagement from './modules/client-matrix/ClientManagement.jsx';
import TecnicosManagement from './modules/client-matrix/TecnicosManagement.jsx';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Layout Component that includes the SideMenu
const Layout = () => {
  return (
    <div className="flex min-h-screen bg-background">
      <SideMenu />
      
      {/* Main Content Area */}
      <main className="flex-1 p-6 md:ml-64 transition-all duration-300">
        <div className="container mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Toast notifications */}
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 5000,
          style: {
            background: '#fff',
            color: '#333',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            borderRadius: '0.375rem',
          },
          success: {
            style: {
              borderLeft: '4px solid #68D391',
            },
          },
          error: {
            style: {
              borderLeft: '4px solid #F56565',
            },
          },
          info: {
            style: {
              borderLeft: '4px solid #63B3ED',
            },
          },
        }}
      />
    </div>
  );
};

// Client Edit Redirect Component - redirects RESTful URLs to query parameter format
const ClientEditRedirect = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect to the query parameter version
    navigate(`/client-matrix/clients?edit=${id}`);
  }, [id, navigate]);
  
  return (
    <div className="text-center py-10">
      <p className="text-neutral-dark">Redirecting to edit page...</p>
    </div>
  );
};

// App Component
const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Auth0ProviderWithHistory>
          <AuthInitializer>
            <Routes>
              {/* Auth0 Callback Route */}
              <Route path="/callback" element={<AuthCallback />} />
              
              {/* Protected Routes */}
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }>
              {/* Dashboard Routes */}
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              
              {/* Admin Tools Routes */}
              <Route path="admin" element={<TabsAdminToolsView />} />
              
              {/* Salespersons Routes */}
              <Route path="salespersons" element={<SalespersonManagement />} />
              <Route path="salespersons/new" element={<SalespersonEdit />} />
              <Route path="salespersons/:id" element={<SalespersonFullDetail />} />
              <Route path="salespersons/:id/edit" element={<SalespersonEdit />} />
              
              {/* Objectives Routes */}
              <Route path="objectives" element={<TabsObjectivesView />} />
              
              {/* Client Matrix Routes */}
              {/* TabsClientMatrixView handles tab and edit client query parameters */}
              <Route path="client-matrix" element={<TabsClientMatrixView />} />
              {/* Direct access to client management, also used with edit client query parameter */}
              <Route path="client-matrix/clients" element={<TabsClientMatrixView />} />
              {/* View individual client details */}
              <Route path="client-matrix/clients/:id" element={<ClientDetail />} />
              {/* Handle RESTful edit URLs by redirecting to query parameter format */}
              <Route path="client-matrix/clients/:id/edit" element={<ClientEditRedirect />} />
              {/* Technicians management */}
              <Route path="client-matrix/technicians" element={<TecnicosManagement />} />
              {/* View individual technician details */}
              <Route path="client-matrix/technicians/:id" element={<TechnicianDetail />} />
              
              {/* 404 Route */}
              <Route path="*" element={
                <div className="text-center py-10">
                  <h1 className="text-2xl font-bold text-neutral-dark mb-4">404 - Page Not Found</h1>
                  <p className="text-neutral-dark">The page you are looking for does not exist.</p>
                </div>
              } />
            </Route>
          </Routes>
          </AuthInitializer>
        </Auth0ProviderWithHistory>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App; 