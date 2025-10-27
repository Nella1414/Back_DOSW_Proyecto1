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
import { ReportsService } from './services/reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';

@ApiTags('Reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @ApiOperation({
    summary: 'Generate a new report',
    description: 'Creates a new report based on specified criteria and parameters',
  })
  @ApiBody({ type: CreateReportDto })
  @ApiResponse({
    status: 201,
    description: 'Report successfully generated',
  })
  @ApiResponse({ status: 400, description: 'Invalid report parameters' })
  create(@Body() createReportDto: CreateReportDto) {
    return this.reportsService.create(createReportDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all reports',
    description: 'Retrieves a list of all generated reports in the system',
  })
  @ApiResponse({
    status: 200,
    description: 'List of reports retrieved successfully',
  })
  findAll() {
    return this.reportsService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get report by ID',
    description: 'Retrieves a specific report by its ID',
  })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiResponse({
    status: 200,
    description: 'Report found',
  })
  @ApiResponse({ status: 404, description: 'Report not found' })
  findOne(@Param('id') id: string) {
    return this.reportsService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update report',
    description: 'Updates an existing report configuration or parameters',
  })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiBody({ type: UpdateReportDto })
  @ApiResponse({
    status: 200,
    description: 'Report successfully updated',
  })
  @ApiResponse({ status: 404, description: 'Report not found' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  update(@Param('id') id: string, @Body() updateReportDto: UpdateReportDto) {
    return this.reportsService.update(+id, updateReportDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete report',
    description: 'Removes a report from the system',
  })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiResponse({
    status: 200,
    description: 'Report successfully deleted',
  })
  @ApiResponse({ status: 404, description: 'Report not found' })
  remove(@Param('id') id: string) {
    return this.reportsService.remove(+id);
  }
}
