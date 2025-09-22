import { IsEmail,MaxLength,MinLength } from "class-validator";
export class LoginAuthDto {
    @IsEmail({},{message: 'Invalid email format'})
    email: string;
    @MinLength(6,{message: 'Password must be at least 6 characters long'})
    @MaxLength(100,{message: 'Password must be at most 100 characters long'})
    password: string;
}
