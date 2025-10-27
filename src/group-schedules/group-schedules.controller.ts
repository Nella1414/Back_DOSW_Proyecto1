import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { GroupSchedulesService } from './services/group-schedules.service';
import { CreateGroupScheduleDto } from './dto/create-group-schedule.dto';
import { UpdateGroupScheduleDto } from './dto/update-group-schedule.dto';

@ApiTags('Group Schedules')
@Controller('group-schedules')
export class GroupSchedulesController {
  constructor(private readonly groupSchedulesService: GroupSchedulesService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new group schedule',
    description: 'Creates a new schedule entry for a course group',
  })
  @ApiBody({ type: CreateGroupScheduleDto })
  @ApiResponse({
    status: 201,
    description: 'Group schedule successfully created',
  })
  @ApiResponse({ status: 400, description: 'Invalid schedule data' })
  @ApiResponse({ status: 409, description: 'Schedule conflict detected' })
  create(@Body() createGroupScheduleDto: CreateGroupScheduleDto) {
    return this.groupSchedulesService.create(createGroupScheduleDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all group schedules',
    description: 'Retrieves a list of all group schedules in the system',
  })
  @ApiResponse({
    status: 200,
    description: 'List of group schedules retrieved successfully',
  })
  findAll() {
    return this.groupSchedulesService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get group schedule by ID',
    description: 'Retrieves a specific group schedule by its ID',
  })
  @ApiParam({ name: 'id', description: 'Group schedule ID' })
  @ApiResponse({
    status: 200,
    description: 'Group schedule found',
  })
  @ApiResponse({ status: 404, description: 'Group schedule not found' })
  findOne(@Param('id') id: string) {
    return this.groupSchedulesService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update group schedule',
    description: 'Updates an existing group schedule by ID',
  })
  @ApiParam({ name: 'id', description: 'Group schedule ID' })
  @ApiBody({ type: UpdateGroupScheduleDto })
  @ApiResponse({
    status: 200,
    description: 'Group schedule successfully updated',
  })
  @ApiResponse({ status: 404, description: 'Group schedule not found' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'Schedule conflict detected' })
  update(
    @Param('id') id: string,
    @Body() updateGroupScheduleDto: UpdateGroupScheduleDto,
  ) {
    return this.groupSchedulesService.update(+id, updateGroupScheduleDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete group schedule',
    description: 'Removes a group schedule from the system',
  })
  @ApiParam({ name: 'id', description: 'Group schedule ID' })
  @ApiResponse({
    status: 200,
    description: 'Group schedule successfully deleted',
  })
  @ApiResponse({ status: 404, description: 'Group schedule not found' })
  remove(@Param('id') id: string) {
    return this.groupSchedulesService.remove(+id);
  }
}
