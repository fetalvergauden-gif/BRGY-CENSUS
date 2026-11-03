const configuredApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// Keep the API base URL consistent across login sync and all data requests.
export const API_BASE_URL = configuredApiUrl.trim().replace(/\/+$/, '');

export const API_ENDPOINTS = {
  census: `${API_BASE_URL}/api/census`,
  formSchema: `${API_BASE_URL}/api/form-schema`,
  settings: `${API_BASE_URL}/api/settings`,
  activityLogs: `${API_BASE_URL}/api/activity-logs`,
  authSync: `${API_BASE_URL}/api/auth/sync`,
};

export default API_BASE_URL;
