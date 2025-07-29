import React from 'react';

/**
 * ClientSummary component for displaying client-related metrics
 * 
 * @param {Object} props - Component props
 * @param {Object} props.summaryData - Client summary data
 * @returns {JSX.Element} The client summary component
 */
const ClientSummary = ({ summaryData }) => {
  if (!summaryData) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-center text-gray-500">
        No client data available
      </div>
    );
  }

  // Summary cards to display
  const summaryCards = [
    {
      id: 'total-clients',
      title: 'Total Clients',
      value: summaryData.totalClients || 0,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      id: 'active-contracts',
      title: 'Active Service Contracts',
      value: summaryData.activeServiceContracts || 0,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      id: 'total-services',
      title: 'Total Services',
      value: summaryData.totalServices || 0,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {summaryCards.map((card) => (
        <div 
          key={card.id}
          className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 transition-transform hover:transform hover:scale-[1.02]"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-[#4A453F]">{card.title}</h3>
              <p className="text-3xl font-bold mt-2 text-[#F58220]">{card.value.toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-full">
              {card.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ClientSummary; 