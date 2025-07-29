import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { buildApiUrl } from '../../common/utils/apiConfig';
import { formatDate } from '../../common/utils/formatters';
import { toast } from 'react-hot-toast';
import { authFetch } from '../../common/utils/fetch-wrapper';
import { useAuth0 } from '@auth0/auth0-react';

// Database service functions
const fetchBackups = async () => {
  const data = await authFetch(buildApiUrl('/api/database/list'));
  return data;
};

const createBackup = async () => {
  console.log('Initiating database backup...');
  
  try {
    const responseData = await authFetch(buildApiUrl('/api/database/backup'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Parsed backup response:', responseData);
    return responseData;
  } catch (error) {
    console.error('Error in createBackup function:', error);
    throw error;
  }
};

const deleteBackup = async (filename) => {
  const data = await authFetch(buildApiUrl(`/api/database/backup/${filename}`), {
    method: 'DELETE',
  });
  return data;
};

const restoreBackup = async (formData, onProgress, accessToken) => {
  try {
    // Use XMLHttpRequest for better tracking of the restore process
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.open('POST', buildApiUrl('/api/database/restore-with-upload'));
      
      // Add JWT token to headers for authentication
      if (accessToken) {
        xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
      }
      
      // Set a longer timeout (5 minutes)
      xhr.timeout = 5 * 60 * 1000;
      
      xhr.onload = function() {
        // Log raw response for debugging
        console.log('Response received:', {
          status: xhr.status,
          statusText: xhr.statusText,
          responseType: xhr.responseType,
          responseLength: xhr.responseText?.length || 0
        });
        
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            // Try to parse the response as JSON
            console.log('Parsing response text:', xhr.responseText.substring(0, 100) + '...');
            
            let response;
            
            // Handle case where response is empty or whitespace
            if (!xhr.responseText || !xhr.responseText.trim()) {
              console.error('Empty response received');
              response = { 
                status: "warning", 
                message: "Server returned empty response",
                details: "The server responded with an empty body"
              };
            } else {
              response = JSON.parse(xhr.responseText);
            }
            
            // Log successful parsing
            console.log('Successfully parsed response:', response);
            
            // Handle the response appropriately
            handleRestoreResponse(response);
            resolve(response);
          } catch (e) {
            console.error('JSON parse error:', e, 'Response text:', xhr.responseText);
            
            // Create a fallback error response
            const response = {
              status: "error",
              message: "Invalid response format",
              details: "The server response could not be parsed as JSON",
              error: e.message
            };
            
            // Still handle this as a regular response to show appropriate UI
            handleRestoreResponse(response);
            resolve(response);
          }
        } else {
          try {
            const errorJson = JSON.parse(xhr.responseText);
            const errorMessage = errorJson.message || 'Server responded with status ' + xhr.status;
            console.error('Error response:', errorMessage);
            reject(new Error(errorMessage));
          } catch (e) {
            console.error('Error parsing error response:', e);
            reject(new Error('Server responded with status ' + xhr.status));
          }
        }
      };
      
      // Error handling
      xhr.onerror = function(e) {
        console.error('Network error occurred:', e);
        reject(new Error('Network error occurred'));
      };
      
      xhr.ontimeout = function() {
        console.error('Request timed out after', xhr.timeout / 1000, 'seconds');
        reject(new Error('Request timed out'));
      };
      
      // Upload progress
      if (onProgress) {
        xhr.upload.onprogress = function(e) {
          if (e.lengthComputable) {
            const percentComplete = Math.round((e.loaded / e.total) * 100);
            console.log('Upload progress:', percentComplete + '%');
            onProgress(percentComplete);
          }
        };
      }
      
      // Send the form data
      console.log('Sending form data, size:', formData ? 'formData present' : 'formData not present');
      xhr.send(formData);
    });
  } catch (error) {
    console.error('Error in restoreBackup function:', error);
    throw error;
  }
};

// Check database and tools status
const checkDatabaseStatus = async () => {
  const data = await authFetch(buildApiUrl('/api/database/status'));
  return data;
};

