import { Injectable } from '@nestjs/common'

import { Either, right } from '@/core/utils/Either'

import {
  DEFAULT_SCHEDULE_TEMPLATES,
  type ScheduleTemplate
} from '../../domain/default-schedule-templates'

@Injectable()
export class ListScheduleTemplatesUseCase {
  execute(): Either<never, ScheduleTemplate[]> {
    return right(DEFAULT_SCHEDULE_TEMPLATES)
  }
}
