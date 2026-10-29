import { Injectable } from '@nestjs/common'

import { Either, left, right } from '@/core/utils/Either'

import { ScheduleRepository } from '../../domain/schedule.repository'
import { ScheduleNotFoundError } from '../errors/schedule-not-found.error'

type Response = Either<ScheduleNotFoundError, void>

/** As peças que cumpriram o plano ficam no histórico, sem o vínculo (SetNull) */
@Injectable()
export class DeleteScheduleUseCase {
  constructor(private scheduleRepository: ScheduleRepository) {}

  async execute(userId: string, id: string): Promise<Response> {
    const schedule = await this.scheduleRepository.findById(id, userId)

    if (!schedule) {
      return left(new ScheduleNotFoundError())
    }

    await this.scheduleRepository.delete(schedule)

    return right(void 0)
  }
}
