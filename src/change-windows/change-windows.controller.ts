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
import { ChangeWindowsService } from './services/change-windows.service';
import { CreateChangeWindowDto } from './dto/create-change-window.dto';
import { UpdateChangeWindowDto } from './dto/update-change-window.dto';

@ApiTags('Change Windows')
@Controller('change-windows')
export class ChangeWindowsController {
  constructor(private readonly changeWindowsService: ChangeWindowsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new change window',
    description: 'Creates a new change window period for course modifications',
  })
  @ApiBody({ type: CreateChangeWindowDto })
  @ApiResponse({
    status: 201,
    description: 'Change window successfully created',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  create(@Body() createChangeWindowDto: CreateChangeWindowDto) {
    return this.changeWindowsService.create(createChangeWindowDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all change windows',
    description: 'Retrieves a list of all change windows in the system',
  })
  @ApiResponse({
    status: 200,
    description: 'List of change windows retrieved successfully',
  })
  findAll() {
    return this.changeWindowsService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get change window by ID',
    description: 'Retrieves a specific change window by its ID',
  })
  @ApiParam({ name: 'id', description: 'Change window ID' })
  @ApiResponse({
    status: 200,
    description: 'Change window found',
  })
  @ApiResponse({ status: 404, description: 'Change window not found' })
  findOne(@Param('id') id: string) {
    return this.changeWindowsService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update change window',
    description: 'Updates an existing change window by ID',
  })
  @ApiParam({ name: 'id', description: 'Change window ID' })
  @ApiBody({ type: UpdateChangeWindowDto })
  @ApiResponse({
    status: 200,
    description: 'Change window successfully updated',
  })
  @ApiResponse({ status: 404, description: 'Change window not found' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  update(
    @Param('id') id: string,
    @Body() updateChangeWindowDto: UpdateChangeWindowDto,
  ) {
    return this.changeWindowsService.update(+id, updateChangeWindowDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete change window',
    description: 'Removes a change window from the system',
  })
  @ApiParam({ name: 'id', description: 'Change window ID' })
  @ApiResponse({
    status: 200,
    description: 'Change window successfully deleted',
  })
  @ApiResponse({ status: 404, description: 'Change window not found' })
  remove(@Param('id') id: string) {
    return this.changeWindowsService.remove(+id);
  }
}
