import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * Waitlist Status Enum
 * 
 * Estados posibles de una entrada en lista de espera
 */
export enum WaitlistStatus {
  WAITING = 'waiting',       // En espera activa
  ADMITTED = 'admitted',     // Admitido al grupo
  WITHDRAWN = 'withdrawn',   // Retirado de la lista
  EXPIRED = 'expired',       // Expirado por falta de respuesta
}

export type WaitlistDocument = GroupWaitlist & Document;

/**
 * Group Waitlist Entity
 * 
 * Representa una entrada en la lista de espera de un grupo.
 * Gestiona el orden de prioridad y el procesamiento automático.
 * 
 * @schema GroupWaitlist
 */
@Schema({ 
  timestamps: true,
  collection: 'waitlists'
})
export class GroupWaitlist {
  /**
   * ID del grupo de curso
   * Referencia a CourseGroup
   */
  @Prop({ 
    type: Types.ObjectId, 
    ref: 'CourseGroup', 
    required: true,
    index: true
  })
  groupId: Types.ObjectId;

  /**
   * ID del estudiante en espera
   * Referencia a Student
   */
  @Prop({ 
    type: Types.ObjectId, 
    ref: 'Student', 
    required: true,
    index: true
  })
  studentId: Types.ObjectId;

  /**
   * ID del periodo académico
   * Referencia a AcademicPeriod
   */
  @Prop({ 
    type: Types.ObjectId, 
    ref: 'AcademicPeriod', 
    required: true,
    index: true
  })
  academicPeriodId: Types.ObjectId;

  /**
   * Posición en la lista de espera
   * Se calcula automáticamente por orden de llegada
   */
  @Prop({ 
    required: true,
    min: 1,
    type: Number
  })
  position: number;

  /**
   * Estado de la entrada en la lista
   */
  @Prop({ 
    required: true, 
    enum: WaitlistStatus,
    default: WaitlistStatus.WAITING,
    index: true
  })
  status: WaitlistStatus;

  /**
   * Prioridad del estudiante (opcional)
   * Usado para casos especiales o estudiantes con prioridad
   * Mayor número = mayor prioridad
   */
  @Prop({ 
    type: Number,
    default: 0,
    min: 0,
    max: 10
  })
  priority: number;

  /**
   * Fecha de admisión (cuando status cambia a ADMITTED)
   */
  @Prop({ 
    type: Date
  })
  admittedAt?: Date;

  /**
   * Fecha de retiro (cuando status cambia a WITHDRAWN o EXPIRED)
   */
  @Prop({ 
    type: Date
  })
  withdrawnAt?: Date;

  /**
   * Motivo de retiro
   */
  @Prop({ 
    trim: true,
    maxlength: 500
  })
  withdrawalReason?: string;

  /**
   * Fecha límite para responder a la admisión
   * Si el estudiante no responde antes de esta fecha, expira
   */
  @Prop({ 
    type: Date
  })
  responseDeadline?: Date;

  /**
   * Indica si se le notificó al estudiante
   */
  @Prop({ 
    type: Boolean,
    default: false
  })
  notified: boolean;

  /**
   * Fecha de última notificación
   */
  @Prop({ 
    type: Date
  })
  lastNotifiedAt?: Date;

  /**
   * Número de intentos de notificación
   */
  @Prop({ 
    type: Number,
    default: 0,
    min: 0
  })
  notificationAttempts: number;

  /**
   * Notas adicionales
   */
  @Prop({ 
    trim: true,
    maxlength: 1000
  })
  notes?: string;

  /**
   * Timestamp de creación (automático)
   */
  createdAt?: Date;

  /**
   * Timestamp de última actualización (automático)
   */
  updatedAt?: Date;
}

export const WaitlistSchema = SchemaFactory.createForClass(GroupWaitlist);

/**
 * Índices compuestos para optimizar consultas
 */
// Índice único: un estudiante solo puede estar una vez en la waitlist de un grupo
WaitlistSchema.index({ groupId: 1, studentId: 1, status: 1 }, { 
  unique: true,
  partialFilterExpression: { 
    status: { $in: [WaitlistStatus.WAITING, WaitlistStatus.ADMITTED] }
  }
});

WaitlistSchema.index({ groupId: 1, status: 1, position: 1 });
WaitlistSchema.index({ studentId: 1, status: 1 });
WaitlistSchema.index({ academicPeriodId: 1, status: 1 });
WaitlistSchema.index({ status: 1, responseDeadline: 1 });

/**
 * Middleware: Actualizar fechas según cambios de estado
 */
WaitlistSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    switch (this.status) {
      case WaitlistStatus.ADMITTED:
        if (!this.admittedAt) {
          this.admittedAt = new Date();
        }
        // Establecer deadline de respuesta (48 horas por defecto)
        if (!this.responseDeadline) {
          this.responseDeadline = new Date(Date.now() + 48 * 60 * 60 * 1000);
        }
        break;
      
      case WaitlistStatus.WITHDRAWN:
      case WaitlistStatus.EXPIRED:
        if (!this.withdrawnAt) {
          this.withdrawnAt = new Date();
        }
        break;
    }
  }
  
  next();
});