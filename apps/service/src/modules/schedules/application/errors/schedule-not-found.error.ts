import { NotFoundError } from '@/core/domain/errors/not-found-error'

export class ScheduleNotFoundError extends NotFoundError {
  constructor(message?: string) {
    super(message || 'Maintenance schedule not found.')
    this.name = ScheduleNotFoundError.name
  }
}
