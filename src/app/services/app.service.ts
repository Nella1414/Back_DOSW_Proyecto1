import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

/**
 * Application Main Service
 *
 * Provides core application health monitoring, status information,
 * and system metrics for administrative and monitoring purposes.
 *
 * Features:
 * - Health checks for API and database connectivity
 * - Application status and version information
 * - System metrics and uptime tracking
 * - Environment and configuration details
 */
@Injectable()
export class AppService {
  private readonly startTime: Date;
  private readonly version: string = '1.0.2';
  private readonly environment: string;

  constructor(
    @InjectConnection() private readonly mongoConnection: Connection,
  ) {
    this.startTime = new Date();
    this.environment = process.env.NODE_ENV || 'development';
  }

  /**
   * API Root Endpoint
   *
   * Provides basic API information and navigation links.
   * Useful for API discovery and documentation access.
   *
   * @returns Basic API information with navigation links
   */
  getApiInfo(): object {
    return {
      name: 'SIRHA - Student Information & Registration Hub API',
      version: this.version,
      description: 'Academic Management System REST API',
      documentation: '/doc',
      endpoints: {
        health: '/health',
        status: '/status',
        version: '/version',
      },
      message: 'Welcome to SIRHA API! Visit /doc for complete documentation.',
    };
  }

  /**
   * Health Check Endpoint
   *
   * Performs comprehensive health checks on all critical system components.
   * Essential for load balancers, monitoring systems, and alerting.
   *
   * Health Status Indicators:
   * - API: Always returns "ok" if the service is running
   * - Database: Checks MongoDB connection status
   * - Overall: "healthy" if all components are operational
   *
   * @returns Health status of API and database
   */
  async getHealth(): Promise<object> {
    const dbStatus = this.getDatabaseStatus();

    return {
      status: dbStatus === 'connected' ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks: {
        api: {
          status: 'ok',
          message: 'API service is running',
        },
        database: {
          status: dbStatus === 'connected' ? 'ok' : 'error',
          message:
            dbStatus === 'connected'
              ? 'Database connection active'
              : 'Database connection failed',
          connectionState: dbStatus,
        },
      },
    };
  }

  /**
   * Application Status Endpoint
   *
   * Provides detailed application runtime information including:
   * - Version and environment details
   * - Uptime since last restart
   * - Database connection information
   * - System configuration status
   *
   * Useful for:
   * - Monitoring dashboards
   * - Debugging deployment issues
   * - System administration
   *
   * @returns Comprehensive application status information
   */
  async getStatus(): Promise<object> {
    const uptime = this.getUptime();
    const dbStatus = this.getDatabaseStatus();
    const dbInfo = this.getDatabaseInfo();

    return {
      application: {
        name: 'SIRHA API',
        version: this.version,
        environment: this.environment,
        status: 'running',
      },
      server: {
        startTime: this.startTime.toISOString(),
        uptime: uptime,
        uptimeSeconds: Math.floor((Date.now() - this.startTime.getTime()) / 1000),
        currentTime: new Date().toISOString(),
      },
      database: {
        type: 'MongoDB',
        status: dbStatus,
        host: dbInfo.host,
        name: dbInfo.name,
        collections: dbInfo.collections,
      },
      health: dbStatus === 'connected' ? 'healthy' : 'degraded',
    };
  }

  /**
   * Version Information Endpoint
   *
   * Returns API version and build information.
   * Useful for version verification and compatibility checks.
   *
   * @returns API version details
   */
  getVersion(): object {
    return {
      version: this.version,
      apiName: 'SIRHA API',
      releaseDate: '2025-01-15',
      description: 'Student Information & Registration Hub API',
      changelog: {
        '1.0.2': [
          'Added comprehensive health check endpoints',
          'Improved MongoDB ID handling in DTOs',
          'Enhanced Swagger documentation',
        ],
        '1.0.1': [
          'Added Google OAuth authentication',
          'Implemented academic traffic light system',
        ],
        '1.0.0': ['Initial release with core functionality'],
      },
    };
  }

  /**
   * Get Database Connection Status
   *
   * Internal method to check MongoDB connection state.
   *
   * Connection States:
   * - connected: Database is ready for operations
   * - disconnected: No database connection
   * - connecting: Connection in progress
   * - disconnecting: Disconnection in progress
   *
   * @returns Current database connection state as string
   */
  private getDatabaseStatus(): string {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };

    return states[this.mongoConnection.readyState] || 'unknown';
  }

  /**
   * Get Database Information
   *
   * Retrieves detailed information about the MongoDB database.
   *
   * @returns Database host, name, and collection count
   */
  private getDatabaseInfo(): {
    host: string;
    name: string;
    collections: number;
  } {
    try {
      return {
        host: this.mongoConnection.host || 'unknown',
        name: this.mongoConnection.name || 'unknown',
        collections: Object.keys(this.mongoConnection.collections).length,
      };
    } catch (error) {
      return {
        host: 'error',
        name: 'error',
        collections: 0,
      };
    }
  }

  /**
   * Calculate Application Uptime
   *
   * Calculates human-readable uptime since application start.
   *
   * @returns Formatted uptime string (e.g., "2 hours 15 minutes 30 seconds")
   */
  private getUptime(): string {
    const uptimeMs = Date.now() - this.startTime.getTime();
    const seconds = Math.floor(uptimeMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} days ${hours % 24} hours ${minutes % 60} minutes`;
    } else if (hours > 0) {
      return `${hours} hours ${minutes % 60} minutes ${seconds % 60} seconds`;
    } else if (minutes > 0) {
      return `${minutes} minutes ${seconds % 60} seconds`;
    } else {
      return `${seconds} seconds`;
    }
  }
}
