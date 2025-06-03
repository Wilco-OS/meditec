// Zentrale Definitionen für Umfragen

export enum SurveyStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
  // Zusätzliche Status, die in der SurveyList verwendet werden
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress'
}
