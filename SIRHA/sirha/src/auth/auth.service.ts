import { Injectable, Logger } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  async login(username: string, password: string): Promise<string | null> {
    this.logger.log(`Intentando login para usuario: ${username}`);
    const user = await this.usersService.findByUsername(username);
    if (!user) {
      this.logger.warn(`Usuario no encontrado: ${username}`);
      return null;
    }
    // en producción tenemos cambiar a hash
    if (user.password !== password) {
      this.logger.warn(`Contraseña incorrecta para usuario: ${username}`);
      return null;
    }

    const payload = {
      sub: user._id?.toString(),
      username: user.username,
      role: user.role,
    };
    const secret = this.configService.get<string>('JWT_SECRET');
    this.logger.log(`Valor de JWT_SECRET: ${secret}`);
    if (!secret) {
      this.logger.error('JWT_SECRET is not defined');
      throw new Error('JWT_SECRET is not defined');
    }
    const token = jwt.sign(payload, secret, { expiresIn: '1d' });
    this.logger.log(`Token generado para usuario: ${username}`);
    return token;
  }
}