import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import useFetchSalespersons from '../../common/hooks/useFetchSalespersons';

/**
 * SalespersonManagement component for managing salespersons
 * @returns {JSX.Element} The SalespersonManagement component
 */
const SalespersonManagement = () => {
  console.log('Rendering SalespersonManagement');
  
  // State for pagination and filtering
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [filters, setFilters] = useState({
    estado: '',
    search: '',
  });
  const [sortBy, setSortBy] = useState('nombre');
  const [sortOrder, setSortOrder] = useState('asc');
  
  // Fetch salespersons data with filters and pagination
  const { data, isLoading, error } = useFetchSalespersons(
    page,
    limit,
    filters,
    sortBy,
    sortOrder
  );
  
  // Format percentage
  const formatPercentage = (value) => {
    return `${(value * 100).toFixed(1)}%`;
  };
  
  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
    setPage(1); // Reset to first page when filters change
  };
  
  // Handle sort change
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };
  
  // Get sort indicator
  const getSortIndicator = (field) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? ' ▲' : ' ▼';
  };
  
  // Calculate total pages
  const totalPages = useMemo(() => {
    if (!data) return 0;
    return Math.ceil(data.count / limit);
  }, [data, limit]);
  
  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#F58220] border-r-transparent align-[-0.125em]" role="status">
            <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
          </div>
          <p className="mt-2 text-[#4A453F]">Loading salespersons...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-100 p-4 rounded-md text-red-700">
        <p className="font-medium">Error loading salespersons</p>
        <p>{error.message}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 bg-[#F58220] text-white rounded-md hover:bg-[#e67812]"
        >
          Retry
        </button>
      </div>
    );
  }
  
  if (!data || !data.rows || data.rows.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-[#4A453F]">No salespersons found. Try adjusting your filters.</p>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-semibold text-[#4A453F] mb-4 md:mb-0">Salespersons Management</h1>
        
        <Link
          to="/salespersons/new"
          className="bg-[#F58220] text-white px-4 py-2 rounded-md hover:bg-[#e67812] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F58220]"
        >
          Add New Salesperson
        </Link>
      </div>
      
      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-[#4A453F] mb-1">
              Search
            </label>
            <input
              type="text"
              id="search"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search by name or email"
              className="w-full px-3 py-2 border border-[#D3D0CD] rounded-md focus:outline-none focus:ring-2 focus:ring-[#F58220]"
            />
          </div>
          
          <div>
            <label htmlFor="estado" className="block text-sm font-medium text-[#4A453F] mb-1">
              Status
            </label>
            <select
              id="estado"
              name="estado"
              value={filters.estado}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-[#D3D0CD] rounded-md focus:outline-none focus:ring-2 focus:ring-[#F58220]"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="limit" className="block text-sm font-medium text-[#4A453F] mb-1">
              Show
            </label>
            <select
              id="limit"
              name="limit"
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-[#D3D0CD] rounded-md focus:outline-none focus:ring-2 focus:ring-[#F58220]"
            >
              <option value="5">5 per page</option>
              <option value="10">10 per page</option>
              <option value="20">20 per page</option>
              <option value="50">50 per page</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Salespersons Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#D3D0CD]" aria-label="Salespersons table">
            <thead className="bg-[#F9F9F9]">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-[#4A453F] uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('nombre')}
                  aria-sort={sortBy === 'nombre' ? sortOrder : 'none'}
                >
                  Name {getSortIndicator('nombre')}
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-[#4A453F] uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('email')}
                  aria-sort={sortBy === 'email' ? sortOrder : 'none'}
                >
                  Email {getSortIndicator('email')}
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-[#4A453F] uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('estado')}
                  aria-sort={sortBy === 'estado' ? sortOrder : 'none'}
                >
                  Status {getSortIndicator('estado')}
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-[#4A453F] uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('clientCount')}
                  aria-sort={sortBy === 'clientCount' ? sortOrder : 'none'}
                >
                  Clients {getSortIndicator('clientCount')}
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-[#4A453F] uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('quantitativeProgress')}
                  aria-sort={sortBy === 'quantitativeProgress' ? sortOrder : 'none'}
                >
                  Quantitative Progress {getSortIndicator('quantitativeProgress')}
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-[#4A453F] uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('qualitativeProgress')}
                  aria-sort={sortBy === 'qualitativeProgress' ? sortOrder : 'none'}
                >
                  Qualitative Progress {getSortIndicator('qualitativeProgress')}
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-center text-xs font-medium text-[#4A453F] uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#D3D0CD]">
              {data.rows.map((salesperson) => (
                <tr key={salesperson.id} className="hover:bg-[#F9F9F9]">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-[#4A453F]">{salesperson.nombre}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-[#4A453F]">{salesperson.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        salesperson.estado === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {salesperson.estado === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#4A453F]">
                    {salesperson.clientCount || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm text-[#4A453F] mr-2">
                        {formatPercentage(salesperson.quantitativeProgress || 0)}
                      </span>
                      <div className="w-20 bg-[#D3D0CD] rounded-full h-1.5">
                        <div
                          className="bg-[#F58220] h-1.5 rounded-full"
                          style={{ width: `${(salesperson.quantitativeProgress || 0) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm text-[#4A453F] mr-2">
                        {formatPercentage(salesperson.qualitativeProgress || 0)}
                      </span>
                      <div className="w-20 bg-[#D3D0CD] rounded-full h-1.5">
                        <div
                          className="bg-[#F58220] h-1.5 rounded-full"
                          style={{ width: `${(salesperson.qualitativeProgress || 0) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                    <Link
                      to={`/salespersons/${salesperson.id}`}
                      className="text-[#F58220] hover:text-[#e67812] mr-3"
                      aria-label={`View details for ${salesperson.nombre}`}
                    >
                      View
                    </Link>
                    <Link
                      to={`/salespersons/${salesperson.id}/edit`}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                      aria-label={`Edit ${salesperson.nombre}`}
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="px-6 py-4 flex items-center justify-between border-t border-[#D3D0CD]">
          <div className="flex-1 flex justify-between items-center">
            <p className="text-sm text-[#4A453F]">
              Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to{' '}
              <span className="font-medium">
                {Math.min(page * limit, data.count)}
              </span>{' '}
              of <span className="font-medium">{data.count}</span> results
            </p>
            
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className={`px-3 py-1 rounded-md ${
                  page === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-[#4A453F] hover:bg-[#D3D0CD] border border-[#D3D0CD]'
                }`}
                aria-label="Previous page"
              >
                Previous
              </button>
              {totalPages > 0 && (
                <span className="px-3 py-1 rounded-md bg-white border border-[#D3D0CD] text-[#4A453F]">
                  {page} / {totalPages}
                </span>
              )}
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
                className={`px-3 py-1 rounded-md ${
                  page >= totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-[#4A453F] hover:bg-[#D3D0CD] border border-[#D3D0CD]'
                }`}
                aria-label="Next page"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalespersonManagement; 