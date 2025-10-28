import { IsString, IsNotEmpty, IsOptional, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsValidObservations } from '../../common/validators/observations.validator';
import { SanitizeObservations } from '../../common/decorators/sanitize-observations.decorator';

export class CreateChangeRequestDto {
  @ApiProperty({
    description: 'ID de la materia origen (actual)',
    example: '60d5ecb8b0a7c4b4b8b9b1a1',
  })
  @IsString({ message: 'El ID de materia origen debe ser texto' })
  @IsNotEmpty({ message: 'El ID de materia origen es obligatorio' })
  @IsMongoId({ message: 'El ID de materia origen debe ser válido' })
  sourceSubjectId: string;

  @ApiProperty({
    description: 'ID del grupo origen (actual)',
    example: '60d5ecb8b0a7c4b4b8b9b1a2',
  })
  @IsString({ message: 'El ID de grupo origen debe ser texto' })
  @IsNotEmpty({ message: 'El ID de grupo origen es obligatorio' })
  @IsMongoId({ message: 'El ID de grupo origen debe ser válido' })
  sourceGroupId: string;

  @ApiProperty({
    description: 'ID de la materia destino (deseada)',
    example: '60d5ecb8b0a7c4b4b8b9b1a3',
  })
  @IsString({ message: 'El ID de materia destino debe ser texto' })
  @IsNotEmpty({ message: 'El ID de materia destino es obligatorio' })
  @IsMongoId({ message: 'El ID de materia destino debe ser válido' })
  targetSubjectId: string;

  @ApiProperty({
    description: 'ID del grupo destino (deseado)',
    example: '60d5ecb8b0a7c4b4b8b9b1a4',
  })
  @IsString({ message: 'El ID de grupo destino debe ser texto' })
  @IsNotEmpty({ message: 'El ID de grupo destino es obligatorio' })
  @IsMongoId({ message: 'El ID de grupo destino debe ser válido' })
  targetGroupId: string;

  @ApiProperty({
    description: 'Razón del cambio solicitado',
    example: 'Conflicto de horario con trabajo',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'La razón debe ser texto' })
  reason?: string;

  @ApiProperty({
    description: 'Observaciones adicionales',
    example: 'Solicito cambio urgente por motivos laborales',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Las observaciones deben ser texto' })
  @IsValidObservations(500, {
    message: 'Las observaciones no pueden exceder 500 caracteres',
  })
  @SanitizeObservations()
  observations?: string | null;
}
