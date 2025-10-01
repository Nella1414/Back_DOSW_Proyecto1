import { RequestState } from '../entities/change-request.entity';

export class ChangeRequestResponseDto {
  id: string;
  radicado: string;
  studentId: string;
  studentName: string;
  programName: string;
  periodCode: string;
  sourceCourse: CourseInfoDto;
  targetCourse: CourseInfoDto;
  state: RequestState;
  priority: number;
  observations?: string;
  exceptional: boolean;
  createdAt: Date;
  resolvedAt?: Date;
  resolutionReason?: string;
}

export class CourseInfoDto {
  courseId: string;
  courseCode: string;
  courseName: string;
  groupNumber: string;
  schedule: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    room?: string;
  }[];
}

export class CreateChangeRequestDto {
  sourceGroupId: string;
  targetGroupId: string;
  reason: string;
  priority?: number;
  observations?: string;
}

export class ApproveChangeRequestDto {
  observations?: string;
  resolutionReason?: string;
}

export class RejectChangeRequestDto {
  resolutionReason: string;
  observations?: string;
}
