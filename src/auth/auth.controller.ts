import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

		@Post('login')
		@ApiOperation({ summary: 'Login de usuario' })
		@ApiBody({ schema: { properties: { username: { type: 'string' }, password: { type: 'string' } } } })
	async login(@Body() body: { username: string; password: string }) {
		const token = await this.authService.login(body.username, body.password);
		if (!token) throw new UnauthorizedException('Credenciales inválidas');
		return { access_token: token };
	}
}
