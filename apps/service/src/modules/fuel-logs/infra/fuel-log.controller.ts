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

import { CreateFuelLogUseCase } from '../application/use-cases/create-fuel-log'
import { DeleteFuelLogUseCase } from '../application/use-cases/delete-fuel-log'
import { FindFuelLogByIdUseCase } from '../application/use-cases/find-fuel-log'
import { GetFuelLogSummaryUseCase } from '../application/use-cases/get-fuel-log-summary'
import { ListFuelLogsUseCase } from '../application/use-cases/list-fuel-logs'
import { UpdateFuelLogUseCase } from '../application/use-cases/update-fuel-log'
import {
  CreateFuelLogDTO,
  FuelLogSummaryQueryDTO,
  ListFuelLogsQueryDTO,
  UpdateFuelLogDTO
} from './fuel-log.dto'

@Controller('fuel-logs')
export class FuelLogController {
  constructor(
    private readonly createFuelLogUseCase: CreateFuelLogUseCase,
    private readonly listFuelLogsUseCase: ListFuelLogsUseCase,
    private readonly getFuelLogSummaryUseCase: GetFuelLogSummaryUseCase,
    private readonly findFuelLogByIdUseCase: FindFuelLogByIdUseCase,
    private readonly updateFuelLogUseCase: UpdateFuelLogUseCase,
    private readonly deleteFuelLogUseCase: DeleteFuelLogUseCase
  ) {}

  @Post()
  async create(
    @Body() data: CreateFuelLogDTO,
    @CurrentUserId() userId: string
  ) {
    const result = await this.createFuelLogUseCase.execute(userId, data)

    if (result.isLeft()) {
      throw toHttpException(result.value)
    }

    return { message: 'Fuel log created successfully', id: result.value.id }
  }

  @Get()
  async list(
    @Query() query: ListFuelLogsQueryDTO,
    @CurrentUserId() userId: string
  ) {
    const result = await this.listFuelLogsUseCase.execute({ ...query, userId })

    return result.value
  }

  @Get('summary')
  async summary(
    @Query() query: FuelLogSummaryQueryDTO,
    @CurrentUserId() userId: string
  ) {
    const result = await this.getFuelLogSummaryUseCase.execute({
      ...query,
      userId
    })

    if (result.isLeft()) {
      throw toHttpException(result.value)
    }

    return result.value
  }

  @Get(':id')
  async findById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUserId() userId: string
  ) {
    const result = await this.findFuelLogByIdUseCase.execute(userId, id)

    if (result.isLeft()) {
      throw toHttpException(result.value)
    }

    return result.value
  }

  @Patch(':id')
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() data: UpdateFuelLogDTO,
    @CurrentUserId() userId: string
  ) {
    const result = await this.updateFuelLogUseCase.execute(userId, id, data)

    if (result.isLeft()) {
      throw toHttpException(result.value)
    }

    return { message: 'Fuel log updated successfully' }
  }

  @Delete(':id')
  async delete(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUserId() userId: string
  ) {
    const result = await this.deleteFuelLogUseCase.execute(userId, id)

    if (result.isLeft()) {
      throw toHttpException(result.value)
    }

    return { message: 'Fuel log deleted successfully' }
  }
}
