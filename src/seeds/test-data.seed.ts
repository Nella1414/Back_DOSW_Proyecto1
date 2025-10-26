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

    const studentUsers = [
      {
        email: 'juan.perez@estudiante.edu',
        displayName: 'Juan Perez',
        firstName: 'Juan',
        lastName: 'Perez',
        externalId: 'STU001',
      },
      {
        email: 'maria.garcia@estudiante.edu',
        displayName: 'Maria Garcia',
        firstName: 'Maria',
        lastName: 'Garcia',
        externalId: 'STU002',
      },
      {
        email: 'carlos.lopez@estudiante.edu',
        displayName: 'Carlos Lopez',
        firstName: 'Carlos',
        lastName: 'Lopez',
        externalId: 'STU003',
      },
      {
        email: 'ana.martinez@estudiante.edu',
        displayName: 'Ana Martinez',
        firstName: 'Ana',
        lastName: 'Martinez',
        externalId: 'STU004',
      },
      {
        email: 'luis.rodriguez@estudiante.edu',
        displayName: 'Luis Rodriguez',
        firstName: 'Luis',
        lastName: 'Rodriguez',
        externalId: 'STU005',
      },
    ];

    const testUsers: UserDocument[] = [];
    for (const userData of studentUsers) {
      const user = await userModel.create({
        ...userData,
        roles: ['STUDENT'],
        active: true,
        isGoogleUser: false,
        password:
          '$2b$10$ekh5F33YuNEQ46udXcb/QOTgkGDUWIBcahaQALXhKu3p0RpobIZdq',
      });
      testUsers.push(user);
    }

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
    const students: StudentDocument[] = [];

    // Define semester per student to match their enrollment history
    const semesterPerStudent = [4, 2, 3, 4, 5]; // Juan=4, Maria=2, Carlos=3, Ana=4, Luis=5

    for (let i = 0; i < studentUsers.length; i++) {
      const studentData = studentUsers[i];
      const student = await studentModel.create({
        code: `SIS202400${i + 1}`,
        firstName: studentData.firstName,
        lastName: studentData.lastName,
        programId: program._id,
        currentSemester: semesterPerStudent[i] || 1,
        externalId: studentData.externalId,
      });
      students.push(student);
    }

    const student1 = students[0];
    const student2 = students[1];

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

    // Helper to create schedules for ALL periods (not just current)
    // This ensures historical data has proper schedules too
    const getAllGroupsByPeriod = (periodId: any) => {
      return courseGroups.filter(
        (group) => group.periodId.toString() === periodId.toString(),
      );
    };

    // Create comprehensive schedules for all courses - ensuring NO conflicts
    const priorityCourseSchedules = [
      // Semester 1 courses
      {
        code: 'MAT101',
        group: 'A',
        schedules: [
          { day: 1, start: '08:00', end: '10:00', room: 'ROOM-101' },
          { day: 3, start: '08:00', end: '10:00', room: 'ROOM-101' },
        ],
      },
      {
        code: 'PRG101',
        group: 'A',
        schedules: [
          { day: 2, start: '08:00', end: '10:00', room: 'LAB-101' },
          { day: 4, start: '08:00', end: '10:00', room: 'LAB-101' },
        ],
      },
      {
        code: 'FIS101',
        group: 'A',
        schedules: [
          { day: 1, start: '10:00', end: '12:00', room: 'LAB-102' },
          { day: 3, start: '10:00', end: '12:00', room: 'LAB-102' },
        ],
      },
      {
        code: 'QUI101',
        group: 'A',
        schedules: [
          { day: 2, start: '10:00', end: '12:00', room: 'LAB-103' },
          { day: 4, start: '10:00', end: '12:00', room: 'LAB-103' },
        ],
      },
      {
        code: 'ING101',
        group: 'A',
        schedules: [{ day: 5, start: '08:00', end: '10:00', room: 'AUD-101' }],
      },

      // Semester 2 courses
      {
        code: 'MAT201',
        group: 'A',
        schedules: [
          { day: 1, start: '14:00', end: '16:00', room: 'ROOM-201' },
          { day: 3, start: '14:00', end: '16:00', room: 'ROOM-201' },
        ],
      },
      {
        code: 'PRG201',
        group: 'A',
        schedules: [
          { day: 2, start: '14:00', end: '16:00', room: 'LAB-201' },
          { day: 4, start: '14:00', end: '16:00', room: 'LAB-201' },
        ],
      },
      {
        code: 'FIS201',
        group: 'A',
        schedules: [
          { day: 1, start: '16:00', end: '18:00', room: 'LAB-202' },
          { day: 3, start: '16:00', end: '18:00', room: 'LAB-202' },
        ],
      },
      {
        code: 'EST201',
        group: 'A',
        schedules: [
          { day: 2, start: '16:00', end: '18:00', room: 'ROOM-202' },
          { day: 4, start: '16:00', end: '18:00', room: 'ROOM-202' },
        ],
      },

      // Semester 3 courses - Group A
      {
        code: 'DSA301',
        group: 'A',
        schedules: [
          { day: 1, start: '08:00', end: '10:00', room: 'LAB-301' },
          { day: 3, start: '08:00', end: '10:00', room: 'LAB-301' },
        ],
      },
      {
        code: 'ALG301',
        group: 'A',
        schedules: [
          { day: 2, start: '08:00', end: '10:00', room: 'ROOM-301' },
          { day: 4, start: '08:00', end: '10:00', room: 'ROOM-301' },
        ],
      },

      // Semester 3 courses - Group B (different times for variety)
      {
        code: 'DSA301',
        group: 'B',
        schedules: [
          { day: 2, start: '10:00', end: '12:00', room: 'LAB-303' },
          { day: 4, start: '10:00', end: '12:00', room: 'LAB-303' },
        ],
      },
      {
        code: 'ALG301',
        group: 'B',
        schedules: [
          { day: 1, start: '14:00', end: '16:00', room: 'ROOM-303' },
          { day: 3, start: '14:00', end: '16:00', room: 'ROOM-303' },
        ],
      },

      // Semester 4 courses
      {
        code: 'DB401',
        group: 'A',
        schedules: [
          { day: 1, start: '10:00', end: '12:00', room: 'LAB-401' },
          { day: 3, start: '10:00', end: '12:00', room: 'LAB-401' },
        ],
      },
      {
        code: 'SWE401',
        group: 'A',
        schedules: [
          { day: 2, start: '10:00', end: '12:00', room: 'ROOM-401' },
          { day: 4, start: '10:00', end: '12:00', room: 'ROOM-401' },
        ],
      },

      // Semester 5 courses
      {
        code: 'NET501',
        group: 'A',
        schedules: [
          { day: 1, start: '14:00', end: '16:00', room: 'LAB-501' },
          { day: 3, start: '14:00', end: '16:00', room: 'LAB-501' },
        ],
      },
      {
        code: 'WEB501',
        group: 'A',
        schedules: [
          { day: 2, start: '14:00', end: '16:00', room: 'LAB-502' },
          { day: 4, start: '14:00', end: '16:00', room: 'LAB-502' },
        ],
      },
    ];

    // Helper to find group by course code, group number AND period
    const findGroupByCourseAndPeriod = (
      courseCode: string,
      groupNumber: string,
      periodId: any,
    ) => {
      const groupsInPeriod = getAllGroupsByPeriod(periodId);
      return groupsInPeriod.find((g) => {
        const course = courses.find(
          (c) => (c._id as any).toString() === (g.courseId as any).toString(),
        );
        return course?.code === courseCode && g.groupNumber === groupNumber;
      });
    };

    // Create schedules for ALL periods with the same structure
    // This ensures consistency across historical and current data
    for (const period of allPeriods) {
      for (const courseSchedule of priorityCourseSchedules) {
        const group = findGroupByCourseAndPeriod(
          courseSchedule.code,
          courseSchedule.group,
          period._id,
        );
        if (group) {
          for (const schedule of courseSchedule.schedules) {
            schedules.push({
              groupId: group._id,
              dayOfWeek: schedule.day,
              startTime: schedule.start,
              endTime: schedule.end,
              room: schedule.room,
            });
          }
        }
      }
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

    // === STUDENT 1 (Juan Perez - STU001) - Semester 4 (Advanced Student) ===
    // Currently enrolled in semester 4 courses
    const student1CurrentEnrollments = [
      { courseCode: 'DB401', status: EnrollmentStatus.ENROLLED, grade: null },
      { courseCode: 'SWE401', status: EnrollmentStatus.ENROLLED, grade: null },
    ];

    for (const enrollment of student1CurrentEnrollments) {
      const group = getGroupByCourseCodeAndPeriod(
        enrollment.courseCode,
        (periods.currentPeriod._id as any).toString(),
        'A',
      );
      if (group) {
        allEnrollments.push({
          studentId: students[0]._id,
          groupId: group._id,
          enrolledAt: new Date('2024-07-15'),
          status: enrollment.status,
          grade: enrollment.grade,
        });
      }
    }

    // Period 2024-1 - Semester 3 courses (passed)
    const student1_2024_1 = [
      { courseCode: 'DSA301', status: EnrollmentStatus.PASSED, grade: 4.2 },
      { courseCode: 'ALG301', status: EnrollmentStatus.PASSED, grade: 4.5 },
    ];

    for (const enrollment of student1_2024_1) {
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

    // Period 2023-2 - Semester 2 courses (passed)
    const student1_2023_2 = [
      { courseCode: 'MAT201', status: EnrollmentStatus.PASSED, grade: 4.1 },
      { courseCode: 'PRG201', status: EnrollmentStatus.PASSED, grade: 4.7 },
      { courseCode: 'FIS201', status: EnrollmentStatus.PASSED, grade: 3.8 },
      { courseCode: 'EST201', status: EnrollmentStatus.PASSED, grade: 4.3 },
    ];

    for (const enrollment of student1_2023_2) {
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

    // Period 2023-1 - Semester 1 courses (all passed)
    const student1_2023_1 = [
      { courseCode: 'MAT101', status: EnrollmentStatus.PASSED, grade: 3.9 },
      { courseCode: 'PRG101', status: EnrollmentStatus.PASSED, grade: 4.8 },
      { courseCode: 'FIS101', status: EnrollmentStatus.PASSED, grade: 3.7 },
      { courseCode: 'QUI101', status: EnrollmentStatus.PASSED, grade: 4.0 },
      { courseCode: 'ING101', status: EnrollmentStatus.PASSED, grade: 4.5 },
    ];

    for (const enrollment of student1_2023_1) {
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

    // Add some FAILED courses to illustrate failed courses in UI
    // Using courses from semester 5 that student hasn't taken yet
    const student1_failed_courses = [
      {
        courseCode: 'NET501',
        status: EnrollmentStatus.FAILED,
        grade: 2.3,
        period: periods.period2024_1._id,
      },
    ];

    for (const enrollment of student1_failed_courses) {
      const group = getGroupByCourseCodeAndPeriod(
        enrollment.courseCode,
        (enrollment.period as any).toString(),
        'B',
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

    // === STUDENT 2 (Maria Garcia - STU002) - Semester 2 ===
    // Current semester 2 courses (enrolled)
    const student2CurrentEnrollments = [
      { courseCode: 'MAT201', status: EnrollmentStatus.ENROLLED, grade: null },
      { courseCode: 'PRG201', status: EnrollmentStatus.ENROLLED, grade: null },
      { courseCode: 'FIS201', status: EnrollmentStatus.ENROLLED, grade: null },
      { courseCode: 'EST201', status: EnrollmentStatus.ENROLLED, grade: null },
    ];

    for (const enrollment of student2CurrentEnrollments) {
      const group = getGroupByCourseCodeAndPeriod(
        enrollment.courseCode,
        (periods.currentPeriod._id as any).toString(),
        'A',
      );
      if (group) {
        allEnrollments.push({
          studentId: students[1]._id,
          groupId: group._id,
          enrolledAt: new Date('2024-07-15'),
          status: enrollment.status,
          grade: enrollment.grade,
        });
      }
    }

    // Period 2024-1 - Semester 1 courses (mostly passed, one failed)
    const student2_2024_1 = [
      { courseCode: 'MAT101', status: EnrollmentStatus.PASSED, grade: 4.0 },
      { courseCode: 'PRG101', status: EnrollmentStatus.PASSED, grade: 2.1 },
      { courseCode: 'FIS101', status: EnrollmentStatus.PASSED, grade: 3.8 },
      { courseCode: 'QUI101', status: EnrollmentStatus.PASSED, grade: 3.9 },
      { courseCode: 'ING101', status: EnrollmentStatus.PASSED, grade: 4.2 },
    ];

    for (const enrollment of student2_2024_1) {
      const group = getGroupByCourseCodeAndPeriod(
        enrollment.courseCode,
        (periods.period2024_1._id as any).toString(),
      );
      if (group) {
        allEnrollments.push({
          studentId: students[1]._id,
          groupId: group._id,
          enrolledAt: new Date('2024-01-15'),
          status: enrollment.status,
          grade: enrollment.grade,
        });
      }
    }

    // Add failed courses for illustration
    // Using courses from semester 3 that student hasn't taken yet
    const student2_failed_courses = [
      {
        courseCode: 'DSA301',
        status: EnrollmentStatus.FAILED,
        grade: 2.6,
        period: periods.period2023_2._id,
      },
    ];

    for (const enrollment of student2_failed_courses) {
      const group = getGroupByCourseCodeAndPeriod(
        enrollment.courseCode,
        (enrollment.period as any).toString(),
        'B',
      );
      if (group) {
        allEnrollments.push({
          studentId: students[1]._id,
          groupId: group._id,
          enrolledAt: new Date('2023-07-15'),
          status: enrollment.status,
          grade: enrollment.grade,
        });
      }
    }

    // === STUDENT 3 (Carlos Lopez - STU003) - Semester 3 ===
    // Enrolled in semester 3 courses - Group A
    const student3Enrollments = [
      { courseCode: 'DSA301', status: EnrollmentStatus.ENROLLED, grade: null },
      { courseCode: 'ALG301', status: EnrollmentStatus.ENROLLED, grade: null },
    ];

    for (const enrollment of student3Enrollments) {
      const group = getGroupByCourseCodeAndPeriod(
        enrollment.courseCode,
        (periods.currentPeriod._id as any).toString(),
        'A',
      );
      if (group) {
        allEnrollments.push({
          studentId: students[2]._id,
          groupId: group._id,
          enrolledAt: new Date('2024-07-15'),
          status: enrollment.status,
          grade: enrollment.grade,
        });
      }
    }

    // === STUDENT 4 (Ana Martinez - STU004) - Semester 4 ===
    // Enrolled in semester 4 courses (different times)
    const student4Enrollments = [
      { courseCode: 'DB401', status: EnrollmentStatus.ENROLLED, grade: null },
      { courseCode: 'SWE401', status: EnrollmentStatus.ENROLLED, grade: null },
    ];

    for (const enrollment of student4Enrollments) {
      const group = getGroupByCourseCodeAndPeriod(
        enrollment.courseCode,
        (periods.currentPeriod._id as any).toString(),
        'A',
      );
      if (group) {
        allEnrollments.push({
          studentId: students[3]._id,
          groupId: group._id,
          enrolledAt: new Date('2024-07-15'),
          status: enrollment.status,
          grade: enrollment.grade,
        });
      }
    }

    // === STUDENT 5 (Luis Rodriguez - STU005) - Semester 5 ===
    // Enrolled in semester 5 courses
    const student5Enrollments = [
      { courseCode: 'NET501', status: EnrollmentStatus.ENROLLED, grade: null },
      { courseCode: 'WEB501', status: EnrollmentStatus.ENROLLED, grade: null },
    ];

    for (const enrollment of student5Enrollments) {
      const group = getGroupByCourseCodeAndPeriod(
        enrollment.courseCode,
        (periods.currentPeriod._id as any).toString(),
        'A',
      );
      if (group) {
        allEnrollments.push({
          studentId: students[4]._id,
          groupId: group._id,
          enrolledAt: new Date('2024-07-15'),
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
    console.log('\n=== COMPREHENSIVE TEST DATA SUMMARY ===\n');

    console.log('👥 USERS CREATED:');
    console.log('Admin 1: daniel.useche-p@mail.com (password: 123456789)');
    console.log('Admin 2: laura.venegas-p@mail.com (password: 123456789)');
    console.log(
      'Faculty: prof.rodriguez@universidad.edu (password: 123456789)',
    );
    console.log('\n📚 STUDENTS (all password: 123456789):');
    console.log(
      'Student 1: juan.perez@estudiante.edu (SIS2024001) - Semester 4 - 11 passed + 2 current',
    );
    console.log(
      'Student 2: maria.garcia@estudiante.edu (SIS2024002) - Semester 2 - 5 passed + 4 current',
    );
    console.log(
      'Student 3: carlos.lopez@estudiante.edu (SIS2024003) - Semester 3 - 2 courses',
    );
    console.log(
      'Student 4: ana.martinez@estudiante.edu (SIS2024004) - Semester 4 - 2 courses',
    );
    console.log(
      'Student 5: luis.rodriguez@estudiante.edu (SIS2024005) - Semester 5 - 2 courses\n',
    );

    return {
      faculty,
      program,
      periods,
      courses,
      courseGroups,
      students,
      users: {
        testUsers,
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
