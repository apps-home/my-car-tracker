import { CurrentUserId } from '@lib/auth/nest'
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query
} from '@nestjs/common'

import { toHttpException } from '@/infra/http/to-http-exception'

import { CreateScheduleUseCase } from '../application/use-cases/create-schedule'
import { DeleteScheduleUseCase } from '../application/use-cases/delete-schedule'
import { FindScheduleByIdUseCase } from '../application/use-cases/find-schedule'
import { ListScheduleTemplatesUseCase } from '../application/use-cases/list-schedule-templates'
import { ListSchedulesUseCase } from '../application/use-cases/list-schedules'
import { SeedDefaultSchedulesUseCase } from '../application/use-cases/seed-default-schedules'
import { UpdateScheduleUseCase } from '../application/use-cases/update-schedule'
import {
  CreateScheduleDTO,
  ListSchedulesQueryDTO,
  SeedDefaultSchedulesDTO,
  UpdateScheduleDTO
} from './schedule.dto'

@Controller('schedules')
export class ScheduleController {
  constructor(
    private readonly createScheduleUseCase: CreateScheduleUseCase,
    private readonly seedDefaultSchedulesUseCase: SeedDefaultSchedulesUseCase,
    private readonly listSchedulesUseCase: ListSchedulesUseCase,
    private readonly listScheduleTemplatesUseCase: ListScheduleTemplatesUseCase,
    private readonly findScheduleByIdUseCase: FindScheduleByIdUseCase,
    private readonly updateScheduleUseCase: UpdateScheduleUseCase,
    private readonly deleteScheduleUseCase: DeleteScheduleUseCase
  ) {}

  @Post()
  async create(
    @Body() data: CreateScheduleDTO,
    @CurrentUserId() userId: string
  ) {
    const result = await this.createScheduleUseCase.execute(userId, data)

    if (result.isLeft()) {
      throw toHttpException(result.value)
    }

    return { message: 'Schedule created successfully', id: result.value.id }
  }

  @Post('seed-defaults')
  async seedDefaults(
    @Body() data: SeedDefaultSchedulesDTO,
    @CurrentUserId() userId: string
  ) {
    const result = await this.seedDefaultSchedulesUseCase.execute(userId, data)

    if (result.isLeft()) {
      throw toHttpException(result.value)
    }

    return {
      message: 'Default schedules created successfully',
      created: result.value.length
    }
  }

  @Get()
  async list(
    @Query() query: ListSchedulesQueryDTO,
    @CurrentUserId() userId: string
  ) {
    const result = await this.listSchedulesUseCase.execute({ ...query, userId })

    return result.value
  }

  @Get('templates')
  templates() {
    return this.listScheduleTemplatesUseCase.execute().value
  }

  @Get(':id')
  async findById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUserId() userId: string
  ) {
    const result = await this.findScheduleByIdUseCase.execute(userId, id)

    if (result.isLeft()) {
      throw toHttpException(result.value)
    }

    return result.value
  }

  @Patch(':id')
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() data: UpdateScheduleDTO,
    @CurrentUserId() userId: string
  ) {
    const result = await this.updateScheduleUseCase.execute(userId, id, data)

    if (result.isLeft()) {
      throw toHttpException(result.value)
    }

    return { message: 'Schedule updated successfully' }
  }

  @Delete(':id')
  async delete(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUserId() userId: string
  ) {
    const result = await this.deleteScheduleUseCase.execute(userId, id)

    if (result.isLeft()) {
      throw toHttpException(result.value)
    }

    return { message: 'Schedule deleted successfully' }
  }
}
