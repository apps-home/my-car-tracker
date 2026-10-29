import { NotFoundError } from '@/core/domain/errors/not-found-error'

export class MaintenanceTaskNotFoundError extends NotFoundError {
	constructor() {
		super('Maintenance task not found.')
		this.name = MaintenanceTaskNotFoundError.name
	}
}

