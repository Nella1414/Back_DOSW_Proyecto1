import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateAcademicPeriodDto } from '../dto/create-academic-period.dto';
import { UpdateAcademicPeriodDto } from '../dto/update-academic-period.dto';
import {
  AcademicPeriod,
  AcademicPeriodDocument,
} from '../entities/academic-period.entity';

/**
 * Academic Periods Service
 *
 * Handles all business logic for academic period management including:
 * - CRUD operations for academic periods
 * - Active period management
 * - Period validation and status checks
 * - Enrollment period management
 */
@Injectable()
export class AcademicPeriodsService {
  constructor(
    @InjectModel(AcademicPeriod.name)
    private readonly academicPeriodModel: Model<AcademicPeriodDocument>,
  ) {}

  /**
   * * Create a new academic period
   *
   * @param createAcademicPeriodDto - Data for creating the academic period
   * @returns Promise<AcademicPeriod> - The created academic period
   * @throws ConflictException - If period code already exists
   */
  async create(
    createAcademicPeriodDto: CreateAcademicPeriodDto,
  ): Promise<AcademicPeriod> {
    try {
      // TODO: Verificar que el código del periodo no exista
      const existingPeriod = await this.academicPeriodModel.findOne({
        code: createAcademicPeriodDto.code,
      });

      if (existingPeriod) {
        throw new ConflictException('Academic period code already exists');
      }

      // TODO: Validar que las fechas sean coherentes
      if (
        new Date(createAcademicPeriodDto.startDate) >=
        new Date(createAcademicPeriodDto.endDate)
      ) {
        throw new ConflictException('Start date must be before end date');
      }

      const newPeriod = new this.academicPeriodModel(createAcademicPeriodDto);
      return await newPeriod.save();
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new Error('Failed to create academic period');
    }
  }

  /**
   * Get all academic periods
   *
   * @returns Promise<AcademicPeriod[]> - Array of all academic periods
   */
  async findAll(): Promise<AcademicPeriod[]> {
    return await this.academicPeriodModel.find().sort({ startDate: -1 }).exec();
  }

  /**
   * Find an academic period by ID
   *
   * @param id - MongoDB ObjectId of the academic period
   * @returns Promise<AcademicPeriod> - The found academic period
   * @throws NotFoundException - If period not found
   */
  async findOne(id: string): Promise<AcademicPeriod> {
    const period = await this.academicPeriodModel.findById(id).exec();

    if (!period) {
      throw new NotFoundException(`Academic period with ID ${id} not found`);
    }

    return period;
  }

  /**
   * Find an academic period by code
   *
   * @param code - Unique code of the academic period
   * @returns Promise<AcademicPeriod> - The found academic period
   * @throws NotFoundException - If period not found
   */
  async findByCode(code: string): Promise<AcademicPeriod> {
    const period = await this.academicPeriodModel.findOne({ code }).exec();

    if (!period) {
      throw new NotFoundException(
        `Academic period with code ${code} not found`,
      );
    }

    return period;
  }

  /**
   * Get the currently active academic period
   *
   * @returns Promise<AcademicPeriod | null> - Active period or null if none
   */
  async getActivePeriod(): Promise<AcademicPeriod | null> {
    return await this.academicPeriodModel.findOne({ isActive: true }).exec();
  }

  /**
   * Get all periods that allow change requests
   *
   * @returns Promise<AcademicPeriod[]> - Periods with change requests enabled
   */
  async getPeriodsAllowingChanges(): Promise<AcademicPeriod[]> {
    return await this.academicPeriodModel
      .find({ allowChangeRequests: true })
      .exec();
  }

  /**
   * Get periods with open enrollment
   *
   * @returns Promise<AcademicPeriod[]> - Periods with enrollment open
   */
  async getPeriodsWithOpenEnrollment(): Promise<AcademicPeriod[]> {
    return await this.academicPeriodModel
      .find({ isEnrollmentOpen: true })
      .exec();
  }

  /**
   * Update an academic period
   *
   * @param id - MongoDB ObjectId of the period to update
   * @param updateAcademicPeriodDto - Data for updating the period
   * @returns Promise<AcademicPeriod> - The updated period
   * @throws NotFoundException - If period not found
   */
  async update(
    id: string,
    updateAcademicPeriodDto: UpdateAcademicPeriodDto,
  ): Promise<AcademicPeriod> {
    // TODO: Validar fechas si se están actualizando
    if (updateAcademicPeriodDto.startDate && updateAcademicPeriodDto.endDate) {
      if (
        new Date(updateAcademicPeriodDto.startDate) >=
        new Date(updateAcademicPeriodDto.endDate)
      ) {
        throw new ConflictException('Start date must be before end date');
      }
    }

    const updatedPeriod = await this.academicPeriodModel
      .findByIdAndUpdate(id, updateAcademicPeriodDto, { new: true })
      .exec();

    if (!updatedPeriod) {
      throw new NotFoundException(`Academic period with ID ${id} not found`);
    }

    return updatedPeriod;
  }