const DatabaseManagement = () => {
  const queryClient = useQueryClient();
  const { getAccessTokenSilently } = useAuth0();
  const [file, setFile] = useState(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [restoreProgress, setRestoreProgress] = useState(0);
  const [restorePhase, setRestorePhase] = useState('');
  
  // Reset progress when a new file is selected
  useEffect(() => {
    setRestoreProgress(0);
    setRestorePhase('');
  }, [file]);
  
  // Fetch backups
  const { 
    data: backupsData, 
    isLoading: isLoadingBackups, 
    error: backupsError 
  } = useQuery({
    queryKey: ['database-backups'],
    queryFn: fetchBackups,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
  
  // Fetch database status
  const {
    data: statusData,
    isLoading: isLoadingStatus,
    error: statusError,
    refetch: refetchStatus
  } = useQuery({
    queryKey: ['database-status'],
    queryFn: checkDatabaseStatus,
    enabled: showStatus, // Only run when status panel is shown
  });
  
  // Create backup mutation
  const { mutate: createBackupMutation, isPending: isCreatingBackup, error: createError } = useMutation({
    mutationFn: createBackup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['database-backups'] });
    },
  });
  
  // Delete backup mutation
  const { mutate: deleteBackupMutation, isPending: isDeletingBackup } = useMutation({
    mutationFn: deleteBackup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['database-backups'] });
    },
  });
  
  // Restore backup mutation
  const { mutate: restoreBackupMutation, isPending: isRestoringBackup, error: restoreError } = useMutation({
    mutationFn: async (formData) => {
      setRestorePhase('uploading');
      
      // Get the access token for authentication
      const accessToken = await getAccessTokenSilently({
        audience: import.meta.env.VITE_AUTH0_AUDIENCE,
        scope: 'openid profile email'
      });
      
      return restoreBackup(formData, (progress) => {
        setRestoreProgress(progress);
        if (progress >= 100) {
          setRestorePhase('processing');
        }
      }, accessToken);
    },
    onSuccess: (data) => {
      setFile(null);
      setConfirmRestore(false);
      setIsRestoring(false);
      setRestoreProgress(0);
      setRestorePhase('');
      
      // Show success message
      toast.success(
        <div>
          <p className="font-semibold">Restore completed successfully!</p>
          {data.message && <p className="mt-2">{data.message}</p>}
        </div>
      );
      
      queryClient.invalidateQueries({ queryKey: ['database-backups'] });
    },
    onError: (error) => {
      setRestorePhase('error');
      toast.error(
        <div>
          <p className="font-semibold">Restore failed</p>
          {error instanceof Error && <p className="mt-2">{error.message}</p>}
        </div>
      );
    }
  });
  
  // Handle file input change
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      
      // Display file information
      console.log(`Selected file: ${selectedFile.name}, size: ${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`);
    }
  };
  
  // Handle backup file upload
  const handleRestore = (e) => {
    e.preventDefault();
    if (!file) return;
    
    // Show confirmation dialog
    setConfirmRestore(true);
  };
  
  // Confirm restore action
  const confirmRestoreAction = () => {
    const formData = new FormData();
    formData.append('backupFile', file);
    setIsRestoring(true);
    restoreBackupMutation(formData);
  };
  
  // Handle backup creation
  const handleCreateBackup = () => {
    createBackupMutation({}, {
      onSuccess: (response) => {
        console.log('Backup creation successful:', response);
        
        // Check if this is a Heroku-specific message with suggestion
        if (response.suggestion && response.details && response.message && 
            response.message.includes('not available in Heroku')) {
          toast.success(
            <div>
              <p className="font-semibold">{response.message}</p>
              <p className="mt-2">{response.details}</p>
              <p className="mt-2 p-2 bg-gray-100 font-mono text-sm rounded">{response.suggestion}</p>
            </div>,
            { duration: 10000 } // Keep this message visible longer
          );
        } else {
          // Standard success message
          toast.success(
            <div>
              <p className="font-semibold">Backup created successfully!</p>
              {response.filename && <p className="mt-2">Filename: {response.filename}</p>}
            </div>
          );
        }
        
        // Refresh the backups list
        queryClient.invalidateQueries({ queryKey: ['database-backups'] });
      },
      onError: (error) => {
        console.error('Backup creation error:', error);
        toast.error(
          <div>
            <p className="font-semibold">Backup creation failed</p>
            <p className="mt-2">{error.message}</p>
          </div>
        );
      }
    });
  };
  
  // Handle backup deletion
  const handleDeleteBackup = (filename) => {
    if (window.confirm(`Are you sure you want to delete this backup: ${filename}?`)) {
      deleteBackupMutation(filename);
    }
  };
  
  // Handle backup download
  const handleDownloadBackup = async (filename) => {
    try {
      // Get the access token for authentication
      const accessToken = await getAccessTokenSilently({
        audience: import.meta.env.VITE_AUTH0_AUDIENCE,
        scope: 'openid profile email'
      });
      
      // Create a temporary link with authorization
      const response = await fetch(buildApiUrl(`/api/database/download/${filename}`), {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to download backup');
      }
      
      // Get the blob and create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading backup:', error);
      toast.error('Failed to download backup');
    }
  };
  
  // Render restore progress indicator
  const renderRestoreProgress = () => {
    if (!isRestoringBackup && restorePhase !== 'error') return null;
    
    let progressText = '';
    let progressBarColor = 'bg-[#F58220]';
    
    switch (restorePhase) {
      case 'uploading':
        progressText = `Uploading backup file (${Math.round(restoreProgress)}%)`;
        break;
      case 'processing':
        progressText = 'Processing database restore (this may take several minutes)';
        break;
      case 'error':
        progressText = 'Error occurred during restore';
        progressBarColor = 'bg-red-500';
        break;
      default:
        progressText = 'Preparing restore';
    }
    
    return (
      <div className="mt-4">
        <p className="text-sm text-gray-700 mb-1">{progressText}</p>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className={`h-2.5 rounded-full ${progressBarColor}`} 
            style={{ width: `${restorePhase === 'processing' ? '100' : Math.round(restoreProgress)}%`, 
                     transition: 'width 0.5s ease-in-out' }}
          ></div>
        </div>
        {restorePhase === 'processing' && (
          <p className="text-xs text-gray-500 mt-1 italic">
            The database is being restored. Please do not close this page.
            This process may take several minutes depending on the size of the backup.
          </p>
        )}
      </div>
    );
  };
  
  const handleRestoreResponse = (response) => {
    console.log('Handling restore response:', response);
    
    // Reset the restore state
    setIsRestoring(false);
    setRestoreProgress(0);
    setRestorePhase('');
    
    // Check if this is an error response from our error handling
    if (response.status === 'error') {
      toast.error(
        <div>
          <p className="font-semibold">{response.message}</p>
          {response.details && <p className="mt-2">{response.details}</p>}
        </div>,
        { duration: 7000 }
      );
      return;
    }
    
    // Check if this is a Heroku-specific message
    if (response.suggestion && response.suggestion.includes('heroku pg:backups:restore')) {
      // This is a Heroku response about limitations
      toast.success(
        <div>
          <p className="font-semibold">{response.message}</p>
          <p className="mt-2">{response.details}</p>
          <p className="mt-2 p-2 bg-gray-100 font-mono text-sm rounded">{response.suggestion}</p>
        </div>,
        { duration: 10000 } // Keep this message visible longer
      );
      return;
    }

    // Handle normal restore response from local environment
    if (response.success) {
      toast.success(
        <div>
          <p className="font-semibold">Restore completed successfully!</p>
          {response.message && <p className="mt-2">{response.message}</p>}
        </div>
      );
      refetchBackups();
    } else {
      // Show a warning for any other response - use success with different styling since warning may not exist
      toast.error(
        <div>
          <p className="font-semibold">Restore result unclear</p>
          <p className="mt-2">The server response did not clearly indicate success or failure.</p>
          {response.message && <p className="mt-2">{response.message}</p>}
        </div>
      );
    }
  };
  
  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-[#4A453F]">Database Management</h1>
        <button
          onClick={() => { setShowStatus(!showStatus); if (!showStatus) refetchStatus(); }}
          className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
        >
          {showStatus ? 'Hide Status' : 'Show Diagnostics'}
        </button>
      </div>
      
      {/* Database Status Panel */}
      {showStatus && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Database System Diagnostics</h2>

          {isLoadingStatus ? (
            <div className="flex justify-center items-center h-24">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F58220]"></div>
            </div>
          ) : statusError ? (
            <div className="p-3 bg-red-100 text-red-700 rounded-md">
              Error checking database status: {statusError.message}
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Database Connection Status */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-2">Database Connection</h3>
                  <div className="flex items-center mb-2">
                    <div className={`h-3 w-3 rounded-full mr-2 ${(statusData?.diagnostics?.database?.connected) ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span>{(statusData?.diagnostics?.database?.connected) ? 'Connected' : 'Disconnected'}</span>
                  </div>
                  {(statusData?.diagnostics?.database?.connected) ? (
                    <div className="text-sm text-gray-600">
                      <p>Host: {statusData?.diagnostics?.database?.host || 'N/A'}</p>
                      <p>Database: {statusData?.diagnostics?.database?.database || 'N/A'}</p>
                      <p>User: {statusData?.diagnostics?.database?.user || 'N/A'}</p>
                    </div>
                  ) : (
                    <div className="text-sm text-red-600">
                      {statusData?.diagnostics?.database?.error || 'Connection information not available'}
                    </div>
                  )}
                </div>

                {/* PostgreSQL Tools Status */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-2">PostgreSQL Tools</h3>
                  <div className="flex items-center mb-2">
                    <div className={`h-3 w-3 rounded-full mr-2 ${statusData?.diagnostics?.tools?.pg_dump ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span>pg_dump: {statusData?.diagnostics?.tools?.pg_dump ? 'Available' : 'Not Found'}</span>
                  </div>
                  <div className="flex items-center mb-2">
                    <div className={`h-3 w-3 rounded-full mr-2 ${statusData?.diagnostics?.tools?.pg_restore ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span>pg_restore: {statusData?.diagnostics?.tools?.pg_restore ? 'Available' : 'Not Found'}</span>
                  </div>
                  {(!statusData?.diagnostics?.tools?.pg_dump || !statusData?.diagnostics?.tools?.pg_restore) && (
                    <div className="mt-2 p-2 bg-yellow-100 text-yellow-800 text-sm rounded">
                      <p className="font-semibold">Warning:</p>
                      <p>PostgreSQL client tools must be installed for backup/restore functionality.</p>
                      <p>Install with: `brew install postgresql` (Mac) or `apt-get install postgresql-client` (Linux)</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Backup Directory Status */}
              <div className="border rounded-lg p-4 mt-4">
                <h3 className="text-lg font-medium mb-2">Backup Directory</h3>
                <div className="flex items-center mb-2">
                  <div className={`h-3 w-3 rounded-full mr-2 ${
                    statusData?.diagnostics?.tools?.backup_dir?.exists && statusData?.diagnostics?.tools?.backup_dir?.writable
                      ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span>Status: {
                    statusData?.diagnostics?.tools?.backup_dir?.exists && statusData?.diagnostics?.tools?.backup_dir?.writable
                      ? 'Ready (exists and writable)' : 'Issue detected'
                  }</span>
                </div>
                <div className="text-sm text-gray-600">
                  <p>Path: {statusData?.diagnostics?.tools?.backup_dir?.path || 'N/A'}</p>
                  {statusData?.diagnostics?.tools?.backup_dir?.error && (
                    <p className="text-red-600">Error: {statusData?.diagnostics?.tools?.backup_dir?.error}</p>
                  )}
                </div>
              </div>
              
              {/* Heroku-specific notes if applicable */}
              {statusData?.diagnostics?.note && (
                <div className="border rounded-lg p-4 mt-4 bg-blue-50 border-blue-200">
                  <h3 className="text-lg font-medium mb-2">Environment Notes</h3>
                  <p className="text-sm text-gray-700">{statusData.diagnostics.note}</p>
                  {statusData.diagnostics.suggestion && (
                    <p className="text-sm font-mono mt-2 bg-blue-100 p-2 rounded">{statusData.diagnostics.suggestion}</p>
                  )}
                </div>
              )}

              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => refetchStatus()}
                  className="bg-[#4A453F] text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                >
                  Refresh Status
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Database Backup Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Create Database Backup</h2>
        <p className="text-gray-600 mb-4">
          Create a backup of the current database. This will generate a downloadable file that can be used to restore the database later.
        </p>
        <button
          className="bg-[#F58220] text-white px-4 py-2 rounded-md hover:bg-[#e67812] transition-colors"
          onClick={handleCreateBackup}
          disabled={isCreatingBackup}
        >
          {isCreatingBackup ? 'Creating Backup...' : 'Create New Backup'}
        </button>
        
        {createError && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
            Error creating backup: {createError.message}
          </div>
        )}
      </div>
      
      {/* Database Restore Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Restore Database</h2>
        <p className="text-gray-600 mb-4">
          Restore the database from a backup file. This will replace all current data with the data from the backup file.
          <br/>
          <span className="text-sm text-yellow-600">Note: Database restore can take several minutes for large backups. Do not refresh or close the page during this process.</span>
        </p>
        <form onSubmit={handleRestore}>
          <div className="mb-4">
            <input
              type="file"
              accept=".dump,.sql"
              onChange={handleFileChange}
              className="block w-full text-gray-700 border border-gray-300 rounded py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#F58220]"
              disabled={isRestoring || isRestoringBackup}
            />
            {file && (
              <p className="mt-1 text-sm text-gray-600">
                Selected file: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>
          <button
            type="submit"
            className="bg-[#4A453F] text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
            disabled={!file || isRestoring || isRestoringBackup}
          >
            {isRestoringBackup ? 'Restoring...' : 'Restore Database'}
          </button>
          
          {renderRestoreProgress()}
        </form>
        
        {restoreError && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
            <p className="font-semibold">Error restoring database:</p>
            <p>{restoreError.message}</p>
            <p className="text-sm mt-2">
              If you were restoring a large backup, the server might still be processing it.
              Try refreshing the page in a few minutes to check if the restore completed successfully.
            </p>
          </div>
        )}
      </div>
      
      {/* Backups List */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Available Backups</h2>
        
        {isLoadingBackups ? (
          <div className="flex justify-center items-center h-24">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F58220]"></div>
          </div>
        ) : backupsError ? (
          <div className="p-3 bg-red-100 text-red-700 rounded-md">
            Error loading backups: {backupsError.message}
          </div>
        ) : backupsData?.backups?.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {backupsData?.message ? (
              <div>
                <p className="mb-2">{backupsData.message}</p>
                {backupsData.suggestion && (
                  <p className="text-sm mt-2">
                    <strong>Suggestion:</strong> {backupsData.suggestion}
                  </p>
                )}
                <div className="mt-4 p-3 bg-blue-100 text-blue-800 rounded-md">
                  <p className="font-semibold">Using Heroku PostgreSQL Backups:</p>
                  <ol className="list-decimal list-inside mt-2 space-y-1">
                    <li>Use the Heroku CLI: <code className="bg-gray-100 p-1 rounded">heroku pg:backups:capture --app your-app-name</code></li>
                    <li>Download the backup: <code className="bg-gray-100 p-1 rounded">heroku pg:backups:download --app your-app-name</code></li>
                  </ol>
                </div>
              </div>
            ) : (
              "No backups available. Create your first backup using the button above."
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Filename
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created On
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {backupsData?.backups?.map((backup) => (
                  <tr key={backup.filename} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {backup.filename}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(new Date(backup.created))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {backup.size}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDownloadBackup(backup.filename)}
                        className="text-[#F58220] hover:text-[#e67812] mr-3"
                        title="Download Backup"
                      >
                        Download
                      </button>
                      <button
                        onClick={() => handleDeleteBackup(backup.filename)}
                        className="text-red-600 hover:text-red-800"
                        disabled={isDeletingBackup}
                        title="Delete Backup"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Restore Confirmation Modal */}
      {confirmRestore && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4 text-[#4A453F]">
                Confirm Database Restore
              </h3>
              <p className="mb-4 text-gray-600">
                Are you sure you want to restore the database from this backup? 
                This action will replace all current data and cannot be undone.
              </p>
              
              <div className="p-3 mb-4 bg-yellow-100 text-yellow-800 rounded-md">
                <p className="font-semibold">Warning:</p>
                <p>All current data will be replaced by the data in the backup.</p>
                <p className="mt-2">The restore process may take several minutes to complete, especially for large databases. Please do not close this page during the process.</p>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setConfirmRestore(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRestoreAction}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  disabled={isRestoringBackup}
                >
                  {isRestoringBackup ? 'Restoring...' : 'Yes, Restore Database'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatabaseManagement; 