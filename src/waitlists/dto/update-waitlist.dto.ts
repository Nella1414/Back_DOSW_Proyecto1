import { PartialType } from '@nestjs/mapped-types';
import { CreateWaitlistDto } from './create-waitlist.dto';
import { WaitlistStatus } from '../entities/waitlist.entity';
import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para actualizar una entrada de lista de espera.
 * 
 * Extiende parcialmente CreateWaitlistDto, permitiendo actualizar
 * campos opcionales como prioridad, notas o estado.
 */
export class UpdateWaitlistDto extends PartialType(CreateWaitlistDto) {
  /**
   * Estado actual de la entrada en la lista de espera.
   * 
   * - WAITING: El estudiante está esperando cupo.
   * - ADMITTED: El estudiante fue admitido.
   * - WITHDRAWN: El estudiante fue retirado manualmente.
   * - EXPIRED: El estudiante no respondió a tiempo.
   */
  @ApiPropertyOptional({
    enum: WaitlistStatus,
    description: 'Nuevo estado de la entrada en la lista de espera',
    example: WaitlistStatus.ADMITTED,
  })
  @IsOptional()
  @IsEnum(WaitlistStatus, {
    message: `El estado debe ser uno de los siguientes valores: ${Object.values(
      WaitlistStatus,
    ).join(', ')}`,
  })
  status?: WaitlistStatus;
}
