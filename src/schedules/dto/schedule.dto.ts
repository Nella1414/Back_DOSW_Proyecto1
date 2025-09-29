export class StudentScheduleDto {
  studentId: string;
  studentName: string;
  currentSemester: number;
  period: string;
  schedule: DailyScheduleDto[];
}

export class DailyScheduleDto {
  dayOfWeek: number;
  dayName: string;
  classes: ClassScheduleDto[];
}

export class ClassScheduleDto {
  courseCode: string;
  courseName: string;
  groupNumber: string;
  startTime: string;
  endTime: string;
  room?: string;
  professorName?: string;
}

export class AcademicHistoryDto {
  studentId: string;
  currentSemester: number;
  academicHistory: {
    passedCourses: CourseHistoryDto[];
    currentCourses: CourseHistoryDto[];
    failedCourses: CourseHistoryDto[];
  };
}

export class CourseHistoryDto {
  periodCode: string;
  courseCode: string;
  courseName: string;
  credits: number;
  grade?: number;
  status: string;
  color: 'green' | 'yellow' | 'red';
}