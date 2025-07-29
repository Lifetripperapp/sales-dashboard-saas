import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ClientMatrix from './ClientMatrix';
import { useFetchMatrixData } from './hooks/useFetchClientServices';
import useFetchSalespersons from '../../common/hooks/useFetchSalespersons';
import useFetchTechnicians from './hooks/useFetchTechnicians';
import useSaveClientService from './hooks/useSaveClientService';

// Mock the hooks
jest.mock('./hooks/useFetchClientServices', () => ({
  useFetchMatrixData: jest.fn(),
}));
jest.mock('../../common/hooks/useFetchSalespersons', () => jest.fn());
jest.mock('./hooks/useFetchTechnicians', () => jest.fn());
jest.mock('./hooks/useSaveClientService', () => jest.fn());
jest.mock('./hooks/useSaveClient', () => ({
  __esModule: true,
  default: () => ({
    deleteClient: {
      mutate: jest.fn(),
    },
  }),
}));

// Create mock data
const mockMatrixData = {
  clients: [
    {
      id: '1',
      nombre: 'Client 1',
      vendedor: { id: '101', nombre: 'Vendedor 1' },
      tecnico: { id: '201', nombre: 'Tecnico 1' },
      contratoSoporte: true,
      fechaUltimoRelevamiento: '2023-10-01',
      servicios: [
        { id: '301', nombre: 'Backup' },
        { id: '302', nombre: 'Support 24/7' }
      ]
    },
    {
      id: '2',
      nombre: 'Client 2',
      vendedor: { id: '102', nombre: 'Vendedor 2' },
      tecnico: { id: '202', nombre: 'Tecnico 2' },
      contratoSoporte: false,
      fechaUltimoRelevamiento: null,
      servicios: [
        { id: '301', nombre: 'Backup' }
      ]
    }
  ],
  services: [
    { id: '301', nombre: 'Backup' },
    { id: '302', nombre: 'Support 24/7' },
    { id: '303', nombre: 'Cloud Storage' }
  ]
};

describe('ClientMatrix Component', () => {
  const queryClient = new QueryClient();
  
  // Setup mock implementations before each test
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock the API hooks
    useFetchMatrixData.mockReturnValue({
      data: mockMatrixData,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
    
    useFetchSalespersons.mockReturnValue({
      data: { rows: [{ id: '101', nombre: 'Vendedor 1' }, { id: '102', nombre: 'Vendedor 2' }] },
      isLoading: false,
    });
    
    useFetchTechnicians.mockReturnValue({
      data: { rows: [{ id: '201', nombre: 'Tecnico 1' }, { id: '202', nombre: 'Tecnico 2' }] },
      isLoading: false,
    });
    
    const assignServiceMock = {
      mutate: jest.fn(),
    };
    
    const unassignServiceMock = {
      mutate: jest.fn(),
    };
    
    useSaveClientService.mockReturnValue({
      assignService: assignServiceMock,
      unassignService: unassignServiceMock,
    });
  });
  
  // Helper function to render the component with necessary providers
  const renderClientMatrix = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ClientMatrix />
        </BrowserRouter>
      </QueryClientProvider>
    );
  };
  
  it('should render in summary view by default', () => {
    renderClientMatrix();
    
    // The component renders in summary view by default
    expect(screen.getByText('Client Matrix')).toBeInTheDocument();
    expect(screen.getByText('Summary')).toHaveClass('bg-[#F58220] text-white');
    expect(screen.getByText('Matrix')).not.toHaveClass('bg-[#F58220] text-white');
  });
  
  it('should display services count when "Show Services" toggle is off', () => {
    renderClientMatrix();
    
    // Verify services are shown as count
    expect(screen.getByText('2 services')).toBeInTheDocument();
    expect(screen.getByText('1 services')).toBeInTheDocument();
    
    // Service columns should not be visible
    expect(screen.queryByRole('columnheader', { name: 'Backup' })).not.toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'Support 24/7' })).not.toBeInTheDocument();
  });
  
  it('should display individual service columns when "Show Services" toggle is on', async () => {
    renderClientMatrix();
    
    // Find and click the "Show Services" toggle
    const toggleSwitch = screen.getByLabelText('Show Services');
    fireEvent.click(toggleSwitch);
    
    // Now service columns should be visible
    await waitFor(() => {
      expect(screen.getAllByRole('columnheader').some(col => col.textContent === 'Backup')).toBeTruthy();
      expect(screen.getAllByRole('columnheader').some(col => col.textContent === 'Support 24/7')).toBeTruthy();
      expect(screen.getAllByRole('columnheader').some(col => col.textContent === 'Cloud Storage')).toBeTruthy();
    });
    
    // The service count column should not be visible anymore
    expect(screen.queryByText('2 services')).not.toBeInTheDocument();
    expect(screen.queryByText('1 services')).not.toBeInTheDocument();
    
    // Checkboxes should be visible for each client-service combination
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBe(6); // 2 clients × 3 services = 6 checkboxes
  });
  
  it('should toggle services when clicking on a checkbox', async () => {
    renderClientMatrix();
    
    // Enable service columns view
    const toggleSwitch = screen.getByLabelText('Show Services');
    fireEvent.click(toggleSwitch);
    
    // Find checkboxes and click on a service that isn't currently assigned
    await waitFor(() => {
      const checkboxes = screen.getAllByRole('checkbox');
      // Find Client 1's Cloud Storage checkbox (not assigned)
      const cloudStorageCheckbox = checkboxes.find(
        checkbox => checkbox.getAttribute('aria-label') === "Add Cloud Storage service for Client 1"
      );
      expect(cloudStorageCheckbox).not.toBeChecked();
      
      // Click the checkbox to assign the service
      fireEvent.click(cloudStorageCheckbox);
      
      // Verify the assign service mutation was called
      expect(useSaveClientService().assignService.mutate).toHaveBeenCalledWith(
        { clientId: '1', servicioId: '303' },
        expect.objectContaining({
          onSuccess: expect.any(Function),
          onError: expect.any(Function),
        })
      );
    });
    
    // Now test removing a service
    await waitFor(() => {
      const checkboxes = screen.getAllByRole('checkbox');
      // Find Client 1's Backup checkbox (assigned)
      const backupCheckbox = checkboxes.find(
        checkbox => checkbox.getAttribute('aria-label') === "Remove Backup service for Client 1"
      );
      expect(backupCheckbox).toBeChecked();
      
      // Click the checkbox to unassign the service
      fireEvent.click(backupCheckbox);
      
      // Verify the unassign service mutation was called
      expect(useSaveClientService().unassignService.mutate).toHaveBeenCalledWith(
        { clientId: '1', servicioId: '301' },
        expect.objectContaining({
          onSuccess: expect.any(Function),
          onError: expect.any(Function),
        })
      );
    });
  });
  
  it('should reset "Show Services" toggle when clicking Reset Filters', () => {
    renderClientMatrix();
    
    // Enable service columns view
    const toggleSwitch = screen.getByLabelText('Show Services');
    fireEvent.click(toggleSwitch);
    
    // Verify services columns are shown
    expect(screen.getAllByRole('columnheader').some(col => col.textContent === 'Backup')).toBeTruthy();
    
    // Click Reset Filters button
    const resetButton = screen.getByRole('button', { name: 'Reset filters' });
    fireEvent.click(resetButton);
    
    // Verify we're back to services count view
    expect(screen.queryByRole('columnheader', { name: 'Backup' })).not.toBeInTheDocument();
    expect(screen.getByText('2 services')).toBeInTheDocument();
  });
}); 