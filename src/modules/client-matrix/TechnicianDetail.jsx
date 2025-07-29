import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Tabs, Tab, Box, Typography, Button } from '@mui/material';
import { buildApiUrl } from '../../common/utils/apiConfig';
import TechnicianEvaluationForm from './TechnicianEvaluationForm.jsx';

/**
 * TabPanel component for tab content
 */
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`technician-tabpanel-${index}`}
      aria-labelledby={`technician-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

/**
 * TechnicianDetail component for detailed technician information
 * @returns {JSX.Element} The TechnicianDetail component
 */
const TechnicianDetail = () => {
  // Get technician ID from URL
  const { id } = useParams();
  const navigate = useNavigate();
  
  // State for technician data
  const [technician, setTechnician] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTab, setCurrentTab] = useState(0);
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };
  
  // Fetch technician details
  useEffect(() => {
    const fetchTechnicianDetails = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(buildApiUrl(`/api/tecnicos/${id}`));
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error fetching technician details');
        }
        
        const data = await response.json();
        setTechnician(data.data);
      } catch (err) {
        console.error('Error fetching technician details:', err.message);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (id) {
      fetchTechnicianDetails();
    }
  }, [id]);
  
  // Refresh technician data
  const refreshTechnicianData = async () => {
    try {
      const response = await fetch(buildApiUrl(`/api/tecnicos/${id}`));
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error refreshing technician details');
      }
      
      const data = await response.json();
      setTechnician(data.data);
    } catch (err) {
      console.error('Error refreshing technician details:', err.message);
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg p-6 border border-neutral-light">
        <p className="text-center text-neutral-dark">Loading technician information...</p>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-6 border border-neutral-light">
        <p className="text-center text-red-500">Error: {error}</p>
        <div className="flex justify-center mt-4">
          <button
            onClick={() => navigate('/client-matrix/technicians')}
            className="px-4 py-2 bg-[#F58220] text-white rounded hover:bg-[#D36D1B] focus:outline-none focus:ring-2 focus:ring-[#F58220] focus:ring-opacity-50"
            aria-label="Back to technicians list"
          >
            Back to technicians list
          </button>
        </div>
      </div>
    );
  }
  
  // No technician found
  if (!technician) {
    return (
      <div className="bg-white shadow rounded-lg p-6 border border-neutral-light">
        <p className="text-center text-neutral-dark">Technician not found.</p>
        <div className="flex justify-center mt-4">
          <button
            onClick={() => navigate('/client-matrix/technicians')}
            className="px-4 py-2 bg-[#F58220] text-white rounded hover:bg-[#D36D1B] focus:outline-none focus:ring-2 focus:ring-[#F58220] focus:ring-opacity-50"
            aria-label="Back to technicians list"
          >
            Back to technicians list
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center">
          <Link
            to="/client-matrix/technicians"
            className="mr-4 text-[#4A453F] hover:text-[#F58220] transition-colors"
          >
            &larr; Back
          </Link>
          <h1 className="text-2xl font-bold text-[#4A453F]">
            Technician Details: {technician.nombre}
          </h1>
        </div>
        <div>
          <Button
            onClick={() => navigate(`/client-matrix/technicians/edit/${id}`)}
            variant="outlined"
            sx={{ mr: 2 }}
          >
            Edit
          </Button>
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg overflow-hidden border border-neutral-light">
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={currentTab} 
            onChange={handleTabChange}
            aria-label="technician tabs"
            sx={{
              '& .MuiTabs-indicator': {
                backgroundColor: '#F58220',
              },
              '& .Mui-selected': {
                color: '#F58220',
              },
            }}
          >
            <Tab label="Overview" id="technician-tab-0" aria-controls="technician-tabpanel-0" />
            <Tab label="Clients" id="technician-tab-1" aria-controls="technician-tabpanel-1" />
            <Tab label="Evaluation" id="technician-tab-2" aria-controls="technician-tabpanel-2" />
          </Tabs>
        </Box>
        
        <TabPanel value={currentTab} index={0}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-bold mb-4 text-[#4A453F]">Basic Information</h2>
              <div className="space-y-3">
                <div>
                  <span className="font-medium">Name:</span> {technician.nombre}
                </div>
                <div>
                  <span className="font-medium">Email:</span> {technician.email}
                </div>
                <div>
                  <span className="font-medium">Phone:</span> {technician.telefono || '-'}
                </div>
                <div>
                  <span className="font-medium">Specialty:</span> {technician.especialidad || '-'}
                </div>
                <div>
                  <span className="font-medium">Status:</span>{' '}
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      technician.estado === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {technician.estado === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Created:</span> {formatDate(technician.createdAt)}
                </div>
                <div>
                  <span className="font-medium">Last Updated:</span> {formatDate(technician.updatedAt)}
                </div>
              </div>
            </div>
            
            <div>
              <h2 className="text-xl font-bold mb-4 text-[#4A453F]">Additional Details</h2>
              <div className="space-y-3">
                <div>
                  <span className="font-medium">Number of Clients:</span> {technician.clientCount || 0}
                </div>
                <div>
                  <span className="font-medium">Notes:</span>
                  <p className="mt-2 text-gray-600 whitespace-pre-line">
                    {technician.notas || 'No notes available.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </TabPanel>
        
        <TabPanel value={currentTab} index={1}>
          <div>
            <h2 className="text-xl font-bold mb-4 text-[#4A453F]">Assigned Clients</h2>
            {/* Client list would go here */}
            <p>Client list functionality to be implemented.</p>
          </div>
        </TabPanel>
        
        <TabPanel value={currentTab} index={2}>
          <TechnicianEvaluationForm technicianId={id} />
        </TabPanel>
      </div>
    </div>
  );
};

export default TechnicianDetail; 