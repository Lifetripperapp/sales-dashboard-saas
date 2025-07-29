import React from 'react';
import { formatCurrency, formatPercentage } from '../../../common/utils/formatters';

/**
 * ObjectivesTable component displays objectives data in a tabular format
 * 
 * @param {Object[]} objectives - Array of quantitative objectives with targets and YTD values
 * @returns {JSX.Element} The table component
 */
const ObjectivesTable = ({ objectives }) => {
  if (!objectives || objectives.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-center text-gray-500">
        No objective data available
      </div>
    );
  }

  // Format value based on objective type
  const formatValue = (value, type) => {
    if (value === null || value === undefined) return '-';
    
    switch (type) {
      case 'currency':
        return formatCurrency(value);
      case 'percentage':
        return formatPercentage(value);
      default:
        return value.toLocaleString();
    }
  };

  // Get color class based on progress percentage
  const getProgressColorClass = (percentage) => {
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      {/* Table header */}
      <div className="grid grid-cols-12 bg-gray-50 border-b border-gray-200 py-3 px-4 text-xs font-medium text-[#4A453F]">
        <div className="col-span-4">OBJECTIVE</div>
        <div className="col-span-2 text-center">TYPE</div>
        <div className="col-span-2 text-center">TARGET</div>
        <div className="col-span-2 text-center">YTD</div>
        <div className="col-span-2 text-center">PROGRESS</div>
      </div>
      
      {/* Table rows */}
      {objectives.map((objective) => (
        <div key={objective.id} className="grid grid-cols-12 py-3 px-4 border-b border-gray-100 hover:bg-gray-50 items-center">
          {/* Name and description - 4 columns */}
          <div className="col-span-4">
            <div className="flex items-center gap-1">
              <h4 className="font-semibold text-[#4A453F]">{objective.name}</h4>
              {objective.isGlobal && (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  Global
                </span>
              )}
            </div>
          </div>
          
          {/* Type - 2 columns */}
          <div className="col-span-2 text-center">
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              objective.type === 'currency' ? 'bg-green-100 text-green-700' : 
              objective.type === 'percentage' ? 'bg-purple-100 text-purple-700' : 
              'bg-indigo-100 text-indigo-700'
            }`}>
              {objective.type.charAt(0).toUpperCase() + objective.type.slice(1)}
            </span>
          </div>
          
          {/* Target - 2 columns */}
          <div className="col-span-2 text-center font-semibold">
            {formatValue(objective.companyTarget, objective.type)}
          </div>
          
          {/* YTD - 2 columns */}
          <div className="col-span-2 text-center">
            {formatValue(objective.ytdValue, objective.type)}
          </div>
          
          {/* Progress - 2 columns */}
          <div className="col-span-2 flex items-center justify-center gap-2">
            <div className="w-16 bg-gray-200 rounded-full h-2">
              <div
                className={`${getProgressColorClass(objective.progress)} h-2 rounded-full`}
                style={{ width: `${Math.min(objective.progress, 100)}%` }}
              ></div>
            </div>
            <span className="text-xs font-medium">{objective.progress.toFixed(0)}%</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ObjectivesTable; 