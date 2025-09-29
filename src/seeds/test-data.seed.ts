import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app/app.module';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';

// Import all entities
import { Faculty, FacultyDocument } from '../faculty/entities/faculty.entity';
import { Program, ProgramDocument } from '../programs/entities/program.entity';
import { AcademicPeriod, AcademicPeriodDocument } from '../academic-periods/entities/academic-period.entity';
import { Course, CourseDocument } from '../courses/entities/course.entity';
import { CourseGroup, CourseGroupDocument } from '../course-groups/entities/course-group.entity';
import { GroupSchedule, GroupScheduleDocument } from '../group-schedules/entities/group-schedule.entity';
import { Student, StudentDocument } from '../students/entities/student.entity';
import { User, UserDocument } from '../users/entities/user.entity';
import { Enrollment, EnrollmentDocument, EnrollmentStatus } from '../enrollments/entities/enrollment.entity';
import { Role, RoleDocument, RoleName, Permission } from '../roles/entities/role.entity';

export async function seedTestData() {
  console.log('Starting test data seeding...');

  const app = await NestFactory.createApplicationContext(AppModule);

  // Get models
  const facultyModel = app.get<Model<FacultyDocument>>(getModelToken(Faculty.name));
  const programModel = app.get<Model<ProgramDocument>>(getModelToken(Program.name));
  const periodModel = app.get<Model<AcademicPeriodDocument>>(getModelToken(AcademicPeriod.name));
  const courseModel = app.get<Model<CourseDocument>>(getModelToken(Course.name));
  const courseGroupModel = app.get<Model<CourseGroupDocument>>(getModelToken(CourseGroup.name));
  const groupScheduleModel = app.get<Model<GroupScheduleDocument>>(getModelToken(GroupSchedule.name));
  const studentModel = app.get<Model<StudentDocument>>(getModelToken(Student.name));
  const userModel = app.get<Model<UserDocument>>(getModelToken(User.name));
  const enrollmentModel = app.get<Model<EnrollmentDocument>>(getModelToken(Enrollment.name));
  const roleModel = app.get<Model<RoleDocument>>(getModelToken(Role.name));

  try {
    // Clear existing data
    console.log('Clearing existing data...');
    await Promise.all([
      facultyModel.deleteMany({}),
      programModel.deleteMany({}),
      periodModel.deleteMany({}),
      courseModel.deleteMany({}),
      courseGroupModel.deleteMany({}),
      groupScheduleModel.deleteMany({}),
      studentModel.deleteMany({}),
      userModel.deleteMany({}),
      enrollmentModel.deleteMany({}),
      roleModel.deleteMany({})
    ]);

    // 0. Create Roles first
    console.log('Creating Roles...');
    const studentRole = await roleModel.create({
      name: RoleName.STUDENT,
      displayName: 'Student',
      description: 'Student role with basic permissions',
      permissions: [
        Permission.READ_USER,
        Permission.READ_COURSE,
        Permission.READ_ENROLLMENT,
        Permission.CREATE_ENROLLMENT,
        Permission.READ_GRADE
      ],
      isActive: true,
      priority: 3
    });

    const adminRole = await roleModel.create({
      name: RoleName.ADMIN,
      displayName: 'Administrator',
      description: 'Administrator with full permissions',
      permissions: Object.values(Permission),
      isActive: true,
      priority: 1
    });

    // 1. Create Faculty
    console.log('Creating Faculty...');
    const faculty = await facultyModel.create({
      code: 'FAC-ING',
      name: 'Faculty of Engineering',
      description: 'Faculty of Engineering and Technology',
      email: 'engineering@university.edu',
      phone: '+57 1 234-5678',
      isActive: true
    });

    // 2. Create Academic Period
    console.log('Creating Academic Period...');
    const period = await periodModel.create({
      code: '2024-1',
      name: 'First Semester 2024',
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-05-30'),
      isActive: true,
      allowChangeRequests: true,
      isEnrollmentOpen: true,
      description: 'First academic period of 2024'
    });

    // 3. Create Program
    console.log('Creating Program...');
    const program = await programModel.create({
      code: 'SYS-ENG',
      name: 'Systems Engineering',
      facultyId: faculty._id,
      totalSemesters: 10,
      totalCredits: 160,
      degree: 'Systems Engineer',
      description: 'Systems Engineering and Computer Science Program',
      isActive: true
    });

    // 4. Create Admin Users
    console.log('Creating Admin Users...');
    const adminUser1 = await userModel.create({
      email: 'daniel.useche-p@mail.com',
      displayName: 'Daniel Useche',
      firstName: 'Daniel',
      lastName: 'Useche',
      roles: ['ADMIN'],
      active: true,
      isGoogleUser: false,
      password: '$2b$10$2unRvDeHXQV6CNhTf/G1J.DRQRv0TAuBYgSqpRhgelv7HSuC6sD3W' // 123456789
    });

    const adminUser2 = await userModel.create({
      email: 'laura.venegas-p@mail.com',
      displayName: 'Laura Venegas',
      firstName: 'Laura',
      lastName: 'Venegas',
      roles: ['ADMIN'],
      active: true,
      isGoogleUser: false,
      password: '$2b$10$2unRvDeHXQV6CNhTf/G1J.DRQRv0TAuBYgSqpRhgelv7HSuC6sD3W' // 123456789
    });

    // 5. Create Test User (Student)
    console.log('Creating Test User...');
    const testUser = await userModel.create({
      email: 'juan.perez@estudiante.edu',
      displayName: 'Juan Perez',
      firstName: 'Juan',
      lastName: 'Perez',
      roles: ['STUDENT'],
      active: true,
      isGoogleUser: false,
      password: '$2b$10$ekh5F33YuNEQ46udXcb/QOTgkGDUWIBcahaQALXhKu3p0RpobIZdq'
    });

    // 6. Create Student
    console.log('Creating Student...');
    const student = await studentModel.create({
      code: 'SIS2024001',
      firstName: 'Juan',
      lastName: 'Perez',
      programId: program._id,
      currentSemester: 3
    });

    // 7. Create Courses
    console.log('Creating Courses...');
    const courses = await courseModel.insertMany([
      {
        code: 'MAT101',
        name: 'Differential Calculus',
        credits: 4
      },
      {
        code: 'PRG101',
        name: 'Programming I',
        credits: 4
      },
      {
        code: 'FIS101',
        name: 'Physics I',
        credits: 4
      },
      {
        code: 'MAT201',
        name: 'Integral Calculus',
        credits: 4
      },
      {
        code: 'PRG201',
        name: 'Programming II',
        credits: 4
      }
    ]);

    console.log('Creating Course Groups...');
    const courseGroups: CourseGroupDocument[] = [];

    // Create groups for each course
    for (const course of courses) {
      // Group A
      const groupA = await courseGroupModel.create({
        courseId: course._id,
        groupNumber: 'A',
        periodId: period._id,
        maxStudents: 25,
        currentEnrollments: 0,
        isActive: true,
        classroom: `LAB-${Math.floor(Math.random() * 10) + 1}`
      });

      // Group B
      const groupB = await courseGroupModel.create({
        courseId: course._id,
        groupNumber: 'B',
        periodId: period._id,
        maxStudents: 25,
        currentEnrollments: 0,
        isActive: true,
        classroom: `AUL-${Math.floor(Math.random() * 20) + 1}`
      });

      courseGroups.push(groupA, groupB);
    }

    // 8. Create Group Schedules
    console.log('Creating Group Schedules...');
    const schedules = [
      // Differential Calculus - Group A
      { groupId: courseGroups[0]._id, dayOfWeek: 1, startTime: '08:00', endTime: '10:00', room: 'LAB-1' },
      { groupId: courseGroups[0]._id, dayOfWeek: 3, startTime: '08:00', endTime: '10:00', room: 'LAB-1' },

      // Differential Calculus - Group B
      { groupId: courseGroups[1]._id, dayOfWeek: 2, startTime: '10:00', endTime: '12:00', room: 'AUL-1' },
      { groupId: courseGroups[1]._id, dayOfWeek: 4, startTime: '10:00', endTime: '12:00', room: 'AUL-1' },

      // Programming I - Group A
      { groupId: courseGroups[2]._id, dayOfWeek: 1, startTime: '14:00', endTime: '16:00', room: 'LAB-2' },
      { groupId: courseGroups[2]._id, dayOfWeek: 3, startTime: '14:00', endTime: '16:00', room: 'LAB-2' },

      // Programming I - Group B
      { groupId: courseGroups[3]._id, dayOfWeek: 2, startTime: '14:00', endTime: '16:00', room: 'LAB-3' },
      { groupId: courseGroups[3]._id, dayOfWeek: 4, startTime: '14:00', endTime: '16:00', room: 'LAB-3' },

      // Physics I - Group A (CONFLICT WITH PROGRAMMING I-A)
      { groupId: courseGroups[4]._id, dayOfWeek: 1, startTime: '15:00', endTime: '17:00', room: 'LAB-FIS' },
      { groupId: courseGroups[4]._id, dayOfWeek: 3, startTime: '15:00', endTime: '17:00', room: 'LAB-FIS' },

      // Physics I - Group B (NO CONFLICTS)
      { groupId: courseGroups[5]._id, dayOfWeek: 2, startTime: '08:00', endTime: '10:00', room: 'LAB-FIS' },
      { groupId: courseGroups[5]._id, dayOfWeek: 4, startTime: '08:00', endTime: '10:00', room: 'LAB-FIS' }
    ];

    await groupScheduleModel.insertMany(schedules);

    // 9. Create Student Enrollments (Current Semester)
    console.log('Creating Student Enrollments...');
    const enrollments = [
      {
        studentId: student._id,
        groupId: courseGroups[0]._id, // Differential Calculus - Group A
        enrolledAt: new Date(),
        status: EnrollmentStatus.ENROLLED
      },
      {
        studentId: student._id,
        groupId: courseGroups[2]._id, // Programming I - Group A
        enrolledAt: new Date(),
        status: EnrollmentStatus.ENROLLED
      }
    ];

    await enrollmentModel.insertMany(enrollments);

    // Update group enrollment counts
    await courseGroupModel.updateOne(
      { _id: courseGroups[0]._id },
      { $inc: { currentEnrollments: 1 } }
    );
    await courseGroupModel.updateOne(
      { _id: courseGroups[2]._id },
      { $inc: { currentEnrollments: 1 } }
    );

    // 10. Create Historical Enrollments (Previous Semesters)
    console.log('Creating Historical Enrollments...');
    const historicalEnrollments = [
      {
        studentId: student._id,
        groupId: courseGroups[6]._id, // Some previous course
        enrolledAt: new Date('2023-08-01'),
        status: EnrollmentStatus.PASSED,
        grade: 4.2
      },
      {
        studentId: student._id,
        groupId: courseGroups[8]._id, // Some failed course
        enrolledAt: new Date('2023-08-01'),
        status: EnrollmentStatus.FAILED,
        grade: 2.1
      }
    ];

    await enrollmentModel.insertMany(historicalEnrollments);

    console.log('Test data seeded successfully!');
    console.log('\nTEST DATA SUMMARY:');
    console.log('\nADMIN USERS:');
    console.log('Admin 1: daniel.useche-p@mail.com (password: 123456789)');
    console.log('Admin 2: laura.venegas-p@mail.com (password: 123456789)');
    console.log('\nSTUDENT USER:');
    console.log('Test User: juan.perez@estudiante.edu');
    console.log('Student Code: SIS2024001');
    console.log('\nACADEMIC DATA:');
    console.log('Faculty: Faculty of Engineering');
    console.log('Program: Systems Engineering');
    console.log('Period: 2024-1 (Active)');
    console.log('Courses: 5 courses with 2 groups each');
    console.log('Current Enrollments: 2 courses');
    console.log('Historical: 1 passed, 1 failed');
    console.log('\nReady for testing!');

    return {
      faculty,
      program,
      period,
      courses,
      courseGroups,
      student,
      testUser,
      adminUser1,
      adminUser2,
      enrollments
    };

  } catch (error) {
    console.error('Error seeding test data:', error);
    throw error;
  } finally {
    await app.close();
  }
}

// Run if called directly
if (require.main === module) {
  seedTestData()
    .then(() => {
      console.log('Seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}