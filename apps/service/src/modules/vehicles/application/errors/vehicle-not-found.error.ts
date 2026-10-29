import { NotFoundError } from '@/core/domain/errors/not-found-error'

export class VehicleNotFoundError extends NotFoundError {
  constructor(message?: string) {
    super(message || 'Vehicle not found.')
    this.name = VehicleNotFoundError.name
  }
}
