import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { StudentsService } from '../students/services/students.service';
import { Student, StudentDocument } from '../students/entities/student.entity';
import { CreateStudentDto } from '../students/dto/create-student.dto';
import { UpdateStudentDto } from '../students/dto/update-student.dto';
import { StudentScheduleService } from '../schedules/services/student-schedule.service';

describe('StudentsService', () => {
  let service: StudentsService;
  let studentModel: any;
  let studentScheduleService: StudentScheduleService;

  const mockStudentId = '60d5ecb8b0a7c4b4b8b9b1a1';
  const mockStudent = {
    _id: mockStudentId,
    code: 'STU001',
    firstName: 'Juan',
    lastName: 'Pérez',
    fullName: 'Juan Pérez',
    programId: 'program123',
    currentSemester: 5,
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    // Create fresh mocks for each test
    const mockStudentModel: any = jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockResolvedValue({ 
        ...dto, 
        _id: mockStudentId,
        fullName: `${dto.firstName} ${dto.lastName}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    }));
    
    // Don't set default mock values - let each test set them explicitly
    mockStudentModel.findOne = jest.fn();
    mockStudentModel.find = jest.fn();
    mockStudentModel.findById = jest.fn();
    mockStudentModel.findByIdAndUpdate = jest.fn();
    mockStudentModel.findByIdAndDelete = jest.fn();

    const mockStudentScheduleService = {
      getCurrentSchedule: jest.fn(),
      getStudentAcademicHistory: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentsService,
        {
          provide: getModelToken(Student.name),
          useValue: mockStudentModel,
        },
        {
          provide: StudentScheduleService,
          useValue: mockStudentScheduleService,
        },
      ],
    }).compile();

    service = module.get<StudentsService>(StudentsService);
    studentModel = module.get(getModelToken(Student.name));
    studentScheduleService = module.get<StudentScheduleService>(
      StudentScheduleService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('create', () => {
    const createDto: CreateStudentDto = {
      code: 'STU001',
      firstName: 'Juan',
      lastName: 'Pérez',
      programId: 'program123',
      currentSemester: 1,
    };

    it('should throw ConflictException when student code already exists', async () => {
      studentModel.findOne.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(mockStudent),
      });

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return all students', async () => {
      const students = [mockStudent];
      studentModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(students),
      });

      const result = await service.findAll();

      expect(studentModel.find).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].code).toBe('STU001');
    });

    it('should return empty array when no students exist', async () => {
      studentModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a student by id', async () => {
      studentModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockStudent),
      });

      const result = await service.findOne(mockStudentId);

      expect(studentModel.findById).toHaveBeenCalledWith(mockStudentId);
      expect(result.code).toBe('STU001');
    });

    it('should throw NotFoundException when student not found', async () => {
      studentModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('nonexistent')).rejects.toThrow(
        /Student with ID nonexistent not found/,
      );
    });
  });

  describe('findByCode', () => {
    it('should return a student by code', async () => {
      studentModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockStudent),
      });

      const result = await service.findByCode('STU001');

      expect(studentModel.findOne).toHaveBeenCalledWith({ code: 'STU001' });
      expect(result.code).toBe('STU001');
    });

    it('should throw NotFoundException when student code not found', async () => {
      studentModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findByCode('NONEXISTENT')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findByCode('NONEXISTENT')).rejects.toThrow(
        /Student with code NONEXISTENT not found/,
      );
    });
  });

  describe('update', () => {
    const updateDto: UpdateStudentDto = {
      firstName: 'Juan Carlos',
      currentSemester: 6,
    };

    it('should update a student successfully', async () => {
      const updatedStudent = { ...mockStudent, ...updateDto };
      studentModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedStudent),
      });

      const result = await service.update(mockStudentId, updateDto);

      expect(studentModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockStudentId,
        updateDto,
        { new: true },
      );
      expect(result.firstName).toBe('Juan Carlos');
      expect(result.currentSemester).toBe(6);
    });

    it('should throw NotFoundException when student not found', async () => {
      studentModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.update('nonexistent', updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should allow partial updates', async () => {
      const partialUpdate = { firstName: 'Pedro' };
      const updatedStudent = { ...mockStudent, firstName: 'Pedro' };

      studentModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedStudent),
      });

      const result = await service.update(mockStudentId, partialUpdate);

      expect(result.firstName).toBe('Pedro');
    });
  });

  describe('remove', () => {
    it('should remove a student successfully', async () => {
      studentModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockStudent),
      });

      await service.remove(mockStudentId);

      expect(studentModel.findByIdAndDelete).toHaveBeenCalledWith(mockStudentId);
    });

    it('should throw NotFoundException when student not found', async () => {
      studentModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getStudentSchedule', () => {
    it('should return student schedule', async () => {
      const mockSchedule = {
        studentCode: 'STU001',
        courses: [],
      };

      (studentScheduleService.getCurrentSchedule as jest.Mock).mockResolvedValue(
        mockSchedule,
      );

      const result = await service.getStudentSchedule('STU001');

      expect(studentScheduleService.getCurrentSchedule).toHaveBeenCalledWith(
        'STU001',
      );
      expect(result).toEqual(mockSchedule);
    });
  });

  describe('getStudentAcademicHistory', () => {
    it('should return academic history', async () => {
      const mockHistory = {
        studentCode: 'STU001',
        semesters: [],
      };

      (
        studentScheduleService.getStudentAcademicHistory as jest.Mock
      ).mockResolvedValue(mockHistory);

      const result = await service.getStudentAcademicHistory('STU001');

      expect(
        studentScheduleService.getStudentAcademicHistory,
      ).toHaveBeenCalledWith('STU001');
      expect(result).toEqual(mockHistory);
    });
  });

  describe('Edge cases', () => {
    it('should return fullName in response', async () => {
      studentModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockStudent),
      });

      const result = await service.findOne(mockStudentId);

      expect(result).toHaveProperty('fullName');
      expect(result.fullName).toBe('Juan Pérez');
    });

    it('should update only specified fields', async () => {
      const updatedStudent = { ...mockStudent, currentSemester: 7 };
      studentModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedStudent),
      });

      const result = await service.update(mockStudentId, { currentSemester: 7 });

      expect(result.firstName).toBe('Juan'); // unchanged
      expect(result.currentSemester).toBe(7); // changed
    });
  });
});
