import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { RequestState } from '../../change-requests/entities/change-request.entity';

export type RequestEventDocument = RequestEvent & Document;

@Schema()
export class RequestEvent {
  @Prop({ type: String, ref: 'ChangeRequest', required: true })
  requestId: string;

  @Prop({ required: true })
  occurredAt: Date;

  @Prop({ type: String, ref: 'User', required: true })
  actorUserId: string;

  @Prop({ required: true })
  action: string;

  @Prop({ enum: RequestState })
  stateFrom?: RequestState;

  @Prop({ enum: RequestState })
  stateTo?: RequestState;

  @Prop()
  notes?: string;
}

export const RequestEventSchema = SchemaFactory.createForClass(RequestEvent);
