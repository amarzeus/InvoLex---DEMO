// Example usage of APICache and HealthAPI services
import { apiCache } from './apiCache';
import { healthAPI } from './healthAPI';

// Example: Using APICache with a simulated API call
async function fetchUserData(userId: string) {
  const cacheKey = `user-${userId}`;

  // Try to get from cache first
  const cachedData = apiCache.get(cacheKey);
  if (cachedData) {
    console.log('Returning cached data:', cachedData);
    return cachedData;
  }

  // Simulate API call
  const data = await simulateApiCall(userId);

  // Cache the result for 10 minutes
  apiCache.set(cacheKey, data, { ttl: 10 * 60 * 1000 });

  return data;
}

// Example: Using executeWithCache for cleaner code
async function fetchUserProfile(userId: string) {
  return apiCache.executeWithCache(
    () => simulateApiCall(userId),
    `/api/users/${userId}`,
    { ttl: 5 * 60 * 1000 } // 5 minutes
  );
}

// Simulated API call
async function simulateApiCall(userId: string) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 100));

  return {
    id: userId,
    name: `User ${userId}`,
    email: `user${userId}@example.com`,
    lastLogin: new Date().toISOString()
  };
}

// Example: Health monitoring
async function monitorSystemHealth() {
  try {
    // Get current health status
    const healthStatus = await healthAPI.getHealthStatus();
    console.log('System Health:', healthStatus);

    // Check if system is healthy
    const isHealthy = await healthAPI.isHealthy();
    console.log('System is healthy:', isHealthy);

    // Get detailed health report
    const report = await healthAPI.getHealthReport();
    console.log('Health Report:\n', report);

    // Start continuous monitoring
    const stopMonitoring = healthAPI.startMonitoring((status) => {
      console.log('Health update:', status.status);
      if (status.status !== 'healthy') {
        console.warn('System health degraded!');
      }
    });

    // Stop monitoring after 2 minutes
    setTimeout(() => {
      stopMonitoring();
      console.log('Stopped health monitoring');
    }, 2 * 60 * 1000);

  } catch (error) {
    console.error('Health check failed:', error);
  }
}

// Example: Cache management
function demonstrateCacheManagement() {
  // Add some data to cache
  apiCache.set('test-key', { message: 'Hello World' }, { ttl: 60000 });

  // Get cache stats
  const stats = apiCache.getStats();
  console.log('Cache stats:', stats);

  // Clean expired entries
  apiCache.clean();

  // Clear specific entry
  apiCache.clear('test-key');

  // Clear all cache
  // apiCache.clearAll();
}

// Example: Integration with existing services
async function enhancedSupabaseCall() {
  try {
    // Check system health before making API calls
    const isHealthy = await healthAPI.isHealthy();
    if (!isHealthy) {
      console.warn('System is not healthy, proceeding with caution');
    }

    // Use cache for expensive operations
    const result = await apiCache.executeWithCache(
      async () => {
        // Your actual API call here
        return { data: 'some expensive data' };
      },
      '/api/expensive-endpoint',
      { ttl: 15 * 60 * 1000 } // 15 minutes
    );

    return result;
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}

// Export examples for testing
export const examples = {
  fetchUserData,
  fetchUserProfile,
  monitorSystemHealth,
  demonstrateCacheManagement,
  enhancedSupabaseCall
};

// Usage examples:
// import { examples } from './services/exampleUsage';

// examples.fetchUserData('123');
// examples.monitorSystemHealth();
// examples.demonstrateCacheManagement();
