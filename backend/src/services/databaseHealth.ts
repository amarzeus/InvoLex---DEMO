import { PrismaClient } from '@prisma/client';

interface DatabaseHealthStatus {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime?: number;
  error?: string;
  lastChecked: string;
  connectionPool?: {
    active: number;
    idle: number;
    waiting: number;
  };
}

export class DatabaseHealthService {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error'] : [],
    });
  }

  /**
   * Perform comprehensive database health check
   */
  async checkHealth(): Promise<DatabaseHealthStatus> {
    const startTime = Date.now();

    try {
      // Test basic connectivity with a simple query
      await this.prisma.$queryRaw`SELECT 1 as health_check`;

      // Get connection pool information if available
      let connectionPool;
      try {
        // This is a Prisma-specific way to get connection info
        // Note: This might not work with all database providers
        const poolInfo = await this.prisma.$queryRaw`
          SELECT
            count(*) as total_connections,
            count(*) filter (where state = 'active') as active_connections,
            count(*) filter (where state = 'idle') as idle_connections
          FROM pg_stat_activity
          WHERE datname = current_database()
        `;

        if (Array.isArray(poolInfo) && poolInfo.length > 0) {
          const info = poolInfo[0] as any;
          connectionPool = {
            active: parseInt(info.active_connections) || 0,
            idle: parseInt(info.idle_connections) || 0,
            waiting: Math.max(0, parseInt(info.total_connections) - parseInt(info.active_connections) - parseInt(info.idle_connections))
          };
        }
      } catch (poolError) {
        // Connection pool info might not be available for all database types
        console.warn('Could not retrieve connection pool information:', poolError);
      }

      const responseTime = Date.now() - startTime;

      return {
        name: 'PostgreSQL Database',
        status: 'healthy',
        responseTime,
        lastChecked: new Date().toISOString(),
        connectionPool
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
   * Test specific database operations
   */
  async testDatabaseOperations(): Promise<{
    basicQuery: boolean;
    complexQuery: boolean;
    writeOperation: boolean;
    errors: string[];
  }> {
    const results = {
      basicQuery: false,
      complexQuery: false,
      writeOperation: false,
      errors: [] as string[]
    };

    try {
      // Test basic query
      await this.prisma.$queryRaw`SELECT 1`;
      results.basicQuery = true;
    } catch (error) {
      results.errors.push(`Basic query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    try {
      // Test complex query (join operation)
      await this.prisma.user.findMany({
        take: 1,
        include: {
          matters: {
            take: 1,
            include: {
              billableEntries: {
                take: 1
              }
            }
          }
        }
      });
      results.complexQuery = true;
    } catch (error) {
      results.errors.push(`Complex query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Note: Write operations should be avoided in health checks to prevent data modification
    // We'll skip the write test for safety

    return results;
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats(): Promise<{
    tableCounts: Record<string, number>;
    totalSize: string;
    lastBackup?: string;
  }> {
    try {
      // Get table row counts using individual queries
      const tableCounts: Record<string, number> = {};

      // Count users
      try {
        const userCount = await this.prisma.user.count();
        tableCounts['users'] = userCount;
      } catch (error) {
        tableCounts['users'] = 0;
      }

      // Count matters
      try {
        const matterCount = await this.prisma.matter.count();
        tableCounts['matters'] = matterCount;
      } catch (error) {
        tableCounts['matters'] = 0;
      }

      // Count billable entries
      try {
        const billableEntryCount = await this.prisma.billableEntry.count();
        tableCounts['billable_entries'] = billableEntryCount;
      } catch (error) {
        tableCounts['billable_entries'] = 0;
      }

      // Count emails
      try {
        const emailCount = await this.prisma.email.count();
        tableCounts['emails'] = emailCount;
      } catch (error) {
        tableCounts['emails'] = 0;
      }

      // Count email providers
      try {
        const emailProviderCount = await this.prisma.emailProvider.count();
        tableCounts['email_providers'] = emailProviderCount;
      } catch (error) {
        tableCounts['email_providers'] = 0;
      }

      // Get database size
      let totalSize = 'Unknown';
      try {
        const sizeResult = await this.prisma.$queryRawUnsafe(
          'SELECT pg_size_pretty(pg_database_size(current_database())) as size'
        );
        if (Array.isArray(sizeResult) && sizeResult.length > 0) {
          totalSize = (sizeResult[0] as any).size;
        }
      } catch (error) {
        console.warn('Could not get database size:', error);
      }

      return {
        tableCounts,
        totalSize
      };
    } catch (error) {
      console.error('Error getting database stats:', error);
      return {
        tableCounts: {},
        totalSize: 'Error retrieving stats'
      };
    }
  }

  /**
   * Clean up Prisma client connection
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

// Export singleton instance
export const databaseHealthService = new DatabaseHealthService();
