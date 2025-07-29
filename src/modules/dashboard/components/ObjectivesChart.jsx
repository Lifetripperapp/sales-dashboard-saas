import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { formatCurrency, formatPercentage } from '../../../common/utils/formatters';

// Register required Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

/**
 * ObjectivesChart component for displaying individual charts for each objective
 * 
 * @param {Object[]} objectives - Array of quantitative objectives with targets and YTD values
 * @returns {JSX.Element} The charts component
 */
const ObjectivesChart = ({ objectives }) => {
  if (!objectives || objectives.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500 bg-white rounded-lg shadow-sm border border-gray-100">
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

  // Create individual chart for each objective
  const renderObjectiveChart = (objective) => {
    // Create chart data with just two bars - target and YTD
    const data = {
      labels: ['Target', 'YTD'],
      datasets: [
        {
          data: [objective.companyTarget, objective.ytdValue],
          backgroundColor: [
            'rgba(245, 130, 32, 0.7)', // UYTECH Orange for Target
            objective.progress >= 100 ? 'rgba(34, 197, 94, 0.7)' : // Green if >= 100%
            objective.progress >= 70 ? 'rgba(234, 179, 8, 0.7)' : // Yellow if >= 70%
            'rgba(239, 68, 68, 0.7)' // Red if < 70%
          ],
          borderColor: [
            'rgba(245, 130, 32, 1)',
            objective.progress >= 100 ? 'rgba(34, 197, 94, 1)' : 
            objective.progress >= 70 ? 'rgba(234, 179, 8, 1)' : 
            'rgba(239, 68, 68, 1)'
          ],
          borderWidth: 1
        }
      ]
    };

    // Options specific to this objective type
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y', // Horizontal bar chart
      scales: {
        x: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              // Format based on objective type
              switch (objective.type) {
                case 'currency':
                  if (value >= 1000000) {
                    return '$' + (value / 1000000).toFixed(1) + 'M';
                  } else if (value >= 1000) {
                    return '$' + (value / 1000).toFixed(1) + 'K';
                  }
                  return '$' + value;
                case 'percentage':
                  return value + '%';
                default:
                  if (value >= 1000) {
                    return (value / 1000).toFixed(1) + 'K';
                  }
                  return value;
              }
            }
          }
        }
      },
      plugins: {
        legend: {
          display: false // No need for legend with just one dataset
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = context.raw;
              return formatValue(value, objective.type);
            }
          }
        },
        title: {
          display: true,
          text: objective.name,
          font: {
            size: 16,
            weight: 'bold'
          }
        }
      }
    };

    // Progress indicator text
    const progressText = `Progress: ${objective.progress.toFixed(1)}%`;
    
    // Type indicator with appropriate styling
    const getTypeClass = (type) => {
      switch (type) {
        case 'currency':
          return 'bg-green-100 text-green-700';
        case 'percentage':
          return 'bg-purple-100 text-purple-700';
        default:
          return 'bg-indigo-100 text-indigo-700';
      }
    };

    return (
      <div key={objective.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-[#4A453F]">{objective.name}</h3>
            <div className="flex gap-2 mt-1">
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${getTypeClass(objective.type)}`}>
                {objective.type.charAt(0).toUpperCase() + objective.type.slice(1)}
              </span>
              {objective.isGlobal && (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  Global
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className={`text-sm font-medium ${
              objective.progress >= 100 ? 'text-green-600' :
              objective.progress >= 70 ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {progressText}
            </div>
            <div className="text-xs mt-1">
              <span className="font-medium">Target:</span> {formatValue(objective.companyTarget, objective.type)}
            </div>
            <div className="text-xs">
              <span className="font-medium">YTD:</span> {formatValue(objective.ytdValue, objective.type)}
            </div>
          </div>
        </div>
        <div className="h-[120px]">
          <Bar data={data} options={options} />
        </div>
      </div>
    );
  };

  // Group objectives by type for better visualization
  const currencyObjectives = objectives.filter(obj => obj.type === 'currency');
  const percentageObjectives = objectives.filter(obj => obj.type === 'percentage');
  const numberObjectives = objectives.filter(obj => obj.type === 'number');

  return (
    <div>
      {/* Sort by type and group objectives */}
      {currencyObjectives.length > 0 && (
        <div className="mb-6">
          <h3 className="text-md font-medium mb-3 text-[#4A453F]">Financial Objectives</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currencyObjectives.map(renderObjectiveChart)}
          </div>
        </div>
      )}
      
      {percentageObjectives.length > 0 && (
        <div className="mb-6">
          <h3 className="text-md font-medium mb-3 text-[#4A453F]">Percentage-Based Objectives</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {percentageObjectives.map(renderObjectiveChart)}
          </div>
        </div>
      )}
      
      {numberObjectives.length > 0 && (
        <div className="mb-6">
          <h3 className="text-md font-medium mb-3 text-[#4A453F]">Numerical Objectives</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {numberObjectives.map(renderObjectiveChart)}
          </div>
        </div>
      )}
    </div>
  );
};

export default ObjectivesChart; 