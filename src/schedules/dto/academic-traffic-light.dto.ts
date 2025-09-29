import { TrafficLightColor } from '../services/academic-traffic-light.service';

export class StudentAcademicStatusDto {
  studentId: string;
  studentName: string;
  currentSemester: number;
  overallColor: TrafficLightColor;
  passedCredits: number;
  totalCredits: number;
  gpa: number;
  riskLevel: 'low' | 'medium' | 'high';
  recommendations: string[];
}

export class CourseStatusDto {
  courseCode: string;
  courseName: string;
  credits: number;
  grade?: number;
  status: string;
  color: TrafficLightColor;
  periodCode: string;
}

export class AcademicStatisticsDto {
  totalStudents: number;
  greenStudents: number;
  yellowStudents: number;
  redStudents: number;
  averageGPA: number;
  greenPercentage: number;
  yellowPercentage: number;
  redPercentage: number;
}

export class StudentTrafficLightReportDto {
  studentInfo: StudentAcademicStatusDto;
  courseStatuses: {
    passedCourses: CourseStatusDto[];
    currentCourses: CourseStatusDto[];
    failedCourses: CourseStatusDto[];
  };
}