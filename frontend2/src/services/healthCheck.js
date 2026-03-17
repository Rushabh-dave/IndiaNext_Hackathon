import { apiService } from './apiService';

/**
 * Health check utility to diagnose connection issues
 * Returns connection status and helpful diagnostic info
 */
export async function checkBackendHealth() {
  try {
    const result = await apiService.getHealth();
    return {
      status: 'healthy',
      message: 'Backend is accessible and responding',
      data: result,
    };
  } catch (error) {
    return {
      status: 'unreachable',
      message: error?.detail || error?.message || 'Unable to reach backend',
      apiUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
      error: error,
    };
  }
}

/**
 * Log connection diagnostics to console for debugging
 */
export function logConnectionDiagnostics() {
  const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  console.group('[AEGIS Connection Diagnostics]');
  console.log('API Base URL:', apiUrl);
  console.log('Environment variables loaded:', {
    VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  });
  console.log('Browser location:', window.location.origin);
  console.groupEnd();
}

/**
 * Automatically check health on app load
 */
export function setupHealthCheck() {
  if (typeof window !== 'undefined') {
    window.addEventListener('load', async () => {
      const health = await checkBackendHealth();
      if (health.status === 'unreachable') {
        console.warn('[AEGIS Warning] Backend may be unreachable:', health);
      } else {
        console.log('[AEGIS OK] Backend is healthy:', health);
      }
    });
  }
}
