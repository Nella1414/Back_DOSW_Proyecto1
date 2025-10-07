import { EnrollmentStatus } from '../../enrollments/entities/enrollment.entity';

/**
 * Traffic Light Color Types
 *
 * ! NOTA: Los colores del semáforo académico representan el estado del estudiante
 * * green: Materia aprobada/pasada (PASSED)
 * * blue: Materia en progreso/cursando actualmente (ENROLLED)
 * ! red: Materia perdida/reprobada (FAILED)
 */
export type TrafficLightColor = 'green' | 'blue' | 'red';

/**
 * Student Academic Status Interface
 *
 * Represents the comprehensive academic status of a student
 * including performance metrics and risk assessment
 */
export interface StudentAcademicStatus {
  studentId: string; // * Código único del estudiante
  studentName: string; // * Nombre completo del estudiante
  currentSemester: number; // * Semestre académico actual
  overallColor: TrafficLightColor; // ! Color general del semáforo académico
  passedCredits: number; // * Créditos aprobados
  totalCredits: number; // * Total de créditos cursados
  gpa: number; // * Promedio ponderado acumulado
  riskLevel: 'low' | 'medium' | 'high'; // ! Nivel de riesgo académico
  recommendations: string[]; // ? Recomendaciones para el estudiante
}

/**
 * Course Status Interface
 *
 * Represents the status of a specific course for a student
 * including enrollment status and performance metrics
 */
export interface CourseStatus {
  courseCode: string; // * Código del curso
  courseName: string; // * Nombre del curso
  credits: number; // * Número de créditos del curso
  grade?: number; // ? Calificación obtenida (si está disponible)
  status: EnrollmentStatus; // * Estado de la matrícula
  color: TrafficLightColor; // ! Color del semáforo para este curso
  periodCode: string; // * Código del periodo académico
}

/**
 * Populated Group Interface
 *
 * Represents a populated CourseGroup with all necessary relations
 */
export interface PopulatedGroup {
  _id: any;
  courseId: {
    _id: any;
    code: string;
    name: string;
    credits: number;
  };
  periodId: {
    _id: any;
    code: string;
  };
}

/**
 * Populated Enrollment Interface
 *
 * Represents a populated Enrollment with all necessary relations
 */
export interface PopulatedEnrollment {
  _id: any;
  studentId: any;
  groupId: PopulatedGroup;
  status: EnrollmentStatus;
  grade?: number;
}
