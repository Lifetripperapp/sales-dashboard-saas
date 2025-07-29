import { useQuery } from '@tanstack/react-query';
import { buildApiUrl } from '../../../common/utils/apiConfig';
import { authFetch } from '../../../common/utils/fetch-wrapper';

/**
 * Custom hook to fetch all quantitative objectives for dashboard display
 * Gets all objectives without pagination and calculates YTD progress
 * 
 * @returns {object} Query result with data, isLoading, error, and refetch
 */
const useFetchObjectivesForDashboard = () => {
  return useQuery({
    queryKey: ['dashboardObjectives'],
    queryFn: async () => {
      try {
        // Fetch all objectives with a large limit to ensure we get everything
        const url = buildApiUrl('/api/quantitative-objectives?limit=100');
        
        console.log('Fetching quantitative objectives for dashboard:', url);
        
        const data = await authFetch(url);
        
        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch quantitative objectives for dashboard');
        }
        
        // Process the data for the dashboard chart
        const processedData = data.data.rows.map(objective => {
          // Calculate YTD (sum of all salesperson current values)
          let ytdValue = 0;
          
          if (objective.salespersons && objective.salespersons.length > 0) {
            ytdValue = objective.salespersons.reduce(
              (sum, sp) => sum + (sp.SalespersonQuantitativeObjective.currentValue || 0), 
              0
            );
          }
          
          return {
            id: objective.id,
            name: objective.name,
            type: objective.type,
            companyTarget: objective.companyTarget,
            ytdValue: ytdValue,
            progress: objective.companyTarget > 0 
              ? (ytdValue / objective.companyTarget) * 100 
              : 0,
            isGlobal: objective.isGlobal,
            status: objective.status
          };
        });
        
        return processedData;
      } catch (error) {
        console.error('Error fetching objectives for dashboard:', error);
        throw error;
      }
    },
    // RefetchOnWindowFocus should be true for dashboard to keep data fresh
    refetchOnWindowFocus: true,
    // Stale time of 2 minutes for dashboard
    staleTime: 1000 * 60 * 2,
  });
};

export default useFetchObjectivesForDashboard; 