  /**
   * Set a period as active (deactivates all other periods)
   *
   * @param id - MongoDB ObjectId of the period to activate
   * @returns Promise<AcademicPeriod> - The activated period
   * @throws NotFoundException - If period not found
   */
  async setActivePeriod(id: string): Promise<AcademicPeriod> {
    // TODO: Desactivar todos los demás periodos primero
    await this.academicPeriodModel.updateMany({}, { isActive: false });

    const activatedPeriod = await this.academicPeriodModel
      .findByIdAndUpdate(id, { isActive: true }, { new: true })
      .exec();

    if (!activatedPeriod) {
      throw new NotFoundException(`Academic period with ID ${id} not found`);
    }

    return activatedPeriod;
  }

  /**
   * Remove an academic period
   *
   * @param id - MongoDB ObjectId of the period to delete
   * @returns Promise<void>
   * @throws NotFoundException - If period not found
   * @throws ConflictException - If period has associated data
   */
  async remove(id: string): Promise<void> {
    const period = await this.academicPeriodModel.findById(id).exec();

    if (!period) {
      throw new NotFoundException(`Academic period with ID ${id} not found`);
    }

    // Check if period has associated enrollments or course groups
    const hasAssociatedData = this.hasAssociatedData();
    if (hasAssociatedData) {
      throw new ConflictException(
        'Cannot delete academic period with associated enrollments or course groups',
      );
    }

    await this.academicPeriodModel.findByIdAndDelete(id).exec();
  }

  /**
   * Check if a period has associated data (enrollments, course groups, etc.)
   */
  private hasAssociatedData(): boolean {
    // This would need to be implemented based on your database relationships
    // For now, return false to allow deletion
    // In a real implementation, you would check for:
    // - Course groups in this period
    // - Enrollments in course groups of this period
    // - Any other associated data
    return false;
  }

  /**
   * Validate period dates don't overlap with existing periods
   */
  async validatePeriodDates(
    startDate: Date,
    endDate: Date,
    excludeId?: string,
  ): Promise<void> {
    const query: Record<string, unknown> = {
      $or: [
        {
          $and: [
            { startDate: { $lte: startDate } },
            { endDate: { $gte: startDate } },
          ],
        },
        {
          $and: [
            { startDate: { $lte: endDate } },
            { endDate: { $gte: endDate } },
          ],
        },
        {
          $and: [
            { startDate: { $gte: startDate } },
            { endDate: { $lte: endDate } },
          ],
        },
      ],
    };

    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const overlappingPeriods = await this.academicPeriodModel
      .find(query)
      .exec();

    if (overlappingPeriods.length > 0) {
      throw new ConflictException(
        'Academic period dates overlap with existing periods',
      );
    }
  }

  /**
   * Get periods with pagination and filtering
   */
  async findAllWithFilters(
    page: number = 1,
    limit: number = 10,
    status?: string,
    year?: number,
  ): Promise<{
    periods: AcademicPeriod[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;
    const query: Record<string, unknown> = {};

    if (status) {
      query.status = status;
    }

    if (year) {
      query.startDate = {
        $gte: new Date(year, 0, 1),
        $lt: new Date(year + 1, 0, 1),
      };
    }

    const [periods, total] = await Promise.all([
      this.academicPeriodModel
        .find(query)
        .sort({ startDate: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.academicPeriodModel.countDocuments(query).exec(),
    ]);

    return {
      periods,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Check if a period is currently in enrollment phase
   *
   * @param periodId - MongoDB ObjectId of the period
   * @returns Promise<boolean> - True if enrollment is open
   */
  async isEnrollmentOpen(periodId: string): Promise<boolean> {
    const period = await this.findOne(periodId);
    return period.isEnrollmentOpen;
  }

  /**
   * Check if a period allows change requests
   *
   * @param periodId - MongoDB ObjectId of the period
   * @returns Promise<boolean> - True if change requests are allowed
   */
  async allowsChangeRequests(periodId: string): Promise<boolean> {
    const period = await this.findOne(periodId);
    return period.allowChangeRequests;
  }
}
