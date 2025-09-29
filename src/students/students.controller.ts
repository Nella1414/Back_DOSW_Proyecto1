import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiConsumes,
  ApiProduces
} from '@nestjs/swagger';
import { StudentsService } from './services/students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { RequirePermissions } from '../auth/decorators/auth.decorator';
import { Permission } from '../roles/entities/role.entity';

/**
 * Students Controller
 *
 * Manages all student-related operations including registration, profile management,
 * and academic information tracking. This controller provides comprehensive CRUD
 * operations for student data management in the SIRHA system.
 *
 * @version 1.0.0
 * @author SIRHA Development Team
 */
@ApiTags('Student Management')
@Controller('students')
@ApiProduces('application/json')
@ApiConsumes('application/json')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  /**
   * Register a new student in the system
   *
   * Creates a comprehensive student profile with academic program association
   * and semester tracking capabilities.
   */
  @ApiOperation({
    summary: 'Register new student',
    description: `
    Creates a new student record in the SIRHA academic management system.

    **Student Registration Process:**
    1. **Validation**: Ensures student code uniqueness and data integrity
    2. **Program Linking**: Associates student with valid academic program
    3. **Profile Creation**: Establishes complete student academic profile
    4. **Enrollment Readiness**: Prepares student for course enrollment

    **Key Features:**
    - **Unique Student Codes**: Prevents duplicate registrations
    - **Program Association**: Links students to their academic programs
    - **Semester Tracking**: Monitors academic progress and standing
    - **Data Validation**: Ensures complete and accurate student information

    **Use Cases:**
    - New student admission processing
    - Transfer student registration
    - Program change documentation
    - Academic record initialization
    `,
    operationId: 'createStudent'
  })
  @ApiBody({
    type: CreateStudentDto,
    description: 'Student registration information',
    examples: {
      computerScience: {
        summary: 'Computer Science Student',
        description: 'Example registration for computer science program',
        value: {
          code: 'CS2024001',
          firstName: 'Maria',
          lastName: 'Rodriguez',
          programId: '60d5ecb8b0a7c4b4b8b9b1a1',
          currentSemester: 1
        }
      },
      engineering: {
        summary: 'Engineering Student',
        description: 'Example registration for engineering program',
        value: {
          code: 'ENG2024015',
          firstName: 'Carlos',
          lastName: 'Martinez',
          programId: '60d5ecb8b0a7c4b4b8b9b1a2',
          currentSemester: 3
        }
      },
      transferStudent: {
        summary: 'Transfer Student',
        description: 'Example registration for transfer student with advanced standing',
        value: {
          code: 'BUS2024007',
          firstName: 'Ana',
          lastName: 'Garcia',
          programId: '60d5ecb8b0a7c4b4b8b9b1a3',
          currentSemester: 5
        }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Student registered successfully',
    schema: {
      type: 'object',
      properties: {
        _id: {
          type: 'string',
          example: '60d5ecb8b0a7c4b4b8b9b1a4',
          description: 'Unique student database identifier'
        },
        code: {
          type: 'string',
          example: 'CS2024001',
          description: 'Unique student identification code'
        },
        firstName: {
          type: 'string',
          example: 'Maria',
          description: 'Student first name'
        },
        lastName: {
          type: 'string',
          example: 'Rodriguez',
          description: 'Student last name'
        },
        fullName: {
          type: 'string',
          example: 'Maria Rodriguez',
          description: 'Computed full name for display'
        },
        programId: {
          type: 'string',
          example: '60d5ecb8b0a7c4b4b8b9b1a1',
          description: 'Associated academic program identifier'
        },
        currentSemester: {
          type: 'number',
          example: 1,
          description: 'Current academic semester'
        },
        createdAt: {
          type: 'string',
          format: 'date-time',
          example: '2024-01-15T10:30:00.000Z',
          description: 'Registration timestamp'
        },
        updatedAt: {
          type: 'string',
          format: 'date-time',
          example: '2024-01-15T10:30:00.000Z',
          description: 'Last update timestamp'
        }
      }
    }
  })
  @ApiResponse({
    status: 409,
    description: 'Student registration conflict - Code already exists',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 409 },
        message: { type: 'string', example: 'STUDENT_CODE_EXISTS' },
        error: { type: 'string', example: 'Conflict' }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid student registration data',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'array',
          items: { type: 'string' },
          example: ['Student code is required', 'First name must be between 2 and 50 characters']
        },
        error: { type: 'string', example: 'Bad Request' }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Associated program not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'PROGRAM_NOT_FOUND' },
        error: { type: 'string', example: 'Not Found' }
      }
    }
  })
  @ApiBearerAuth()
  @RequirePermissions(Permission.CREATE_USER)
  @Post()
  create(@Body() createStudentDto: CreateStudentDto) {
    return this.studentsService.create(createStudentDto);
  }

  /**
   * Retrieve all registered students
   *
   * Returns a comprehensive list of all students in the system with their
   * associated program information and current academic standing.
   */
  @ApiOperation({
    summary: 'Get all registered students',
    description: `
    Retrieves a complete list of all students registered in the SIRHA system.

    **Response Features:**
    - **Complete Student Profiles**: All student information including names, codes, and academic details
    - **Program Association**: Linked academic program information for each student
    - **Academic Progress**: Current semester and standing information
    - **Enrollment Status**: Active/inactive status for each student

    **Filtering and Sorting:**
    - Students are returned in creation order (newest first)
    - All active and inactive students included
    - Complete profile data for administrative overview

    **Use Cases:**
    - Administrative student overview
    - Academic planning and analysis
    - Enrollment reporting
    - Student directory generation
    `,
    operationId: 'getAllStudents'
  })
  @ApiResponse({
    status: 200,
    description: 'Students retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          _id: {
            type: 'string',
            example: '60d5ecb8b0a7c4b4b8b9b1a4',
            description: 'Student database identifier'
          },
          code: {
            type: 'string',
            example: 'CS2024001',
            description: 'Student identification code'
          },
          firstName: {
            type: 'string',
            example: 'Maria',
            description: 'Student first name'
          },
          lastName: {
            type: 'string',
            example: 'Rodriguez',
            description: 'Student last name'
          },
          fullName: {
            type: 'string',
            example: 'Maria Rodriguez',
            description: 'Full name for display'
          },
          programId: {
            type: 'string',
            example: '60d5ecb8b0a7c4b4b8b9b1a1',
            description: 'Academic program identifier'
          },
          currentSemester: {
            type: 'number',
            example: 3,
            description: 'Current semester number'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Registration date'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last update date'
          }
        }
      },
      example: [
        {
          _id: '60d5ecb8b0a7c4b4b8b9b1a4',
          code: 'CS2024001',
          firstName: 'Maria',
          lastName: 'Rodriguez',
          fullName: 'Maria Rodriguez',
          programId: '60d5ecb8b0a7c4b4b8b9b1a1',
          currentSemester: 3,
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-01-20T14:45:00.000Z'
        },
        {
          _id: '60d5ecb8b0a7c4b4b8b9b1a5',
          code: 'ENG2024015',
          firstName: 'Carlos',
          lastName: 'Martinez',
          fullName: 'Carlos Martinez',
          programId: '60d5ecb8b0a7c4b4b8b9b1a2',
          currentSemester: 5,
          createdAt: '2024-01-12T09:15:00.000Z',
          updatedAt: '2024-01-12T09:15:00.000Z'
        }
      ]
    }
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication required',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Unauthorized' },
        error: { type: 'string', example: 'Unauthorized' }
      }
    }
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions - READ_USER permission required',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 403 },
        message: {
          type: 'string',
          example: 'Access denied. Required permission: READ_USER'
        },
        error: { type: 'string', example: 'Forbidden' }
      }
    }
  })
  @ApiBearerAuth()
  @RequirePermissions(Permission.READ_USER)
  @Get()
  findAll() {
    return this.studentsService.findAll();
  }

  /**
   * Retrieve specific student by ID
   *
   * Returns detailed information for a specific student including their
   * complete academic profile and program association.
   */
  @ApiOperation({
    summary: 'Get student by database ID',
    description: `
    Retrieves detailed information for a specific student using their database identifier.

    **Student Profile Information:**
    - **Personal Details**: Complete name and identification information
    - **Academic Status**: Current semester and program association
    - **Registration Data**: Creation and last update timestamps
    - **Program Details**: Associated academic program information

    **Data Integrity:**
    - Validates student existence before returning data
    - Ensures complete profile information
    - Maintains referential integrity with academic programs

    **Use Cases:**
    - Student profile viewing
    - Academic counseling preparation
    - Enrollment verification
    - Administrative record access
    `,
    operationId: 'getStudentById'
  })
  @ApiParam({
    name: 'id',
    description: 'Student database identifier (MongoDB ObjectId)',
    example: '60d5ecb8b0a7c4b4b8b9b1a4',
    type: 'string'
  })
  @ApiResponse({
    status: 200,
    description: 'Student found and returned successfully',
    schema: {
      type: 'object',
      properties: {
        _id: {
          type: 'string',
          example: '60d5ecb8b0a7c4b4b8b9b1a4',
          description: 'Student database identifier'
        },
        code: {
          type: 'string',
          example: 'CS2024001',
          description: 'Unique student identification code'
        },
        firstName: {
          type: 'string',
          example: 'Maria',
          description: 'Student first name'
        },
        lastName: {
          type: 'string',
          example: 'Rodriguez',
          description: 'Student last name'
        },
        fullName: {
          type: 'string',
          example: 'Maria Rodriguez',
          description: 'Computed full name for display purposes'
        },
        programId: {
          type: 'string',
          example: '60d5ecb8b0a7c4b4b8b9b1a1',
          description: 'Associated academic program identifier'
        },
        currentSemester: {
          type: 'number',
          example: 3,
          description: 'Current academic semester (1-12)'
        },
        createdAt: {
          type: 'string',
          format: 'date-time',
          example: '2024-01-15T10:30:00.000Z',
          description: 'Student registration timestamp'
        },
        updatedAt: {
          type: 'string',
          format: 'date-time',
          example: '2024-01-20T14:45:00.000Z',
          description: 'Last profile update timestamp'
        }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Student not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'STUDENT_NOT_FOUND' },
        error: { type: 'string', example: 'Not Found' }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid student ID format',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'Invalid ObjectId format' },
        error: { type: 'string', example: 'Bad Request' }
      }
    }
  })
  @ApiBearerAuth()
  @RequirePermissions(Permission.READ_USER)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.studentsService.findOne(id);
  }

  /**
   * Update student information
   *
   * Allows modification of student profile data including academic progress
   * and program associations with comprehensive validation.
   */
  @ApiOperation({
    summary: 'Update student profile information',
    description: `
    Updates existing student profile information with comprehensive validation and data integrity checks.

    **Updatable Fields:**
    - **Personal Information**: First name, last name modifications
    - **Academic Details**: Current semester progression
    - **Program Changes**: Academic program reassignment (with validation)
    - **Identification**: Student code updates (with uniqueness validation)

    **Update Process:**
    1. **Validation**: Ensures all provided data meets system requirements
    2. **Uniqueness Check**: Validates student code uniqueness (if changed)
    3. **Program Verification**: Confirms new program exists (if changed)
    4. **Profile Update**: Applies changes with timestamp tracking
    5. **Response**: Returns updated complete profile

    **Data Integrity:**
    - Maintains referential integrity with academic programs
    - Prevents duplicate student codes
    - Validates semester progression logic
    - Preserves audit trail with update timestamps

    **Use Cases:**
    - Name corrections and legal name changes
    - Academic progress updates (semester advancement)
    - Program transfer processing
    - Student identification updates
    `,
    operationId: 'updateStudent'
  })
  @ApiParam({
    name: 'id',
    description: 'Student database identifier (MongoDB ObjectId)',
    example: '60d5ecb8b0a7c4b4b8b9b1a4',
    type: 'string'
  })
  @ApiBody({
    type: UpdateStudentDto,
    description: 'Student update information (partial update supported)',
    examples: {
      semesterUpdate: {
        summary: 'Semester Progression',
        description: 'Update student to next semester',
        value: {
          currentSemester: 4
        }
      },
      nameCorrection: {
        summary: 'Name Correction',
        description: 'Update student name information',
        value: {
          firstName: 'María',
          lastName: 'Rodríguez'
        }
      },
      programTransfer: {
        summary: 'Program Transfer',
        description: 'Transfer student to different academic program',
        value: {
          programId: '60d5ecb8b0a7c4b4b8b9b1a2',
          currentSemester: 1
        }
      },
      fullUpdate: {
        summary: 'Complete Profile Update',
        description: 'Update multiple student fields',
        value: {
          code: 'CS2024001-NEW',
          firstName: 'Maria Elena',
          lastName: 'Rodriguez Martinez',
          currentSemester: 5
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Student updated successfully',
    schema: {
      type: 'object',
      properties: {
        _id: {
          type: 'string',
          example: '60d5ecb8b0a7c4b4b8b9b1a4',
          description: 'Student database identifier'
        },
        code: {
          type: 'string',
          example: 'CS2024001',
          description: 'Student identification code'
        },
        firstName: {
          type: 'string',
          example: 'Maria Elena',
          description: 'Updated first name'
        },
        lastName: {
          type: 'string',
          example: 'Rodriguez Martinez',
          description: 'Updated last name'
        },
        fullName: {
          type: 'string',
          example: 'Maria Elena Rodriguez Martinez',
          description: 'Updated computed full name'
        },
        programId: {
          type: 'string',
          example: '60d5ecb8b0a7c4b4b8b9b1a1',
          description: 'Academic program identifier'
        },
        currentSemester: {
          type: 'number',
          example: 5,
          description: 'Updated current semester'
        },
        createdAt: {
          type: 'string',
          format: 'date-time',
          example: '2024-01-15T10:30:00.000Z',
          description: 'Original registration timestamp'
        },
        updatedAt: {
          type: 'string',
          format: 'date-time',
          example: '2024-01-25T16:20:00.000Z',
          description: 'Latest update timestamp'
        }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Student not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'STUDENT_NOT_FOUND' },
        error: { type: 'string', example: 'Not Found' }
      }
    }
  })
  @ApiResponse({
    status: 409,
    description: 'Update conflict - Student code already exists',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 409 },
        message: { type: 'string', example: 'STUDENT_CODE_EXISTS' },
        error: { type: 'string', example: 'Conflict' }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid update data or ID format',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'array',
          items: { type: 'string' },
          example: ['Semester must be between 1 and 12', 'Invalid ObjectId format']
        },
        error: { type: 'string', example: 'Bad Request' }
      }
    }
  })
  @ApiBearerAuth()
  @RequirePermissions(Permission.UPDATE_USER)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateStudentDto: UpdateStudentDto) {
    return this.studentsService.update(id, updateStudentDto);
  }

  /**
   * Remove student from system
   *
   * Permanently deletes a student record from the system with proper
   * validation and cascade considerations.
   */
  @ApiOperation({
    summary: 'Delete student record',
    description: `
    Permanently removes a student record from the SIRHA system.

    **Deletion Process:**
    1. **Student Verification**: Confirms student exists in system
    2. **Dependency Check**: Validates no active enrollments or academic records
    3. **Cascade Deletion**: Removes associated waitlist entries and change requests
    4. **Audit Trail**: Logs deletion for administrative records
    5. **Confirmation**: Returns deletion confirmation

    **⚠️ CRITICAL WARNINGS:**
    - **Permanent Action**: This operation cannot be undone
    - **Data Loss**: All student information will be permanently deleted
    - **Academic Records**: Associated academic history may be affected
    - **Enrollment Impact**: Active enrollments should be handled separately

    **Pre-Deletion Recommendations:**
    - Verify student has no active enrollments
    - Export important academic records if needed
    - Confirm deletion authorization from academic administration
    - Consider deactivation as alternative to deletion

    **Use Cases:**
    - Administrative error correction
    - Duplicate record cleanup
    - Student withdrawal processing
    - Data privacy compliance (GDPR/FERPA)
    `,
    operationId: 'deleteStudent'
  })
  @ApiParam({
    name: 'id',
    description: 'Student database identifier (MongoDB ObjectId)',
    example: '60d5ecb8b0a7c4b4b8b9b1a4',
    type: 'string'
  })
  @ApiResponse({
    status: 200,
    description: 'Student deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'STUDENT_DELETED_SUCCESSFULLY',
          description: 'Deletion confirmation message'
        },
        deletedStudent: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '60d5ecb8b0a7c4b4b8b9b1a4',
              description: 'Deleted student identifier'
            },
            code: {
              type: 'string',
              example: 'CS2024001',
              description: 'Deleted student code'
            },
            fullName: {
              type: 'string',
              example: 'Maria Rodriguez',
              description: 'Deleted student name'
            }
          },
          description: 'Basic information of deleted student for confirmation'
        },
        deletedAt: {
          type: 'string',
          format: 'date-time',
          example: '2024-01-25T18:30:00.000Z',
          description: 'Deletion timestamp'
        }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Student not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'STUDENT_NOT_FOUND' },
        error: { type: 'string', example: 'Not Found' }
      }
    }
  })
  @ApiResponse({
    status: 409,
    description: 'Cannot delete student - Active dependencies exist',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 409 },
        message: {
          type: 'string',
          example: 'Cannot delete student with active enrollments. Please handle enrollments first.'
        },
        error: { type: 'string', example: 'Conflict' },
        details: {
          type: 'object',
          properties: {
            activeEnrollments: { type: 'number', example: 3 },
            waitlistEntries: { type: 'number', example: 1 }
          },
          description: 'Details about preventing dependencies'
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid student ID format',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'Invalid ObjectId format' },
        error: { type: 'string', example: 'Bad Request' }
      }
    }
  })
  @ApiBearerAuth()
  @RequirePermissions(Permission.DELETE_USER)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.studentsService.remove(id);
  }

  @ApiOperation({
    summary: 'Get student schedule',
    description: 'Retrieves the current schedule for a specific student'
  })
  @ApiParam({
    name: 'studentCode',
    description: 'Student identification code',
    example: 'CS2024001'
  })
  @ApiResponse({ status: 200, description: 'Student schedule retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  @ApiBearerAuth()
  @Get(':studentCode/schedule')
  getSchedule(@Param('studentCode') studentCode: string) {
    return this.studentsService.getStudentSchedule(studentCode);
  }

  @ApiOperation({
    summary: 'Get student by code',
    description: 'Retrieves student information using their student code'
  })
  @ApiParam({
    name: 'studentCode',
    description: 'Student identification code',
    example: 'SIS2024001'
  })
  @ApiResponse({ status: 200, description: 'Student found successfully' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  @ApiBearerAuth()
  @RequirePermissions(Permission.READ_USER)
  @Get('code/:studentCode')
  findByCode(@Param('studentCode') studentCode: string) {
    return this.studentsService.findByCode(studentCode);
  }

  @ApiOperation({
    summary: 'Get student academic history',
    description: 'Retrieves the academic history with traffic light system for a student'
  })
  @ApiParam({
    name: 'studentCode',
    description: 'Student identification code',
    example: 'CS2024001'
  })
  @ApiResponse({ status: 200, description: 'Academic history retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  @ApiBearerAuth()
  @Get(':studentCode/academic-history')
  getAcademicHistory(@Param('studentCode') studentCode: string) {
    return this.studentsService.getStudentAcademicHistory(studentCode);
  }
}
