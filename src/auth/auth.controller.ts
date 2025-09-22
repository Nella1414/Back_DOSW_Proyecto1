import { Controller, Post, Body, Param, Get, Put } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginAuthDto } from './dto/login-auth.dto';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { AdminOnly, Public } from './decorators/auth.decorator';
import { RoleName } from '../roles/entities/role.entity';
import { UseGuards, Req, Res } from '@nestjs/common';
import { GoogleAuthGuard } from './google-auth.guard';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService,
    private configService: ConfigService
  ) {}
  @Public()
  @Post('register')
  registerUser(@Body() userObject: RegisterAuthDto) {
    return this.authService.register(userObject);
  }
  @Public()
  @Post('login')
  loginUser(@Body() loginObject: LoginAuthDto) {
    return this.authService.login(loginObject);
  }

  @AdminOnly()
  @Put('user/:userId/roles')
  async updateUserRoles(
    @Param('userId') userId: string,
    @Body() body: { roles: RoleName[] }
  ) {
    return this.authService.updateUserRoles(userId, body.roles);
  }

  @Public()
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {
    
  }

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthRedirect(@Req() req, @Res() res) {
    const result = await this.authService.googleLogin(req.user);
    
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const redirectUrl = `${frontendUrl}/auth/callback?token=${result.accessToken}`;
    
    return res.redirect(redirectUrl);
  }

}
