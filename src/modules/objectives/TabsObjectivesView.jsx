import React, { useState, useEffect } from 'react';
import ObjectivesView from './ObjectivesView';
import QuantitativeObjectivesView from './QuantitativeObjectivesView';

/**
 * TabsObjectivesView component that provides tab navigation between qualitative and quantitative objectives
 * @returns {JSX.Element} The TabsObjectivesView component
 */
const TabsObjectivesView = () => {
  // State for active tab
  const [activeTab, setActiveTab] = useState('quantitative'); // Changed default to 'quantitative'
  
  console.log(`TabsObjectivesView rendering with activeTab: ${activeTab}`);
  
  useEffect(() => {
    console.log(`Tab changed to: ${activeTab}`);
  }, [activeTab]);

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-semibold text-[#4A453F] mb-4 md:mb-0">Objectives</h1>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-[#D3D0CD]">
        <ul className="flex flex-wrap -mb-px">
          <li className="mr-2">
            <button
              className={`inline-block py-3 px-4 text-sm font-medium border-b-2 ${
                activeTab === 'quantitative'
                  ? 'border-[#F58220] text-[#F58220]'
                  : 'border-transparent text-[#4A453F] hover:border-[#D3D0CD]'
              }`}
              onClick={() => {
                console.log('Quantitative tab clicked');
                setActiveTab('quantitative');
              }}
              aria-current={activeTab === 'quantitative' ? 'page' : undefined}
            >
              Quantitative Objectives
            </button>
          </li>
          <li className="mr-2">
            <button
              className={`inline-block py-3 px-4 text-sm font-medium border-b-2 ${
                activeTab === 'qualitative'
                  ? 'border-[#F58220] text-[#F58220]'
                  : 'border-transparent text-[#4A453F] hover:border-[#D3D0CD]'
              }`}
              onClick={() => {
                console.log('Qualitative tab clicked');
                setActiveTab('qualitative');
              }}
              aria-current={activeTab === 'qualitative' ? 'page' : undefined}
            >
              Qualitative Objectives
            </button>
          </li>
        </ul>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'qualitative' && (
          <>
            <div style={{ display: 'none' }}>Active tab: qualitative</div>
            <ObjectivesView />
          </>
        )}
        {activeTab === 'quantitative' && (
          <>
            <div style={{ display: 'none' }}>Active tab: quantitative</div>
            <QuantitativeObjectivesView />
          </>
        )}
      </div>
    </div>
  );
};

export default TabsObjectivesView; 