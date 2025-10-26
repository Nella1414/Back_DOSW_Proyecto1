import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ChangeRequestsService } from './services/change-requests.service';
import { CreateChangeRequestDto } from './dto/create-change-request.dto';
import {
  ApproveChangeRequestDto,
  RejectChangeRequestDto,
} from './dto/change-request-response.dto';
import { RequestState } from './entities/change-request.entity';
import { RequirePermissions } from '../auth/decorators/auth.decorator';
import { Permission, RoleName } from '../roles/entities/role.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuditCreate } from '../common/decorators/audit-create.decorator';

@ApiTags('Change Requests')
@Controller('change-requests')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChangeRequestsController {
  constructor(private readonly changeRequestsService: ChangeRequestsService) {}

  @ApiOperation({
    summary: 'Crear solicitud de cambio',
    description:
      'Crea una nueva solicitud de cambio con sistema anti-duplicados',
  })
  @ApiResponse({
    status: 201,
    description: 'Solicitud creada exitosamente',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '60d5ecb8b0a7c4b4b8b9b1a4' },
        userId: { type: 'string' },
        sourceSubjectId: { type: 'string' },
        targetSubjectId: { type: 'string' },
        status: { type: 'string', example: 'PENDING' },
        requestHash: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Solicitud duplicada - retorna existente',
  })
  @ApiResponse({
    status: 422,
    description: 'Datos de validación inválidos',
  })
  @AuditCreate('change_request')
  @Post()
  async createChangeRequest(
    @Req() req: any,
    @Body() createChangeRequestDto: CreateChangeRequestDto,
  ) {
    const userId = req.user?.id || 'anonymous';
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];

    return this.changeRequestsService.create(
      createChangeRequestDto,
      userId,
      ipAddress,
      userAgent,
    );
  }

  @ApiOperation({
    summary: 'Get change requests by faculty (DEAN)',
    description:
      'Deans can view change requests from students in their faculty',
  })
  @ApiQuery({ name: 'status', enum: RequestState, required: false })
  @ApiQuery({ name: 'periodId', type: 'string', required: false })
  @ApiQuery({ name: 'studentId', type: 'string', required: false })
  @ApiResponse({
    status: 200,
    description: 'Change requests retrieved successfully',
  })
  @RequirePermissions(Permission.VIEW_REPORTS)
  @Get('faculty/:facultyId')
  async getRequestsByFaculty(
    @Param('facultyId') facultyId: string,
    @Query('status') status?: RequestState,
    @Query('periodId') periodId?: string,
    @Query('studentId') studentId?: string,
  ) {
    return this.changeRequestsService.getRequestsByFaculty(facultyId, {
      status,
      periodId,
      studentId,
    });
  }

  @ApiOperation({
    summary: 'Get change request details',
    description: 'Get detailed information about a specific change request',
  })
  @ApiParam({ name: 'id', description: 'Change request ID' })
  @ApiResponse({ status: 200, description: 'Change request details retrieved' })
  @ApiResponse({ status: 404, description: 'Change request not found' })
  @Get(':id')
  async getRequestDetails(@Param('id') id: string) {
    return this.changeRequestsService.getRequestDetails(id);
  }

  @ApiOperation({
    summary: 'Approve change request (DEAN)',
    description:
      'Deans can approve change requests from their faculty students',
  })
  @ApiParam({ name: 'id', description: 'Change request ID' })
  @ApiResponse({
    status: 200,
    description: 'Change request approved successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Request cannot be approved or validation failed',
  })
  @ApiResponse({ status: 404, description: 'Change request not found' })
  @RequirePermissions(Permission.UPDATE_ENROLLMENT)
  @Patch(':id/approve')
  async approveRequest(
    @Param('id') id: string,
    @Body() approveDto: ApproveChangeRequestDto,
  ) {
    return this.changeRequestsService.approveChangeRequest(id, approveDto);
  }

  @ApiOperation({
    summary: 'Reject change request (DEAN)',
    description: 'Deans can reject change requests with a reason',
  })
  @ApiParam({ name: 'id', description: 'Change request ID' })
  @ApiResponse({
    status: 200,
    description: 'Change request rejected successfully',
  })
  @ApiResponse({ status: 400, description: 'Request cannot be rejected' })
  @ApiResponse({ status: 404, description: 'Change request not found' })
  @RequirePermissions(Permission.UPDATE_ENROLLMENT)
  @Patch(':id/reject')
  async rejectRequest(
    @Param('id') id: string,
    @Body() rejectDto: RejectChangeRequestDto,
  ) {
    return this.changeRequestsService.rejectChangeRequest(id, rejectDto);
  }

  @ApiOperation({
    summary: 'Get student own change requests',
    description: 'Students can view their own change request history',
  })
  @ApiResponse({
    status: 200,
    description: 'Student change requests retrieved',
  })
  @Get('student/my-requests')
  async getMyRequests(@Req() req: any) {
    const userEmail = req.user?.email;
    const studentCode = await this.extractStudentCodeFromUser(userEmail);
    // TODO: Implement getRequestsByStudent method
    return { message: 'Feature coming soon', studentCode };
  }

  private async extractStudentCodeFromUser(email: string): Promise<string> {
    // TODO: Implement logic to extract student code from user email/ID
    // This should query the User->Student relationship
    return 'TEMP-CODE'; // Placeholder
  }
}
