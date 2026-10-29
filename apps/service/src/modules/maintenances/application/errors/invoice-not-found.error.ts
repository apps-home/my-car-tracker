import { NotFoundError } from '@/core/domain/errors/not-found-error'

export class InvoiceNotFoundError extends NotFoundError {
  constructor(message?: string) {
    super(message || 'Invoice not found.')
    this.name = InvoiceNotFoundError.name
  }
}
