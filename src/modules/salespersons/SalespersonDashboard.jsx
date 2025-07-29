import React, { useState } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import useFetchDashboardData from './hooks/useFetchDashboardData';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

/**
 * SalespersonDashboard component for company-wide performance metrics
 * @returns {JSX.Element} The SalespersonDashboard component
 */
const SalespersonDashboard = () => {
  console.log('Rendering SalespersonDashboard');
  const [timeRange, setTimeRange] = useState('year'); // 'year', 'quarter', 'month'
  
  // Fetch dashboard data using the custom hook
  const { data, isLoading, error } = useFetchDashboardData();
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#F58220] border-r-transparent align-[-0.125em]" role="status">
            <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
          </div>
          <p className="mt-2 text-[#4A453F]">Loading dashboard data...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center bg-red-100 p-6 rounded-lg max-w-md">
          <p className="text-red-700 font-medium mb-2">Error loading dashboard data</p>
          <p className="text-red-600">{error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-[#F58220] text-white rounded-md hover:bg-[#e67812]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  if (!data) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-[#4A453F]">No data available.</p>
      </div>
    );
  }
  
  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-UY', {
      style: 'currency',
      currency: 'UYU',
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  // Format percentage
  const formatPercentage = (value) => {
    return `${(value * 100).toFixed(1)}%`;
  };
  
  // Configure bar chart data
  const salesTrendsData = {
    labels: data.monthlyTrends?.map(item => item.month) || [],
    datasets: [
      {
        label: 'Monthly Sales',
        data: data.monthlyTrends?.map(item => item.amount) || [],
        backgroundColor: '#F58220',
        borderColor: '#E67812',
        borderWidth: 1,
      },
    ],
  };
  
  // Configure pie chart data
  const objectiveStatusData = {
    labels: ['Completed', 'In Progress', 'Pending', 'Not Completed'],
    datasets: [
      {
        data: [
          data.qualitativeObjectiveStats?.completed || 0,
          data.qualitativeObjectiveStats?.inProgress || 0,
          data.qualitativeObjectiveStats?.pending || 0,
          data.qualitativeObjectiveStats?.notCompleted || 0,
        ],
        backgroundColor: ['#4ade80', '#facc15', '#f97316', '#ef4444'],
        borderWidth: 1,
      },
    ],
  };
  
  // Bar chart options
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Monthly Sales Trends',
      },
    },
  };
  
  // Pie chart options
  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
      },
      title: {
        display: true,
        text: 'Qualitative Objectives Status',
      },
    },
  };
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-[#4A453F] mb-6">Sales Dashboard</h1>
      
      {/* Time range filter */}
      <div className="mb-6">
        <div className="inline-flex rounded-md shadow-sm">
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium rounded-l-md ${
              timeRange === 'month'
                ? 'bg-[#F58220] text-white'
                : 'bg-white text-[#4A453F] hover:bg-[#D3D0CD]'
            } border border-[#D3D0CD]`}
            onClick={() => setTimeRange('month')}
          >
            Month
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium ${
              timeRange === 'quarter'
                ? 'bg-[#F58220] text-white'
                : 'bg-white text-[#4A453F] hover:bg-[#D3D0CD]'
            } border-t border-b border-[#D3D0CD]`}
            onClick={() => setTimeRange('quarter')}
          >
            Quarter
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium rounded-r-md ${
              timeRange === 'year'
                ? 'bg-[#F58220] text-white'
                : 'bg-white text-[#4A453F] hover:bg-[#D3D0CD]'
            } border border-[#D3D0CD]`}
            onClick={() => setTimeRange('year')}
          >
            Year
          </button>
        </div>
      </div>
      
      {/* Key metrics cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Total Sales Card */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-sm font-medium text-[#4A453F] uppercase mb-2">Total Company Sales</h2>
          <p className="text-3xl font-bold text-[#F58220]">{formatCurrency(data.totalSales || 0)}</p>
          <p className="text-sm text-[#4A453F] mt-2">
            {data.salesComparison > 0
              ? `↑ ${formatPercentage(data.salesComparison)} vs previous period`
              : `↓ ${formatPercentage(Math.abs(data.salesComparison))} vs previous period`}
          </p>
        </div>
        
        {/* Quantitative Objectives Card */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-sm font-medium text-[#4A453F] uppercase mb-2">Quantitative Objectives</h2>
          <p className="text-3xl font-bold text-[#F58220]">{formatPercentage(data.quantitativeProgress || 0)}</p>
          <div className="w-full bg-[#D3D0CD] rounded-full h-2.5 mt-2">
            <div
              className="bg-[#F58220] h-2.5 rounded-full"
              style={{ width: `${(data.quantitativeProgress || 0) * 100}%` }}
            ></div>
          </div>
          <p className="text-sm text-[#4A453F] mt-2">Of annual targets</p>
        </div>
        
        {/* Qualitative Objectives Card */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-sm font-medium text-[#4A453F] uppercase mb-2">Qualitative Objectives</h2>
          <p className="text-3xl font-bold text-[#F58220]">
            {formatPercentage(data.qualitativeProgress || 0)}
          </p>
          <div className="w-full bg-[#D3D0CD] rounded-full h-2.5 mt-2">
            <div
              className="bg-[#F58220] h-2.5 rounded-full"
              style={{ width: `${(data.qualitativeProgress || 0) * 100}%` }}
            ></div>
          </div>
          <p className="text-sm text-[#4A453F] mt-2">Completion rate</p>
        </div>
        
        {/* Client Distribution Card */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-sm font-medium text-[#4A453F] uppercase mb-2">Total Clients</h2>
          <p className="text-3xl font-bold text-[#F58220]">{data.totalClients || 0}</p>
          <p className="text-sm text-[#4A453F] mt-2">Across {data.activeSalespersons || 0} active salespersons</p>
        </div>
      </div>
      
      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Sales Trends Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md lg:col-span-2">
          <div className="h-80">
            <Bar data={salesTrendsData} options={barOptions} />
          </div>
        </div>
        
        {/* Objective Status Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="h-80">
            <Pie data={objectiveStatusData} options={pieOptions} />
          </div>
        </div>
      </div>
      
      {/* Top Performers Table */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-medium text-[#4A453F] mb-4">Top Performers</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#D3D0CD]">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#4A453F] uppercase tracking-wider">
                  Salesperson
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#4A453F] uppercase tracking-wider">
                  Sales
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#4A453F] uppercase tracking-wider">
                  % of Target
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#4A453F] uppercase tracking-wider">
                  Clients
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#D3D0CD]">
              {data.topPerformers &&
                data.topPerformers.map((performer, index) => (
                  <tr key={performer.id} className={index % 2 === 0 ? 'bg-white' : 'bg-[#F9F9F9]'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#4A453F]">
                      {performer.nombre}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#4A453F]">
                      {formatCurrency(performer.sales)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#4A453F]">
                      <div className="flex items-center">
                        <span className="mr-2">{formatPercentage(performer.percentage)}</span>
                        <div className="w-20 bg-[#D3D0CD] rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${
                              performer.percentage >= 1
                                ? 'bg-green-500'
                                : performer.percentage >= 0.7
                                ? 'bg-[#F58220]'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(performer.percentage * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#4A453F]">
                      {performer.clientCount}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalespersonDashboard; 