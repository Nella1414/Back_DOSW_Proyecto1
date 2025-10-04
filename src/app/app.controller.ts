import { Controller, Get } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiExcludeEndpoint,
} from '@nestjs/swagger';
import { AppService } from './services/app.service';
import { Public } from '../auth/decorators/auth.decorator';

/**
 * Application Root Controller
 *
 * Provides core system endpoints for monitoring, health checks,
 * and application information. These endpoints are essential for:
 * - Load balancer health checks
 * - Monitoring and alerting systems
 * - DevOps automation
 * - System administration
 *
 * All endpoints in this controller are public (no authentication required)
 * to allow external monitoring systems to access them.
 */
@ApiTags('System Health & Information')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * API Root Endpoint
   *
   * Welcome endpoint that provides basic API information and navigation.
   * Returns links to important endpoints like documentation and health checks.
   */
  @ApiOperation({
    summary: 'API Root - Welcome & Navigation',
    description: `
    Welcome endpoint for the SIRHA API.

    **Purpose:**
    - Provides basic API information
    - Navigation links to key endpoints
    - API discovery for new developers

    **Returns:**
    - API name and version
    - Link to Swagger documentation
    - Available system endpoints
    - Welcome message

    **Use Cases:**
    - API verification after deployment
    - Quick reference for available endpoints
    - Initial API exploration
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'API information retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          example: 'SIRHA - Student Information & Registration Hub API',
        },
        version: { type: 'string', example: '1.0.2' },
        description: { type: 'string', example: 'Academic Management System REST API' },
        documentation: { type: 'string', example: '/doc' },
        endpoints: {
          type: 'object',
          properties: {
            health: { type: 'string', example: '/health' },
            status: { type: 'string', example: '/status' },
            version: { type: 'string', example: '/version' },
          },
        },
        message: { type: 'string', example: 'Welcome to SIRHA API! Visit /doc for complete documentation.' },
      },
    },
  })
  @Public()
  @Get()
  getApiInfo(): object {
    return this.appService.getApiInfo();
  }

  /**
   * Health Check Endpoint
   *
   * Critical endpoint for monitoring system health.
   * Used by load balancers and monitoring tools to verify service availability.
   */
  @ApiOperation({
    summary: 'Health Check',
    description: `
    Performs comprehensive health checks on all critical system components.

    **What it Checks:**
    - **API Status**: Verifies the API service is running
    - **Database Status**: Checks MongoDB connection health

    **Health Statuses:**
    - \`healthy\`: All systems operational
    - \`unhealthy\`: One or more critical systems failed

    **Use Cases:**
    - **Load Balancer**: AWS ELB/ALB health checks
    - **Kubernetes**: Liveness and readiness probes
    - **Monitoring**: Datadog, New Relic, Prometheus
    - **Alerting**: PagerDuty, Opsgenie notifications
    - **CI/CD**: Deployment verification

    **Response Time:**
    - Typically responds in < 50ms
    - Timeout if > 5 seconds indicates system issues

    **Monitoring Recommendation:**
    - Check every 30 seconds for production systems
    - Alert if unhealthy for > 2 consecutive checks
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Health check completed - Returns health status of all components',
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['healthy', 'unhealthy'],
          example: 'healthy',
          description: 'Overall system health status',
        },
        timestamp: {
          type: 'string',
          format: 'date-time',
          example: '2025-01-15T10:30:00.000Z',
          description: 'Health check execution timestamp',
        },
        checks: {
          type: 'object',
          properties: {
            api: {
              type: 'object',
              properties: {
                status: { type: 'string', example: 'ok' },
                message: { type: 'string', example: 'API service is running' },
              },
            },
            database: {
              type: 'object',
              properties: {
                status: { type: 'string', example: 'ok' },
                message: { type: 'string', example: 'Database connection active' },
                connectionState: { type: 'string', example: 'connected' },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 503,
    description: 'Service Unavailable - System is unhealthy',
  })
  @Public()
  @Get('health')
  async getHealth(): Promise<object> {
    return this.appService.getHealth();
  }

  /**
   * Application Status Endpoint
   *
   * Provides detailed runtime information about the application.
   * Useful for debugging, monitoring dashboards, and system administration.
   */
  @ApiOperation({
    summary: 'Application Status & Metrics',
    description: `
    Returns comprehensive application runtime information and metrics.

    **Information Provided:**

     **Application Details:**
    - API name and version
    - Environment (development/production)
    - Current running status

    **Server Metrics:**
    - Server start time
    - Current uptime (human-readable)
    - Uptime in seconds
    - Current timestamp

     **Database Information:**
    - Database type (MongoDB)
    - Connection status
    - Host and database name
    - Number of collections

    **Use Cases:**
    - **Monitoring Dashboards**: Display system metrics
    - **Debugging**: Verify deployment and configuration
    - **Administration**: Check system health details
    - **Troubleshooting**: Diagnose connectivity issues
    - **Metrics Collection**: Gather runtime statistics
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Application status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        application: {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'SIRHA API' },
            version: { type: 'string', example: '1.0.2' },
            environment: { type: 'string', example: 'development' },
            status: { type: 'string', example: 'running' },
          },
        },
        server: {
          type: 'object',
          properties: {
            startTime: {
              type: 'string',
              format: 'date-time',
              example: '2025-01-15T10:00:00.000Z',
            },
            uptime: { type: 'string', example: '2 hours 30 minutes 15 seconds' },
            uptimeSeconds: { type: 'number', example: 9015 },
            currentTime: {
              type: 'string',
              format: 'date-time',
              example: '2025-01-15T12:30:15.000Z',
            },
          },
        },
        database: {
          type: 'object',
          properties: {
            type: { type: 'string', example: 'MongoDB' },
            status: { type: 'string', example: 'connected' },
            host: { type: 'string', example: 'localhost' },
            name: { type: 'string', example: 'sirha-db' },
            collections: { type: 'number', example: 14 },
          },
        },
        health: { type: 'string', enum: ['healthy', 'degraded'], example: 'healthy' },
      },
    },
  })
  @Public()
  @Get('status')
  async getStatus(): Promise<object> {
    return this.appService.getStatus();
  }

  /**
   * Version Information Endpoint
   *
   * Returns API version and changelog information.
   * Useful for version verification and compatibility checks.
   */
  @ApiOperation({
    summary: 'API Version & Changelog',
    description: `
    Returns detailed version information and release history.

    **Information Provided:**
    - Current API version
    - Release date
    - Changelog for all versions
    - Feature history

    **Use Cases:**
    - **Client Compatibility**: Verify API version compatibility
    - **Documentation**: Track feature availability
    - **Change Management**: Review feature rollout history
    - **Deployment Verification**: Confirm correct version deployed

    **Version Format:**
    - Follows Semantic Versioning (semver): MAJOR.MINOR.PATCH
    - Example: 1.0.2
      - MAJOR: Breaking changes
      - MINOR: New features (backward compatible)
      - PATCH: Bug fixes
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Version information retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        version: { type: 'string', example: '1.0.2' },
        apiName: { type: 'string', example: 'SIRHA API' },
        releaseDate: { type: 'string', example: '2025-01-15' },
        description: { type: 'string', example: 'Student Information & Registration Hub API' },
        changelog: {
          type: 'object',
          example: {
            '1.0.2': [
              'Added comprehensive health check endpoints',
              'Improved MongoDB ID handling in DTOs',
            ],
            '1.0.1': ['Added Google OAuth authentication'],
            '1.0.0': ['Initial release'],
          },
        },
      },
    },
  })
  @Public()
  @Get('version')
  getVersion(): object {
    return this.appService.getVersion();
  }
}
