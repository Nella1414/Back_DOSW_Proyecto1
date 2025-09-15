export enum UserRole {
  STUDENT = 'student',
  DEANERY = 'deanery',
  ADMIN = 'admin',
}

export interface User {
  id: number;
  username: string;
  password: string;
  role: UserRole;
  groupIds: number[];  
}

export interface Subject {
  id: number;
  code: string;
  name: string;
}

export interface Group {
  id: number;
  subjectId: number;
  code: string;
  schedule: string;     
  capacity: number;
}

export interface Request {
  id: number;
  studentId: number;
  fromGroupId: number;
  toGroupId: number;
  status: 'pending' | 'approved' | 'rejected';
}
