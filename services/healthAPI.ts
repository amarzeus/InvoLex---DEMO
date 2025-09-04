import { PrismaClient } from '@prisma/client';

interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  services: ServiceHealth[];
  uptime: number;
  version: string;
}

interface ServiceHealth {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime?: number;
  error?: string;
  lastChecked: string;
}

interface HealthCheckOptions {
  timeout?: number;
  retries?: number;
}

class HealthAPI {
  private baseUrl: string;
  private healthStatus: HealthStatus | null = null;
  private lastCheck: number = 0;
  private checkInterval: number = 30000; // 30 seconds
  private prisma: PrismaClient;

  constructor(baseUrl: string = '', prismaClient?: PrismaClient) {
    this.baseUrl = baseUrl;
    // Use provided Prisma client or create a new one
    this.prisma = prismaClient || new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error'] : [],
    });
  }

  /**
   * Perform health check on PostgreSQL database
   */
  private async checkDatabaseHealth(): Promise<ServiceHealth> {
    const startTime = Date.now();

    try {
      // Perform a simple query to test database connectivity
      await this.prisma.$queryRaw`SELECT 1 as health_check`;

      const responseTime = Date.now() - startTime;

      return {
        name: 'PostgreSQL Database',
        status: 'healthy',
        responseTime,
        lastChecked: new Date().toISOString()
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      return {
        name: 'PostgreSQL Database',
        status: 'unhealthy',
        responseTime,
        error: error instanceof Error ? error.message : 'Database connection failed',
        lastChecked: new Date().toISOString()
      };
    }
  }

  /**
   * Perform health check on a service
   */
  private async checkService(
    name: string,
    url: string,
    options: HealthCheckOptions = {}
  ): Promise<ServiceHealth> {
    const { timeout = 5000, retries = 1 } = options;
    const startTime = Date.now();

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          }
        });

        clearTimeout(timeoutId);

        const responseTime = Date.now() - startTime;

        if (response.ok) {
          return {
            name,
            status: 'healthy',
            responseTime,
            lastChecked: new Date().toISOString()
          };
        } else {
          return {
            name,
            status: 'unhealthy',
            responseTime,
            error: `HTTP ${response.status}: ${response.statusText}`,
            lastChecked: new Date().toISOString()
          };
        }
      } catch (error) {
        if (attempt === retries) {
          return {
            name,
            status: 'unhealthy',
            responseTime: Date.now() - startTime,
            error: error instanceof Error ? error.message : 'Unknown error',
            lastChecked: new Date().toISOString()
          };
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return {
      name,
      status: 'unhealthy',
      error: 'Max retries exceeded',
      lastChecked: new Date().toISOString()
    };
  }

  /**
   * Get overall health status
   */
  async getHealthStatus(force: boolean = false): Promise<HealthStatus> {
    const now = Date.now();

    // Return cached status if not expired and not forced
    if (!force && this.healthStatus && (now - this.lastCheck) < this.checkInterval) {
      return this.healthStatus;
    }

    const services: ServiceHealth[] = [];

    // Check PostgreSQL Database
    try {
      const dbHealth = await this.checkDatabaseHealth();
      services.push(dbHealth);
    } catch (error) {
      services.push({
        name: 'PostgreSQL Database',
        status: 'unhealthy',
        error: 'Database health check failed',
        lastChecked: new Date().toISOString()
      });
    }

    // Check Supabase service
    try {
      const supabaseHealth = await this.checkService(
        'Supabase',
        `${this.baseUrl}/rest/v1/`,
        { timeout: 3000 }
      );
      services.push(supabaseHealth);
    } catch (error) {
      services.push({
        name: 'Supabase',
        status: 'unhealthy',
        error: 'Service check failed',
        lastChecked: new Date().toISOString()
      });
    }

    // Check AI Service
    try {
      const aiHealth = await this.checkService(
        'AI Service',
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
        { timeout: 3000 }
      );
      services.push(aiHealth);
    } catch (error) {
      services.push({
        name: 'AI Service',
        status: 'unhealthy',
        error: 'Service check failed',
        lastChecked: new Date().toISOString()
      });
    }

    // Check Email Service (mock)
    services.push({
      name: 'Email Service',
      status: 'healthy',
      lastChecked: new Date().toISOString()
    });

    // Determine overall status
    const unhealthyServices = services.filter(s => s.status === 'unhealthy');
    const degradedServices = services.filter(s => s.status === 'degraded');

    let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    if (unhealthyServices.length > 0) {
      overallStatus = 'unhealthy';
    } else if (degradedServices.length > 0) {
      overallStatus = 'degraded';
    }

    this.healthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services,
      uptime: performance.now(),
      version: '1.0.0'
    };

    this.lastCheck = now;
    return this.healthStatus;
  }

  /**
   * Check if system is healthy
   */
  async isHealthy(): Promise<boolean> {
    const status = await this.getHealthStatus();
    return status.status === 'healthy';
  }

  /**
   * Get detailed health report
   */
  async getHealthReport(): Promise<string> {
    const status = await this.getHealthStatus(true);

    let report = `Health Status: ${status.status.toUpperCase()}\n`;
    report += `Timestamp: ${status.timestamp}\n`;
    report += `Uptime: ${(status.uptime / 1000).toFixed(2)} seconds\n`;
    report += `Version: ${status.version}\n\n`;

    report += 'Services:\n';
    status.services.forEach(service => {
      report += `- ${service.name}: ${service.status.toUpperCase()}`;
      if (service.responseTime) {
        report += ` (${service.responseTime}ms)`;
      }
      if (service.error) {
        report += ` - ${service.error}`;
      }
      report += '\n';
    });

    return report;
  }

  /**
   * Monitor health continuously
   */
  startMonitoring(callback?: (status: HealthStatus) => void): () => void {
    const interval = setInterval(async () => {
      try {
        const status = await this.getHealthStatus();
        if (callback) {
          callback(status);
        }
      } catch (error) {
        console.error('Health monitoring error:', error);
      }
    }, this.checkInterval);

    return () => clearInterval(interval);
  }

  /**
   * Set monitoring interval
   */
  setMonitoringInterval(intervalMs: number): void {
    this.checkInterval = intervalMs;
  }

  /**
   * Clean up Prisma client connection
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

// Singleton instance - will be initialized with Prisma client from backend
export const healthAPI = new HealthAPI();

// Export types
export type { HealthStatus, ServiceHealth, HealthCheckOptions };
