export class StateHistoryEventDto {
  id: string;
  requestId: string;
  fromState?: string;
  toState: string;
  changeType: string;
  actorId?: string;
  actorName: string;
  actorEmail?: string;
  reason?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
  description: string;
  readableDescription: string;
}

export class RequestHistoryResponseDto {
  requestId: string;
  radicado: string;
  totalEvents: number;
  hasTransitions: boolean;
  noTransitions: boolean; // Flag cuando solo hay creación
  events: StateHistoryEventDto[];
  summary: {
    createdAt: Date;
    createdBy: string;
    currentState: string;
    lastChangedAt: Date;
    lastChangedBy: string;
    totalStateChanges: number;
  };
  message?: string; // Mensaje explicativo cuando noTransitions es true
}

export class HistoryStatsDto {
  totalEvents: number;
  totalStateChanges: number;
  totalUpdates: number;
  firstEvent: Date | null;
  lastEvent: Date | null;
  uniqueActors: number;
}

export class TimelineEventDto {
  id: string;
  type: 'create' | 'state_change' | 'update';
  timestamp: Date;
  actor: string;
  actorEmail?: string;
  fromState?: string;
  toState: string;
  reason?: string;
  description: string;
  readableDescription: string;
  icon?: string;
  color?: string;
}