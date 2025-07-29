import React from 'react';
import useFetchObjectivesForDashboard from './hooks/useFetchObjectivesForDashboard';
import useFetchClientSummary from './hooks/useFetchClientSummary';
import ObjectivesChart from './components/ObjectivesChart';
import ClientSummary from './components/ClientSummary';

/**
 * Dashboard component for displaying company-wide metrics and visualizations
 * @returns {JSX.Element} The Dashboard component
 */
const Dashboard = () => {
  // Fetch objectives data for the dashboard
  const { 
    data: objectives, 
    isLoading: objectivesLoading, 
    error: objectivesError 
  } = useFetchObjectivesForDashboard();

  // Fetch client summary data
  const {
    data: clientSummary,
    isLoading: clientSummaryLoading,
    error: clientSummaryError
  } = useFetchClientSummary();

  // Render loading state
  const renderLoading = (message = 'Loading dashboard data...') => (
    <div className="flex justify-center items-center h-64">
      <div className="text-center">
        <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-[#F58220] border-r-transparent"></div>
        <p className="mt-4 text-lg text-[#4A453F]">{message}</p>
      </div>
    </div>
  );

  // Render error state
  const renderError = (error, message = 'Failed to load dashboard data') => (
    <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 mb-6">
      <div className="text-center text-red-600">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h3 className="text-xl font-semibold mb-2">Error Loading Dashboard</h3>
        <p className="text-gray-600">{error?.message || message}</p>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4">
      <h1 className="text-2xl font-semibold mb-6 text-[#4A453F]">UYTECH Sales Dashboard</h1>
      
      {/* Client Summary section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-[#4A453F]">Client Summary</h2>
        
        {clientSummaryLoading ? (
          renderLoading('Loading client data...')
        ) : clientSummaryError ? (
          renderError(clientSummaryError, 'Failed to load client summary')
        ) : (
          <ClientSummary summaryData={clientSummary} />
        )}
      </div>
      
      {/* Quantitative Objectives section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-[#4A453F]">Quantitative Objectives</h2>
        
        {objectivesLoading ? (
          renderLoading('Loading objectives data...')
        ) : objectivesError ? (
          renderError(objectivesError, 'Failed to load objectives data')
        ) : (
          <ObjectivesChart objectives={objectives} />
        )}
      </div>
    </div>
  );
};

export default Dashboard; 