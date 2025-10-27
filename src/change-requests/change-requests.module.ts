import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChangeRequestsService } from './services/change-requests.service';
import { StateTransitionService } from './services/state-transition.service';
import { StateManagementService } from './services/state-management.service';
import { StateAuditService } from './services/state-audit.service';
import { CurrentStateService } from './services/current-state.service';
import { ChangeRequestsController } from './change-requests.controller';
import {
  ChangeRequest,
  ChangeRequestSchema,
} from './entities/change-request.entity';
import {
  RequestStateDefinition,
  RequestStateDefinitionSchema,
} from './entities/request-state-definition.entity';
import {
  RequestStateHistory,
  RequestStateHistorySchema,
} from './entities/request-state-history.entity';

import {
  ValidTransition,
  ValidTransitionSchema,
} from './entities/valid-transition.entity';


import { Student, StudentSchema } from '../students/entities/student.entity';
import { User, UserSchema } from '../users/entities/user.entity';
import {
  CourseGroup,
  CourseGroupSchema,
} from '../course-groups/entities/course-group.entity';
import { Course, CourseSchema } from '../courses/entities/course.entity';
import {
  Enrollment,
  EnrollmentSchema,
} from '../enrollments/entities/enrollment.entity';
import {
  AcademicPeriod,
  AcademicPeriodSchema,
} from '../academic-periods/entities/academic-period.entity';
import { Program, ProgramSchema } from '../programs/entities/program.entity';
import { SchedulesModule } from '../schedules/schedules.module';


@Module({
  imports: [
    SchedulesModule,
    MongooseModule.forFeature([
      { name: ChangeRequest.name, schema: ChangeRequestSchema },
      { name: RequestStateDefinition.name, schema: RequestStateDefinitionSchema },
      { name: RequestStateHistory.name, schema: RequestStateHistorySchema },

      { name: ValidTransition.name, schema: ValidTransitionSchema },

      { name: Student.name, schema: StudentSchema },
      { name: User.name, schema: UserSchema },
      { name: CourseGroup.name, schema: CourseGroupSchema },
      { name: Course.name, schema: CourseSchema },
      { name: Enrollment.name, schema: EnrollmentSchema },
      { name: AcademicPeriod.name, schema: AcademicPeriodSchema },
      { name: Program.name, schema: ProgramSchema },
    ]),
  ],
  controllers: [ChangeRequestsController],
  providers: [
    ChangeRequestsService,
    StateTransitionService,
    StateManagementService,
    StateAuditService,
    CurrentStateService,
  ],
  exports: [
    ChangeRequestsService,
    StateTransitionService,
    StateManagementService,
    StateAuditService,
    CurrentStateService,
  ],
})
export class ChangeRequestsModule {}