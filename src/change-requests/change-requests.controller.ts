import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  Req,
  UseGuards,
  Headers,
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
import {
  CreateChangeRequestDto,
  ApproveChangeRequestDto,
  RejectChangeRequestDto,
} from './dto/change-request-response.dto';
import {
  RequestHistoryResponseDto,
  HistoryStatsDto,
  TimelineEventDto,
} from './dto/history-response.dto';
import { RequestCurrentStateResponseDto } from './dto/current-state-response.dto';
import { RequestState } from './entities/change-request.entity';
import { RequirePermissions } from '../auth/decorators/auth.decorator';
import { Permission } from '../roles/entities/role.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Change Requests')
@Controller('change-requests')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChangeRequestsController {
  constructor(private readonly changeRequestsService: ChangeRequestsService) {}

  @ApiOperation({
    summary: 'Create change request (STUDENT)',
    description:
      'Students can create requests to change from one course group to another',
  })
  @ApiResponse({
    status: 201,
    description: 'Change request created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request data or validation failed',
  })
  @ApiResponse({ status: 404, description: 'Student or groups not found' })
  @Post()
  async createChangeRequest(
    @Req() req: any,
    @Body() createChangeRequestDto: CreateChangeRequestDto,
  ) {
    const userEmail = req.user?.email;
    const studentCode = await this.extractStudentCodeFromUser(userEmail);
    return this.changeRequestsService.createChangeRequest(
      studentCode,
      createChangeRequestDto,
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
    summary: 'Get complete current state information',
    description:
      'Returns consolidated information about the request including current state, available actions, metrics, and complete details',
  })
  @ApiParam({ name: 'id', description: 'Change request ID' })
  @ApiResponse({
    status: 200,
    description: 'Current state information retrieved successfully',
    type: RequestCurrentStateResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Change request not found' })
  @Get(':id/current-state')
  async getCurrentState(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<RequestCurrentStateResponseDto> {
    const userPermissions = req.user?.permissions || [];
    return this.changeRequestsService.getCurrentStateInfo(id, userPermissions);
  }

  @ApiOperation({
    summary: 'Get complete history of a change request',
    description:
      'Returns the complete audit trail of state changes, ordered chronologically with actor names from database joins',
  })
  @ApiParam({ name: 'id', description: 'Change request ID' })
  @ApiResponse({
    status: 200,
    description: 'History retrieved successfully with complete actor information',
    type: RequestHistoryResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Change request not found' })
  @Get(':id/history')
  async getRequestHistory(
    @Param('id') id: string,
  ): Promise<RequestHistoryResponseDto> {
    return this.changeRequestsService.getRequestHistory(id);
  }

  @ApiOperation({
    summary: 'Get timeline for change request',
    description:
      'Returns formatted timeline events for frontend display, with icons and colors',
  })
  @ApiParam({ name: 'id', description: 'Change request ID' })
  @ApiResponse({
    status: 200,
    description: 'Timeline retrieved successfully',
    type: [TimelineEventDto],
  })
  @ApiResponse({ status: 404, description: 'Change request not found' })
  @Get(':id/timeline')
  async getRequestTimeline(
    @Param('id') id: string,
  ): Promise<TimelineEventDto[]> {
    return this.changeRequestsService.getRequestTimeline(id);
  }

  @ApiOperation({
    summary: 'Get history statistics',
    description: 'Returns aggregated statistics about the request history',
  })
  @ApiParam({ name: 'id', description: 'Change request ID' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
    type: HistoryStatsDto,
  })
  @ApiResponse({ status: 404, description: 'Change request not found' })
  @Get(':id/history/stats')
  async getHistoryStats(@Param('id') id: string): Promise<HistoryStatsDto> {
    return this.changeRequestsService.getHistoryStats(id);
  }

  @ApiOperation({
    summary: 'Check if request has state transitions',
    description:
      'Returns whether the request has any state transitions beyond creation',
  })
  @ApiParam({ name: 'id', description: 'Change request ID' })
  @ApiResponse({
    status: 200,
    description: 'Check completed successfully',
  })
  @ApiResponse({ status: 404, description: 'Change request not found' })
  @Get(':id/has-transitions')
  async hasStateTransitions(
    @Param('id') id: string,
  ): Promise<{ hasTransitions: boolean; message: string }> {
    const hasTransitions =
      await this.changeRequestsService.hasStateTransitions(id);

    return {
      hasTransitions,
      message: hasTransitions
        ? 'Request has state transitions'
        : 'Request only has initial creation event',
    };
  }

  @ApiOperation({
    summary: 'Get available actions for request',
    description:
      'Get current state, version, and available state transitions for a request',
  })
  @ApiParam({ name: 'id', description: 'Change request ID' })
  @ApiResponse({
    status: 200,
    description: 'Available actions retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Change request not found' })
  @Get(':id/available-actions')
  async getAvailableActions(@Param('id') id: string) {
    return this.changeRequestsService.getAvailableActions(id);
  }

  @ApiOperation({
    summary: 'Approve change request (DEAN)',
    description:
      'Deans can approve change requests. Supports optimistic locking via If-Match header',
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
  @ApiResponse({
    status: 409,
    description: 'Conflict - Request already approved or modified by another user',
  })
  @RequirePermissions(Permission.UPDATE_ENROLLMENT)
  @Patch(':id/approve')
  async approveRequest(
    @Param('id') id: string,
    @Body() approveDto: ApproveChangeRequestDto,
    @Req() req: any,
    @Headers('if-match') ifMatch?: string,
  ) {
    const userName = req.user?.displayName || req.user?.email;

    return this.changeRequestsService.approveChangeRequest(
      id,
      approveDto,
      req.user?.id,
      userName,
    );
  }

  @ApiOperation({
    summary: 'Reject change request (DEAN)',
    description:
      'Deans can reject change requests with a reason. Supports optimistic locking',
  })
  @ApiParam({ name: 'id', description: 'Change request ID' })
  @ApiResponse({
    status: 200,
    description: 'Change request rejected successfully',
  })
  @ApiResponse({ status: 400, description: 'Request cannot be rejected' })
  @ApiResponse({ status: 404, description: 'Change request not found' })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Request already rejected or modified by another user',
  })
  @RequirePermissions(Permission.UPDATE_ENROLLMENT)
  @Patch(':id/reject')
  async rejectRequest(
    @Param('id') id: string,
    @Body() rejectDto: RejectChangeRequestDto,
    @Req() req: any,
    @Headers('if-match') ifMatch?: string,
  ) {
    const userName = req.user?.displayName || req.user?.email;

    return this.changeRequestsService.rejectChangeRequest(
      id,
      rejectDto,
      req.user?.id,
      userName,
    );
  }

  @ApiOperation({
    summary: 'Request additional information (DEAN)',
    description: 'Request additional information from student',
  })
  @ApiParam({ name: 'id', description: 'Change request ID' })
  @ApiResponse({
    status: 200,
    description: 'Successfully requested additional information',
  })
  @ApiResponse({ status: 404, description: 'Change request not found' })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Invalid state transition',
  })
  @RequirePermissions(Permission.VIEW_REPORTS)
  @Patch(':id/request-info')
  async requestAdditionalInfo(
    @Param('id') id: string,
    @Body() body: { reason: string; observations?: string },
    @Req() req: any,
  ) {
    const userName = req.user?.displayName || req.user?.email;

    return this.changeRequestsService.requestAdditionalInfo(
      id,
      body.reason,
      body.observations,
      req.user?.id,
      userName,
    );
  }

  @ApiOperation({
    summary: 'Move request to review (DEAN)',
    description: 'Start reviewing a pending request',
  })
  @ApiParam({ name: 'id', description: 'Change request ID' })
  @ApiResponse({
    status: 200,
    description: 'Request moved to review successfully',
  })
  @ApiResponse({ status: 404, description: 'Change request not found' })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Invalid state transition',
  })
  @RequirePermissions(Permission.VIEW_REPORTS)
  @Patch(':id/start-review')
  async startReview(@Param('id') id: string, @Req() req: any) {
    const userName = req.user?.displayName || req.user?.email;

    return this.changeRequestsService.moveToReview(
      id,
      req.user?.id,
      userName,
    );
  }

  @ApiOperation({
    summary: 'Generic state change endpoint (ADMIN)',
    description:
      'Allows administrators to change request state to any valid state. Supports optimistic locking via If-Match header.',
  })
  @ApiParam({ name: 'id', description: 'Change request ID' })
  @ApiResponse({
    status: 200,
    description: 'State changed successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid state transition',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Redundant transition or concurrent modification',
  })
  @RequirePermissions(Permission.UPDATE_ENROLLMENT)
  @Patch(':id/change-state')
  async changeState(
    @Param('id') id: string,
    @Body()
    body: {
      toState: RequestState;
      reason?: string;
      observations?: string;
    },
    @Req() req: any,
    @Headers('if-match') ifMatch?: string,
  ) {
    const userName = req.user?.displayName || req.user?.email;
    const expectedVersion = ifMatch ? parseInt(ifMatch, 10) : undefined;

    return this.changeRequestsService.changeRequestState(id, body.toState, {
      reason: body.reason,
      observations: body.observations,
      actorId: req.user?.id,
      actorName: userName,
      expectedVersion,
    });
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