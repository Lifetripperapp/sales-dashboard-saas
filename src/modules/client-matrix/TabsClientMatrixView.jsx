import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ClientManagement from './ClientManagement';
import TecnicosManagement from './TecnicosManagement';
import ServiciosManagement from './ServiciosManagement';

/**
 * TabsClientMatrixView component that provides tab navigation between clients, technicians, and services
 * @returns {JSX.Element} The TabsClientMatrixView component
 */
const TabsClientMatrixView = () => {
  // Get location and query parameters
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const tab = queryParams.get('tab') || 'clients';
  const editClientId = queryParams.get('edit');
  
  // Log parameters for debugging
  console.log(`TabsClientMatrixView - tab: ${tab}, editClientId: ${editClientId}`);
  
  // State for active tab - always default to 'clients' if edit parameter is present
  const [activeTab, setActiveTab] = useState(editClientId ? 'clients' : tab);

  // Update active tab when URL query parameters change
  useEffect(() => {
    // If edit parameter exists, always set active tab to 'clients'
    if (editClientId) {
      setActiveTab('clients');
    } else if (tab) {
      setActiveTab(tab);
    }
  }, [tab, editClientId]);

  // Handle tab change while preserving other query parameters
  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    
    // Update URL with new tab while preserving other parameters
    const params = new URLSearchParams(location.search);
    params.set('tab', newTab);
    
    // Navigate with all parameters
    navigate(`${location.pathname}?${params.toString()}`);
  };

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-semibold text-[#4A453F] mb-4 md:mb-0">Client Matrix</h1>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-[#D3D0CD]">
        <ul className="flex flex-wrap -mb-px">
          <li className="mr-2">
            <button
              className={`inline-block py-3 px-4 text-sm font-medium border-b-2 ${
                activeTab === 'clients'
                  ? 'border-[#F58220] text-[#F58220]'
                  : 'border-transparent text-[#4A453F] hover:border-[#D3D0CD]'
              }`}
              onClick={() => handleTabChange('clients')}
              aria-current={activeTab === 'clients' ? 'page' : undefined}
            >
              Clients
            </button>
          </li>
          <li className="mr-2">
            <button
              className={`inline-block py-3 px-4 text-sm font-medium border-b-2 ${
                activeTab === 'services'
                  ? 'border-[#F58220] text-[#F58220]'
                  : 'border-transparent text-[#4A453F] hover:border-[#D3D0CD]'
              }`}
              onClick={() => handleTabChange('services')}
              aria-current={activeTab === 'services' ? 'page' : undefined}
            >
              Services
            </button>
          </li>
        </ul>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'clients' && <ClientManagement initialEditClientId={editClientId} />}
        {activeTab === 'services' && <ServiciosManagement />}
      </div>
    </div>
  );
};

export default TabsClientMatrixView; 