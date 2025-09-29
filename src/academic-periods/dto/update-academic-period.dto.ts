import { PartialType } from '@nestjs/swagger';
import { CreateAcademicPeriodDto } from './create-academic-period.dto';

/**
 * Update Academic Period DTO
 *
 * Data Transfer Object for updating existing academic periods.
 * Extends CreateAcademicPeriodDto as a partial type, allowing
 * selective updates of academic period properties.
 *
 * Features:
 * - All properties are optional for partial updates
 * - Inherits all validation rules from CreateAcademicPeriodDto
 * - Maintains data integrity during updates
 * - Supports Swagger documentation inheritance
 *
 * ! IMPORTANTE: Las actualizaciones de periodos académicos pueden
 * ! afectar matriculas existentes y deben realizarse con precaución
 *
 * ? Permite actualización parcial de cualquier campo del periodo
 */
export class UpdateAcademicPeriodDto extends PartialType(CreateAcademicPeriodDto) {}