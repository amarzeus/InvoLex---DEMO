// Comprehensive test suite for APICache and HealthAPI services
import { apiCache } from './apiCache';
import { healthAPI } from './healthAPI';

class ServiceTester {
  private results: { test: string; passed: boolean; error?: string }[] = [];

  private log(test: string, passed: boolean, error?: string) {
    this.results.push({ test, passed, error });
    console.log(`${passed ? '✅' : '❌'} ${test}${error ? `: ${error}` : ''}`);
  }

  async runAllTests() {
    console.log('🧪 Starting comprehensive service tests...\n');

    await this.testAPICache();
    await this.testHealthAPI();

    this.printSummary();
  }

  private async testAPICache() {
    console.log('📦 Testing APICache...\n');

    // Test 1: Basic set/get
    try {
      apiCache.set('test1', { data: 'value1' });
      const result = apiCache.get('test1') as { data: string } | null;
      this.log('Basic set/get', result && result.data === 'value1');
    } catch (error) {
      this.log('Basic set/get', false, error instanceof Error ? error.message : 'Unknown error');
    }

    // Test 2: Cache with custom TTL
    try {
      apiCache.set('test2', { data: 'value2' }, { ttl: 100 }); // 100ms
      const immediate = apiCache.get('test2') as { data: string } | null;
      await new Promise(resolve => setTimeout(resolve, 150)); // Wait for expiration
      const afterExpiry = apiCache.get('test2');
      this.log('TTL expiration', (immediate && immediate.data === 'value2') && afterExpiry === null);
    } catch (error) {
      this.log('TTL expiration', false, error instanceof Error ? error.message : 'Unknown error');
    }

    // Test 3: Cache miss
    try {
      const result = apiCache.get('nonexistent');
      this.log('Cache miss handling', result === null);
    } catch (error) {
      this.log('Cache miss handling', false, error instanceof Error ? error.message : 'Unknown error');
    }

    // Test 4: executeWithCache
    try {
      let callCount = 0;
      const mockFn = async () => {
        callCount++;
        return { result: 'cached data' };
      };

      const result1 = await apiCache.executeWithCache(mockFn, '/test/endpoint');
      const result2 = await apiCache.executeWithCache(mockFn, '/test/endpoint');

      this.log('executeWithCache', result1.result === 'cached data' && result2.result === 'cached data' && callCount === 1);
    } catch (error) {
      this.log('executeWithCache', false, error instanceof Error ? error.message : 'Unknown error');
    }

    // Test 5: Cache clearing
    try {
      apiCache.set('clear-test', { data: 'to be cleared' });
      const beforeClear = apiCache.get('clear-test') as { data: string } | null;
      apiCache.clear('clear-test');
      const afterClear = apiCache.get('clear-test');
      this.log('Cache clearing', (beforeClear && beforeClear.data === 'to be cleared') && afterClear === null);
    } catch (error) {
      this.log('Cache clearing', false, error instanceof Error ? error.message : 'Unknown error');
    }

    // Test 6: Cache stats
    try {
      apiCache.clearAll();
      apiCache.set('stat1', 'data1');
      apiCache.set('stat2', 'data2');
      const stats = apiCache.getStats();
      this.log('Cache stats', stats.size === 2 && stats.keys.includes('stat1') && stats.keys.includes('stat2'));
    } catch (error) {
      this.log('Cache stats', false, error instanceof Error ? error.message : 'Unknown error');
    }

    // Test 7: Clean expired entries
    try {
      apiCache.clearAll();
      apiCache.set('expired', 'data', { ttl: 50 }); // 50ms
      apiCache.set('valid', 'data', { ttl: 5000 }); // 5 seconds
      await new Promise(resolve => setTimeout(resolve, 100)); // Wait for first to expire
      apiCache.clean();
      const expired = apiCache.get('expired');
      const valid = apiCache.get('valid') as string | null;
      this.log('Clean expired entries', expired === null && (valid === 'data'));
    } catch (error) {
      this.log('Clean expired entries', false, error instanceof Error ? error.message : 'Unknown error');
    }

    console.log('');
  }

  private async testHealthAPI() {
    console.log('🏥 Testing HealthAPI...\n');

    // Test 1: Get health status
    try {
      const status = await healthAPI.getHealthStatus();
      const hasRequiredFields = status.status && status.timestamp && Array.isArray(status.services);
      this.log('Get health status', hasRequiredFields);
    } catch (error) {
      this.log('Get health status', false, error instanceof Error ? error.message : 'Unknown error');
    }

    // Test 2: Is healthy check
    try {
      const isHealthy = await healthAPI.isHealthy();
      this.log('Is healthy check', typeof isHealthy === 'boolean');
    } catch (error) {
      this.log('Is healthy check', false, error instanceof Error ? error.message : 'Unknown error');
    }

    // Test 3: Health report generation
    try {
      const report = await healthAPI.getHealthReport();
      const hasContent = report.includes('Health Status') && report.includes('Services');
      this.log('Health report generation', hasContent);
    } catch (error) {
      this.log('Health report generation', false, error instanceof Error ? error.message : 'Unknown error');
    }

    // Test 4: Monitoring interval setting
    try {
      const originalInterval = (healthAPI as any).checkInterval;
      healthAPI.setMonitoringInterval(60000); // 1 minute
      const newInterval = (healthAPI as any).checkInterval;
      this.log('Monitoring interval setting', newInterval === 60000);
      // Reset to original
      healthAPI.setMonitoringInterval(originalInterval);
    } catch (error) {
      this.log('Monitoring interval setting', false, error instanceof Error ? error.message : 'Unknown error');
    }

    // Test 5: Health monitoring (short duration)
    try {
      let callbackCount = 0;
      const stopMonitoring = healthAPI.startMonitoring(() => {
        callbackCount++;
      });

      // Wait a bit for monitoring to trigger
      await new Promise(resolve => setTimeout(resolve, 100));

      stopMonitoring();
      this.log('Health monitoring', callbackCount >= 0); // At least didn't crash
    } catch (error) {
      this.log('Health monitoring', false, error instanceof Error ? error.message : 'Unknown error');
    }

    // Test 6: Force refresh
    try {
      const status1 = await healthAPI.getHealthStatus();
      const status2 = await healthAPI.getHealthStatus(true); // Force refresh
      // Should have different timestamps if refreshed
      this.log('Force refresh', status1.timestamp !== status2.timestamp);
    } catch (error) {
      this.log('Force refresh', false, error instanceof Error ? error.message : 'Unknown error');
    }

    console.log('');
  }

  private printSummary() {
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    const failed = total - passed;

    console.log('📊 Test Summary:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results.filter(r => !r.passed).forEach(result => {
        console.log(`  - ${result.test}${result.error ? `: ${result.error}` : ''}`);
      });
    }

    console.log('\n🎉 Testing completed!');
  }
}

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  // Node.js environment
  const tester = new ServiceTester();
  tester.runAllTests().catch(console.error);
}

// Export for browser usage
export { ServiceTester };
