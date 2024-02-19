export enum Status {
  CREATED = 'created',
  WAITING_FOR_RESOURCE = 'waiting_for_resource',
  PREPARING = 'preparing',
  PENDING = 'pending',
  RUNNING = 'running',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELED = 'canceled',
  SKIPPED = 'skipped',
  MANUAL = 'manual',
  SCHEDULED = 'scheduled',

  FAILED_WITH_WARNING = 'failed_with_warning' // custom status
}
