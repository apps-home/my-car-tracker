import { NotFoundError } from '@/core/domain/errors/not-found-error'

export class FuelLogNotFoundError extends NotFoundError {
  constructor(message?: string) {
    super(message || 'Fuel log not found.')
    this.name = FuelLogNotFoundError.name
  }
}
