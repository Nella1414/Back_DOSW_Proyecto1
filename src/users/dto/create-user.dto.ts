import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
} from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  externalId: string;
  @IsNotEmpty()
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;
  @IsNotEmpty()
  @Length(5, 50)
  displayName: string;
  @IsNotEmpty()
  @IsBoolean({ message: 'Active must be a boolean value' })
  active: boolean;
  @IsArray({ message: 'Roles must be an array of strings' })
  @IsString({ each: true, message: 'Each role must be a string' })
  roles: string[];
  @IsNotEmpty()
  @Length(6, 100, { message: 'Password must be between 6 and 100 characters' })
  password: string;
}
