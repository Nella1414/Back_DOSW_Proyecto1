import { IntersectionType } from '@nestjs/mapped-types';
import { LoginAuthDto } from './login-auth.dto';
import { MaxLength,MinLength,IsOptional,IsNotEmpty,IsEmail,Length } from "class-validator";


export class RegisterAuthDto extends IntersectionType(LoginAuthDto) {
    @MinLength(3,{message: 'Name must be at least 3 characters long'})
    @MaxLength(50,{message: 'Name must be at most 50 characters long'})
    name: string;
    @MaxLength(100,{message: 'Display name must be at most 100 characters long'})
    displayName: string;

    @IsOptional()
    externalId?: string;

    @IsOptional()
    active?: boolean;

    @IsOptional()
    googleId?: string;

    @IsOptional()
    firstName?: string;

    @IsOptional()
    lastName?: string;

    @IsOptional()
    picture?: string;
}

