import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import { hash, compare } from 'bcrypt';

import { LoginAuthDto } from './dto/login-auth.dto';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { User, UserDocument } from '../users/entities/user.entity';
import { RoleName } from '../roles/entities/role.entity';

import { v4 as uuidv4 } from 'uuid';


@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) 
    private readonly userModel: Model<UserDocument>,
    private readonly jwtService: JwtService
  ) {}
//register user
  async register(userObject: RegisterAuthDto) {
    try {
      const findUser = await this.userModel.findOne({ email: userObject.email });
      if (findUser) {
        throw new HttpException('USER_ALREADY_EXISTS', HttpStatus.CONFLICT);
      }

      const { password, ...userData } = userObject;
      const hashedPassword = await hash(password, 10);
      
      const newUser = await this.userModel.create({
        ...userData,
        password: hashedPassword
      });

      // Remmove password from response
      const { password: _, ...userResponse } = newUser.toObject();
      return userResponse;

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      if (error.code === 11000) {
        throw new HttpException('EMAIL_ALREADY_EXISTS', HttpStatus.CONFLICT);
      }
      console.error('Register error:', error);
      throw new HttpException('REGISTRATION_FAILED', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
//login user
  async login(loginObject: LoginAuthDto) {
    try {
      const { email, password } = loginObject;
      const findUser = await this.userModel.findOne({ email });
      
      if (!findUser) {
        throw new HttpException('USER_NOT_FOUND', HttpStatus.NOT_FOUND);
      }

      if (!findUser.active) {
        throw new HttpException('USER_INACTIVE', HttpStatus.FORBIDDEN);
      }

      if (!findUser.password) {
        throw new HttpException('INVALID_USER_DATA', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      const checkPassword = await compare(password, findUser.password);
      
      if (!checkPassword) {
        throw new HttpException('PASSWORD_INCORRECT', HttpStatus.FORBIDDEN);
      }

      // Generate JWT
      const payload = { 
        sub: findUser._id, 
        email: findUser.email,
        roles: findUser.roles
      };

      const accessToken = this.jwtService.sign(payload);

      return {
        user: {
          id: findUser._id,
          email: findUser.email,
          displayName: findUser.displayName,
          externalId: findUser.externalId,
          roles: findUser.roles,
          active: findUser.active
        },
        accessToken,
        tokenType: 'Bearer'
      };

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('LOGIN_FAILED', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Update user roles by admin
  async updateUserRoles(userId: string, newRoles: RoleName[]): Promise<User> {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { roles: newRoles },
      { new: true }
    );

    if (!user) {
      throw new HttpException('USER_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    return user;
  }

  // Token validation and user retrieval
  async validateUser(userId: string): Promise<User | null> {
    const user = await this.userModel.findById(userId);
    
    if (!user || !user.active) {
      return null;
    }

    return user;
  }

//Google Config
  async googleLogin(googleUser: any) {
    try {
      // Search for existing user by email
      let user = await this.userModel.findOne({ email: googleUser.email });

      if (!user) {
        // If not found, create a new user
        user = await this.userModel.create({
          email: googleUser.email,
          displayName: `${googleUser.firstName} ${googleUser.lastName}`,
          externalId: uuidv4(),
          roles: [RoleName.STUDENT], 
          active: true,
          // Store Google-specific info
          googleId: googleUser.googleId,
          firstName: googleUser.firstName,
          lastName: googleUser.lastName,
          picture: googleUser.picture,
          isGoogleUser: true,
          // No password since it's a Google user
        });
      } else {
        // If user exists but is not marked as Google user, update their info
        if (!user.googleId) {
          await this.userModel.findByIdAndUpdate(user._id, {
            googleId: googleUser.googleId,
            firstName: googleUser.firstName,
            lastName: googleUser.lastName,
            picture: googleUser.picture,
            isGoogleUser: true,
          });
        }
      }

      const payload = { 
        sub: user._id, 
        email: user.email,
        roles: user.roles
      };

      const accessToken = this.jwtService.sign(payload);

      return {
        user: {
          id: user._id,
          email: user.email,
          displayName: user.displayName,
          externalId: user.externalId,
          roles: user.roles,
          active: user.active,
          picture: user.picture,
          isGoogleUser: true
        },
        accessToken,
        tokenType: 'Bearer'
      };

    } catch (error) {
      console.error('Google login error:', error);
      throw new HttpException('GOOGLE_LOGIN_FAILED', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}