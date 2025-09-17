import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Roles } from '../common/roles/roles.decorator';
import { RolesGuard } from '../common/roles/roles.guard';
import { UserRole } from '../users/schema/user.schema';

@ApiTags('Admin')
@UseGuards(RolesGuard)
@Controller('admin')
export class AdminController {
	@Roles(UserRole.ADMIN)
		@Get('dashboard')
		@ApiOperation({ summary: 'Dashboard solo para administradores' })
	getDashboard() {
		return { message: 'Solo los administradores pueden ver esto.' };
	}
}
