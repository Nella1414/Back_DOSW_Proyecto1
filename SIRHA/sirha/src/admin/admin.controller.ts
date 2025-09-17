import { Controller, Get, UseGuards } from '@nestjs/common';
import { Roles } from '../common/roles/roles.decorator';
import { RolesGuard } from '../common/roles/roles.guard';
import { UserRole } from '../users/schema/user.schema';

@UseGuards(RolesGuard)
@Controller('admin')
export class AdminController {
	@Roles(UserRole.ADMIN)
	@Get('dashboard')
	getDashboard() {
		return { message: 'Solo los administradores pueden ver esto.' };
	}
}
