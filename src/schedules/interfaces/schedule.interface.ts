export interface TimeSlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  groupId?: string;
  courseCode?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ScheduleConflict {
  day: string;
  time1: string;
  time2: string;
}