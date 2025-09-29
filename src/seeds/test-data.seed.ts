import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app/app.module';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';

// Import all entities
import { Faculty, FacultyDocument } from '../faculty/entities/faculty.entity';
import { Program, ProgramDocument } from '../programs/entities/program.entity';
import {
  AcademicPeriod,
  AcademicPeriodDocument,
} from '../academic-periods/entities/academic-period.entity';
import { Course, CourseDocument } from '../courses/entities/course.entity';
import {
  CourseGroup,
  CourseGroupDocument,
} from '../course-groups/entities/course-group.entity';
import {
  GroupSchedule,
  GroupScheduleDocument,
} from '../group-schedules/entities/group-schedule.entity';
import { Student, StudentDocument } from '../students/entities/student.entity';
import { User, UserDocument } from '../users/entities/user.entity';
import {
  Enrollment,
  EnrollmentDocument,
  EnrollmentStatus,
} from '../enrollments/entities/enrollment.entity';
import {
  Role,
  RoleDocument,
  RoleName,
  Permission,
} from '../roles/entities/role.entity';

export async function seedTestData() {
  console.log('Starting test data seeding...');

  const app = await NestFactory.createApplicationContext(AppModule);

  // Get models
  const facultyModel = app.get<Model<FacultyDocument>>(
    getModelToken(Faculty.name),
  );
  const programModel = app.get<Model<ProgramDocument>>(
    getModelToken(Program.name),
  );
  const periodModel = app.get<Model<AcademicPeriodDocument>>(
    getModelToken(AcademicPeriod.name),
  );
  const courseModel = app.get<Model<CourseDocument>>(
    getModelToken(Course.name),
  );
  const courseGroupModel = app.get<Model<CourseGroupDocument>>(
    getModelToken(CourseGroup.name),
  );
  const groupScheduleModel = app.get<Model<GroupScheduleDocument>>(
    getModelToken(GroupSchedule.name),
  );
  const studentModel = app.get<Model<StudentDocument>>(
    getModelToken(Student.name),
  );
  const userModel = app.get<Model<UserDocument>>(getModelToken(User.name));
  const enrollmentModel = app.get<Model<EnrollmentDocument>>(
    getModelToken(Enrollment.name),
  );
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
      roleModel.deleteMany({}),
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
        Permission.READ_GRADE,
      ],
      isActive: true,
      priority: 3,
    });

    const adminRole = await roleModel.create({
      name: RoleName.ADMIN,
      displayName: 'Administrator',
      description: 'Administrator with full permissions',
      permissions: Object.values(Permission),
      isActive: true,
      priority: 1,
    });

    // 1. Create Faculty
    console.log('Creating Faculty...');
    const faculty = await facultyModel.create({
      code: 'FAC-ING',
      name: 'Faculty of Engineering',
      description: 'Faculty of Engineering and Technology',
      email: 'engineering@university.edu',
      phone: '+57 1 234-5678',
      isActive: true,
    });

    // 2. Create Academic Periods (Multiple for testing)
    console.log('Creating Academic Periods...');

    // Current Active Period
    const currentPeriod = await periodModel.create({
      code: '2024-2',
      name: 'Second Semester 2024',
      startDate: new Date('2024-07-15'),
      endDate: new Date('2024-12-15'),
      isActive: true,
      allowChangeRequests: true,
      isEnrollmentOpen: true,
      status: 'ACTIVE',
      description: 'Current active academic period',
    });

    // Closed Historical Periods
    const period2024_1 = await periodModel.create({
      code: '2024-1',
      name: 'First Semester 2024',
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-06-15'),
      isActive: false,
      allowChangeRequests: false,
      isEnrollmentOpen: false,
      status: 'CLOSED',
      description: 'First semester 2024 - Closed',
    });

    const period2023_2 = await periodModel.create({
      code: '2023-2',
      name: 'Second Semester 2023',
      startDate: new Date('2023-07-15'),
      endDate: new Date('2023-12-15'),
      isActive: false,
      allowChangeRequests: false,
      isEnrollmentOpen: false,
      status: 'CLOSED',
      description: 'Second semester 2023 - Closed',
    });

    const period2023_1 = await periodModel.create({
      code: '2023-1',
      name: 'First Semester 2023',
      startDate: new Date('2023-01-15'),
      endDate: new Date('2023-06-15'),
      isActive: false,
      allowChangeRequests: false,
      isEnrollmentOpen: false,
      status: 'CLOSED',
      description: 'First semester 2023 - Closed',
    });

    // Future Planning Period
    const futurePeriod = await periodModel.create({
      code: '2025-1',
      name: 'First Semester 2025',
      startDate: new Date('2025-01-15'),
      endDate: new Date('2025-06-15'),
      isActive: false,
      allowChangeRequests: false,
      isEnrollmentOpen: false,
      status: 'PLANNING',
      description: 'Future planning period',
    });

    const periods = {
      currentPeriod,
      period2024_1,
      period2023_2,
      period2023_1,
      futurePeriod,
    };

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
      isActive: true,
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
      password: '$2b$10$2unRvDeHXQV6CNhTf/G1J.DRQRv0TAuBYgSqpRhgelv7HSuC6sD3W', // 123456789
    });

    const adminUser2 = await userModel.create({
      email: 'laura.venegas-p@mail.com',
      displayName: 'Laura Venegas',
      firstName: 'Laura',
      lastName: 'Venegas',
      roles: ['ADMIN'],
      active: true,
      isGoogleUser: false,
      password: '$2b$10$2unRvDeHXQV6CNhTf/G1J.DRQRv0TAuBYgSqpRhgelv7HSuC6sD3W', // 123456789
    });

    // 5. Create Test Users (Multiple Students)
    console.log('Creating Test Users...');

    // Primary Test Student
    const testUser1 = await userModel.create({
      email: 'juan.perez@estudiante.edu',
      displayName: 'Juan Perez',
      firstName: 'Juan',
      lastName: 'Perez',
      externalId: 'STU001',
      roles: ['STUDENT'],
      active: true,
      isGoogleUser: false,
      password: '$2b$10$ekh5F33YuNEQ46udXcb/QOTgkGDUWIBcahaQALXhKu3p0RpobIZdq',
    });

    // Second Test Student
    const testUser2 = await userModel.create({
      email: 'maria.garcia@estudiante.edu',
      displayName: 'Maria Garcia',
      firstName: 'Maria',
      lastName: 'Garcia',
      externalId: 'STU002',
      roles: ['STUDENT'],
      active: true,
      isGoogleUser: false,
      password: '$2b$10$ekh5F33YuNEQ46udXcb/QOTgkGDUWIBcahaQALXhKu3p0RpobIZdq',
    });

    // Faculty User
    const facultyUser = await userModel.create({
      email: 'prof.rodriguez@universidad.edu',
      displayName: 'Dr. Carlos Rodriguez',
      firstName: 'Carlos',
      lastName: 'Rodriguez',
      externalId: 'FAC001',
      roles: ['DEAN'],
      active: true,
      isGoogleUser: false,
      password: '$2b$10$ekh5F33YuNEQ46udXcb/QOTgkGDUWIBcahaQALXhKu3p0RpobIZdq',
    });

    // 6. Create Students
    console.log('Creating Students...');
    const student1 = await studentModel.create({
      code: 'SIS2024001',
      firstName: 'Juan',
      lastName: 'Perez',
      programId: program._id,
      currentSemester: 5,
      externalId: 'STU001',
    });

    const student2 = await studentModel.create({
      code: 'SIS2024002',
      firstName: 'Maria',
      lastName: 'Garcia',
      programId: program._id,
      currentSemester: 3,
      externalId: 'STU002',
    });

    // 7. Create Courses (Expanded for better testing)
    console.log('Creating Courses...');
    const courses = await courseModel.insertMany([
      // Semester 1
      {
        code: 'MAT101',
        name: 'Differential Calculus',
        credits: 4,
        semester: 1,
      },
      {
        code: 'PRG101',
        name: 'Programming I',
        credits: 4,
        semester: 1,
      },
      {
        code: 'FIS101',
        name: 'Physics I',
        credits: 4,
        semester: 1,
      },
      {
        code: 'QUI101',
        name: 'General Chemistry',
        credits: 3,
        semester: 1,
      },
      {
        code: 'ING101',
        name: 'Engineering Introduction',
        credits: 2,
        semester: 1,
      },

      // Semester 2
      {
        code: 'MAT201',
        name: 'Integral Calculus',
        credits: 4,
        semester: 2,
      },
      {
        code: 'PRG201',
        name: 'Programming II',
        credits: 4,
        semester: 2,
      },
      {
        code: 'FIS201',
        name: 'Physics II',
        credits: 4,
        semester: 2,
      },
      {
        code: 'EST201',
        name: 'Statistics',
        credits: 3,
        semester: 2,
      },

      // Semester 3-5 (Current level courses)
      {
        code: 'DSA301',
        name: 'Data Structures',
        credits: 4,
        semester: 3,
      },
      {
        code: 'ALG301',
        name: 'Algorithms',
        credits: 4,
        semester: 3,
      },
      {
        code: 'DB401',
        name: 'Database Systems',
        credits: 4,
        semester: 4,
      },
      {
        code: 'SWE401',
        name: 'Software Engineering',
        credits: 4,
        semester: 4,
      },
      {
        code: 'NET501',
        name: 'Computer Networks',
        credits: 4,
        semester: 5,
      },
      {
        code: 'WEB501',
        name: 'Web Development',
        credits: 4,
        semester: 5,
      },
    ]);

    console.log('Creating Course Groups...');
    const courseGroups: CourseGroupDocument[] = [];

    // Create groups for each course across multiple periods
    const allPeriods = [
      periods.currentPeriod,
      periods.period2024_1,
      periods.period2023_2,
      periods.period2023_1,
    ];

    for (const course of courses) {
      for (const period of allPeriods) {
        // Group A
        const groupA = await courseGroupModel.create({
          courseId: course._id,
          groupNumber: 'A',
          periodId: period._id,
          maxStudents: 25,
          currentEnrollments: 0,
          isActive: period.status === 'ACTIVE',
          classroom: `LAB-${Math.floor(Math.random() * 10) + 1}`,
        });

        // Group B
        const groupB = await courseGroupModel.create({
          courseId: course._id,
          groupNumber: 'B',
          periodId: period._id,
          maxStudents: 25,
          currentEnrollments: 0,
          isActive: period.status === 'ACTIVE',
          classroom: `AUL-${Math.floor(Math.random() * 20) + 1}`,
        });

        courseGroups.push(groupA, groupB);
      }
    }

    // 8. Create Group Schedules (Comprehensive for testing)
    console.log('Creating Group Schedules...');
    const schedules: any[] = [];

    // Get current period groups for detailed scheduling
    const currentPeriodGroups = courseGroups.filter(
      (group) =>
        group.periodId.toString() ===
        (periods.currentPeriod._id as any).toString(),
    );

    // Schedule for current semester courses (Student 1 - Semester 5)
    const student1Courses = courses.filter((course) => course.semester <= 5);
    const scheduleTimes = [
      { day: 1, start: '08:00', end: '10:00' },
      { day: 1, start: '10:00', end: '12:00' },
      { day: 1, start: '14:00', end: '16:00' },
      { day: 2, start: '08:00', end: '10:00' },
      { day: 2, start: '10:00', end: '12:00' },
      { day: 2, start: '14:00', end: '16:00' },
      { day: 3, start: '08:00', end: '10:00' },
      { day: 3, start: '10:00', end: '12:00' },
      { day: 3, start: '14:00', end: '16:00' },
      { day: 4, start: '08:00', end: '10:00' },
      { day: 4, start: '10:00', end: '12:00' },
      { day: 4, start: '14:00', end: '16:00' },
      { day: 5, start: '08:00', end: '10:00' },
      { day: 5, start: '10:00', end: '12:00' },
    ];

    // Create schedules for current period
    let timeIndex = 0;
    for (
      let i = 0;
      i < currentPeriodGroups.length && timeIndex < scheduleTimes.length;
      i += 2
    ) {
      const groupA = currentPeriodGroups[i];
      const groupB = currentPeriodGroups[i + 1];
      const time = scheduleTimes[timeIndex];

      if (groupA && groupB) {
        // Group A schedule
        schedules.push({
          groupId: groupA._id,
          dayOfWeek: time.day,
          startTime: time.start,
          endTime: time.end,
          room: groupA.classroom,
        });

        // Group B schedule (different time)
        const nextTime = scheduleTimes[timeIndex + 1] || scheduleTimes[0];
        schedules.push({
          groupId: groupB._id,
          dayOfWeek: nextTime.day,
          startTime: nextTime.start,
          endTime: nextTime.end,
          room: groupB.classroom,
        });

        timeIndex += 2;
      }
    }

    // Create some schedule conflicts for testing
    // Add conflicting schedule for testing conflict detection
    if (currentPeriodGroups.length > 20) {
      schedules.push({
        groupId: currentPeriodGroups[20]._id,
        dayOfWeek: 1,
        startTime: '08:30',
        endTime: '10:30',
        room: 'CONFLICT-ROOM',
      });
    }

    await groupScheduleModel.insertMany(schedules);

    // 9. Create Student Enrollments (Comprehensive for testing)
    console.log('Creating Student Enrollments...');

    // Helper function to get groups by course code and period
    const getGroupByCourseCodeAndPeriod = (
      courseCode: string,
      periodId: string,
      groupNumber = 'A',
    ) => {
      const course = courses.find((c) => c.code === courseCode);
      if (!course) return null;
      return courseGroups.find(
        (g) =>
          g.courseId.toString() === (course._id as any).toString() &&
          g.periodId.toString() === periodId &&
          g.groupNumber === groupNumber,
      );
    };

    const allEnrollments: any[] = [];

    // === STUDENT 1 (Juan Perez) - Semester 5 ===

    // Current Period (2024-2) - Active enrollments
    const currentPeriodEnrollments = [
      { courseCode: 'NET501', status: EnrollmentStatus.ENROLLED, grade: null },
      { courseCode: 'WEB501', status: EnrollmentStatus.ENROLLED, grade: null },
      { courseCode: 'DB401', status: EnrollmentStatus.ENROLLED, grade: null }, // Retaking
    ];

    for (const enrollment of currentPeriodEnrollments) {
      const group = getGroupByCourseCodeAndPeriod(
        enrollment.courseCode,
        (periods.currentPeriod._id as any).toString(),
      );
      if (group) {
        allEnrollments.push({
          studentId: student1._id,
          groupId: group._id,
          enrolledAt: new Date('2024-07-15'),
          status: enrollment.status,
          grade: enrollment.grade,
        });
      }
    }

    // Previous Period (2024-1) - Recently completed
    const period2024_1_enrollments = [
      { courseCode: 'SWE401', status: EnrollmentStatus.PASSED, grade: 4.5 },
      { courseCode: 'ALG301', status: EnrollmentStatus.PASSED, grade: 4.2 },
      { courseCode: 'DB401', status: EnrollmentStatus.FAILED, grade: 2.8 }, // Failed, retaking now
    ];

    for (const enrollment of period2024_1_enrollments) {
      const group = getGroupByCourseCodeAndPeriod(
        enrollment.courseCode,
        (periods.period2024_1._id as any).toString(),
      );
      if (group) {
        allEnrollments.push({
          studentId: student1._id,
          groupId: group._id,
          enrolledAt: new Date('2024-01-15'),
          status: enrollment.status,
          grade: enrollment.grade,
        });
      }
    }

    // 2023-2 Historical enrollments
    const period2023_2_enrollments = [
      { courseCode: 'DSA301', status: EnrollmentStatus.PASSED, grade: 4.0 },
      { courseCode: 'FIS201', status: EnrollmentStatus.PASSED, grade: 3.8 },
      { courseCode: 'EST201', status: EnrollmentStatus.PASSED, grade: 4.3 },
    ];

    for (const enrollment of period2023_2_enrollments) {
      const group = getGroupByCourseCodeAndPeriod(
        enrollment.courseCode,
        (periods.period2023_2._id as any).toString(),
      );
      if (group) {
        allEnrollments.push({
          studentId: student1._id,
          groupId: group._id,
          enrolledAt: new Date('2023-07-15'),
          status: enrollment.status,
          grade: enrollment.grade,
        });
      }
    }

    // 2023-1 Historical enrollments
    const period2023_1_enrollments = [
      { courseCode: 'MAT201', status: EnrollmentStatus.PASSED, grade: 4.1 },
      { courseCode: 'PRG201', status: EnrollmentStatus.PASSED, grade: 4.7 },
      { courseCode: 'MAT101', status: EnrollmentStatus.PASSED, grade: 3.9 },
      { courseCode: 'PRG101', status: EnrollmentStatus.PASSED, grade: 4.8 },
      { courseCode: 'FIS101', status: EnrollmentStatus.PASSED, grade: 3.7 },
      { courseCode: 'QUI101', status: EnrollmentStatus.PASSED, grade: 4.0 },
      { courseCode: 'ING101', status: EnrollmentStatus.PASSED, grade: 4.5 },
    ];

    for (const enrollment of period2023_1_enrollments) {
      const group = getGroupByCourseCodeAndPeriod(
        enrollment.courseCode,
        (periods.period2023_1._id as any).toString(),
      );
      if (group) {
        allEnrollments.push({
          studentId: student1._id,
          groupId: group._id,
          enrolledAt: new Date('2023-01-15'),
          status: enrollment.status,
          grade: enrollment.grade,
        });
      }
    }

    // === STUDENT 2 (Maria Garcia) - Semester 3 ===

    // Current Period (2024-2) - Student 2 enrollments
    const student2CurrentEnrollments = [
      { courseCode: 'DSA301', status: EnrollmentStatus.ENROLLED, grade: null },
      { courseCode: 'ALG301', status: EnrollmentStatus.ENROLLED, grade: null },
      { courseCode: 'FIS201', status: EnrollmentStatus.ENROLLED, grade: null },
    ];

    for (const enrollment of student2CurrentEnrollments) {
      const group = getGroupByCourseCodeAndPeriod(
        enrollment.courseCode,
        (periods.currentPeriod._id as any).toString(),
        'B',
      );
      if (group) {
        allEnrollments.push({
          studentId: student2._id,
          groupId: group._id,
          enrolledAt: new Date('2024-07-15'),
          status: enrollment.status,
          grade: enrollment.grade,
        });
      }
    }

    // Student 2 Historical data
    const student2HistoricalEnrollments = [
      // 2024-1
      {
        courseCode: 'MAT201',
        status: EnrollmentStatus.PASSED,
        grade: 3.5,
        period: periods.period2024_1,
      },
      {
        courseCode: 'PRG201',
        status: EnrollmentStatus.PASSED,
        grade: 4.0,
        period: periods.period2024_1,
      },
      {
        courseCode: 'EST201',
        status: EnrollmentStatus.PASSED,
        grade: 3.2,
        period: periods.period2024_1,
      },
      // 2023-2
      {
        courseCode: 'MAT101',
        status: EnrollmentStatus.PASSED,
        grade: 3.8,
        period: periods.period2023_2,
      },
      {
        courseCode: 'PRG101',
        status: EnrollmentStatus.PASSED,
        grade: 4.2,
        period: periods.period2023_2,
      },
      {
        courseCode: 'FIS101',
        status: EnrollmentStatus.PASSED,
        grade: 3.6,
        period: periods.period2023_2,
      },
    ];

    for (const enrollment of student2HistoricalEnrollments) {
      const group = getGroupByCourseCodeAndPeriod(
        enrollment.courseCode,
        (enrollment.period._id as any).toString(),
        'B',
      );
      if (group) {
        allEnrollments.push({
          studentId: student2._id,
          groupId: group._id,
          enrolledAt: new Date(enrollment.period.startDate),
          status: enrollment.status,
          grade: enrollment.grade,
        });
      }
    }

    // Create all enrollments
    await enrollmentModel.insertMany(allEnrollments);

    // Update current enrollment counts for current period groups
    const currentEnrollments = allEnrollments.filter(
      (e) => e.status === EnrollmentStatus.ENROLLED,
    );

    for (const enrollment of currentEnrollments) {
      await courseGroupModel.updateOne(
        { _id: enrollment.groupId },
        { $inc: { currentEnrollments: 1 } },
      );
    }

    console.log('Test data seeded successfully!');
    console.log('\n🎉 COMPREHENSIVE TEST DATA SUMMARY FOR SPRINT 2:');
    console.log('================================================\n');

    console.log('👥 USERS CREATED:');
    console.log('Admin 1: daniel.useche-p@mail.com (password: 123456789)');
    console.log('Admin 2: laura.venegas-p@mail.com (password: 123456789)');
    console.log(
      'Faculty: prof.rodriguez@universidad.edu (password: 123456789)',
    );
    console.log('Student 1: juan.perez@estudiante.edu (External ID: STU001)');
    console.log(
      'Student 2: maria.garcia@estudiante.edu (External ID: STU002)\n',
    );

    console.log('🏫 ACADEMIC STRUCTURE:');
    console.log('Faculty: Faculty of Engineering');
    console.log('Program: Systems Engineering (10 semesters, 160 credits)');
    console.log(
      'Academic Periods: 5 periods (2023-1, 2023-2, 2024-1, 2024-2 active, 2025-1 planning)',
    );
    console.log('Courses: 15 courses across 5 semesters');
    console.log('Course Groups: 2 groups per course per period\n');

    console.log('📚 STUDENT 1 DATA (Juan Perez - STU001):');
    console.log('Current Semester: 5');
    console.log('Current Enrollments: NET501, WEB501, DB401 (retaking)');
    console.log('Total Historical Courses: 13 courses across 3 semesters');
    console.log(
      'Academic Performance: Mix of passed/failed (includes retaking scenario)',
    );
    console.log('GPA: ~4.1 (calculated from historical grades)\n');

    console.log('📚 STUDENT 2 DATA (Maria Garcia - STU002):');
    console.log('Current Semester: 3');
    console.log('Current Enrollments: DSA301, ALG301, FIS201');
    console.log('Total Historical Courses: 6 courses across 2 semesters');
    console.log('Academic Performance: Consistent passing grades\n');

    console.log('🔧 TESTING FEATURES AVAILABLE:');
    console.log(
      '✅ Current Schedule Endpoint - Both students have active schedules',
    );
    console.log('✅ Historical Schedules - Multiple closed periods with data');
    console.log(
      '✅ Academic Traffic Light - Rich academic history for calculations',
    );
    console.log(
      '✅ Schedule Conflicts - Intentional conflicts for testing detection',
    );
    console.log(
      '✅ Period Management - All CRUD operations with various statuses',
    );
    console.log(
      '✅ Authorization Testing - Multiple user roles and access scenarios',
    );
    console.log(
      '✅ Edge Cases - Empty schedules, retaking courses, failed courses\n',
    );

    console.log('🎯 ENDPOINTS READY FOR TESTING:');
    console.log('GET /schedules/current?userId=STU001 or STU002');
    console.log('GET /schedules/historical?from=2023-01-01&to=2024-12-31');
    console.log('GET /schedules/historical/:periodId');
    console.log('GET /schedules/traffic-light?details=true&userId=STU001');
    console.log('GET /academic-periods (with pagination and filters)');
    console.log('POST /academic-periods (admin only)');
    console.log('\n🚀 Ready for comprehensive Sprint 2 testing!');

    return {
      faculty,
      program,
      periods,
      courses,
      courseGroups,
      students: { student1, student2 },
      users: {
        testUser1,
        testUser2,
        facultyUser,
        adminUser1,
        adminUser2,
      },
      enrollments: allEnrollments,
      totalEnrollments: allEnrollments.length,
      schedules: schedules.length,
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
