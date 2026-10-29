import { NotFoundError } from '@/core/domain/errors/not-found-error'

export class MaintenanceNotFoundError extends NotFoundError {
  constructor(message?: string) {
    super(message || 'Maintenance not found.')
    this.name = MaintenanceNotFoundError.name
  }
}
