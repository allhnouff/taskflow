/**
 * Centralized API Configuration
 * 
 * This file contains the base API URL configuration that all API calls should use.
 * The baseURL is determined from environment variables or defaults to localhost.
 */

// Get API URL from environment variable or use default
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Export for use in other files
export default API_BASE_URL;

