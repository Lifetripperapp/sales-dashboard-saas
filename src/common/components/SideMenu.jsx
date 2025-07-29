import React, { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import useFetchSalespersons from '../hooks/useFetchSalespersons';
import logoImage from '../../assets/logo.png';
import UserProfile from '../../auth/UserProfile.jsx';

/**
 * SideMenu component for navigation
 * @returns {JSX.Element} The SideMenu component
 */
const SideMenu = () => {
  console.log('Rendering SideMenu');
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Fetch list of salespersons for the bottom section
  const { data: salespersons, isLoading, error } = useFetchSalespersons(
    { staleTime: 5 * 60 * 1000 },
    { estado: 'active' },
    1,
    20
  );
  
  // Toggle mobile menu
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  // Active link style class
  const getActiveClass = (path) => {
    // Special case for client-matrix to prevent highlighting when in technicians
    if (path === '/client-matrix') {
      return location.pathname === path || 
        (location.pathname.startsWith(`${path}/`) && !location.pathname.startsWith(`${path}/technicians`))
        ? 'bg-[#F58220] text-white rounded-md'
        : 'text-[#4A453F] hover:bg-[#D3D0CD] rounded-md';
    }
    
    return location.pathname === path || location.pathname.startsWith(`${path}/`)
      ? 'bg-[#F58220] text-white rounded-md'
      : 'text-[#4A453F] hover:bg-[#D3D0CD] rounded-md';
  };

  return (
    <>
      {/* Mobile menu toggle button */}
      <button
        type="button"
        onClick={toggleMenu}
        className="fixed top-4 left-4 z-50 p-2 bg-[#F58220] text-white rounded-md md:hidden"
        aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isMenuOpen}
      >
        {isMenuOpen ? 'Close' : 'Menu'}
      </button>
      
      {/* Sidebar container */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white shadow-lg z-40 transition-all duration-300 overflow-y-auto
                  ${isMenuOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full md:translate-x-0'}`}
        aria-label="Main navigation"
      >
        {/* Top section - Logo */}
        <div className="flex justify-center py-6 border-b border-[#D3D0CD]">
          <img
            src={logoImage}
            alt="UYTECH Logo"
            className="h-[50px]"
          />
        </div>
        
        {/* Navigation links */}
        <nav className="px-4 py-4">
          <ul className="space-y-2">
            <li>
              <NavLink
                to="/dashboard"
                className={`block px-4 py-2 ${getActiveClass('/dashboard')}`}
                onClick={() => setIsMenuOpen(false)}
                aria-label="Dashboard"
              >
                Dashboard
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/salespersons"
                className={`block px-4 py-2 ${getActiveClass('/salespersons')}`}
                onClick={() => setIsMenuOpen(false)}
                aria-label="Salespersons"
              >
                Salespersons
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/client-matrix/technicians"
                className={`block px-4 py-2 ${getActiveClass('/client-matrix/technicians')}`}
                onClick={() => setIsMenuOpen(false)}
                aria-label="Technicians"
              >
                Technicians
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/objectives"
                className={`block px-4 py-2 ${getActiveClass('/objectives')}`}
                onClick={() => setIsMenuOpen(false)}
                aria-label="Objectives"
              >
                Objectives
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/client-matrix"
                className={`block px-4 py-2 ${getActiveClass('/client-matrix')}`}
                onClick={() => setIsMenuOpen(false)}
                aria-label="Client Matrix"
              >
                Client Matrix
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/admin"
                className={`block px-4 py-2 ${getActiveClass('/admin')}`}
                onClick={() => setIsMenuOpen(false)}
                aria-label="System Settings"
              >
                System Settings
              </NavLink>
            </li>
          </ul>
        </nav>
        
        {/* Bottom section - Salespersons list */}
        <div className="px-4 py-4 mt-4 border-t border-[#D3D0CD]">
          <h3 className="text-sm font-medium text-[#4A453F] mb-2">Salespersons</h3>
          
          {isLoading ? (
            <p className="text-sm text-[#4A453F]">Loading...</p>
          ) : error ? (
            <p className="text-sm text-red-500">Error loading salespersons</p>
          ) : (
            <ul className="space-y-1">
              {salespersons &&
                salespersons.rows &&
                salespersons.rows.map((salesperson) => (
                  <li key={salesperson.id}>
                    <Link
                      to={`/salespersons/${salesperson.id}`}
                      className="block px-4 py-1 text-sm hover:bg-[#D3D0CD] rounded-md"
                      onClick={() => setIsMenuOpen(false)}
                      aria-label={`View ${salesperson.nombre}'s profile`}
                    >
                      {salesperson.nombre}
                    </Link>
                  </li>
                ))}
            </ul>
          )}
        </div>
        
        {/* User Profile section */}
        <div className="px-4 py-4 mt-4 border-t border-[#D3D0CD]">
          <UserProfile />
        </div>
      </aside>
      
      {/* Overlay for mobile */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={toggleMenu}
          aria-hidden="true"
        ></div>
      )}
    </>
  );
};

export default SideMenu; 