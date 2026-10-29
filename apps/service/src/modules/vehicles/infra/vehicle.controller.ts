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

import { CreateVehicleUseCase } from '../application/use-cases/create-vehicle'
import { DeleteVehicleUseCase } from '../application/use-cases/delete-vehicle'
import { FindVehicleByIdUseCase } from '../application/use-cases/find-vehicle'
import { ListVehiclesUseCase } from '../application/use-cases/list-vehicles'
import { UpdateVehicleUseCase } from '../application/use-cases/update-vehicle'
import {
  CreateVehicleDTO,
  ListVehiclesQueryDTO,
  UpdateVehicleDTO
} from './vehicle.dto'

@Controller('vehicles')
export class VehicleController {
  constructor(
    private readonly createVehicleUseCase: CreateVehicleUseCase,
    private readonly listVehiclesUseCase: ListVehiclesUseCase,
    private readonly findVehicleByIdUseCase: FindVehicleByIdUseCase,
    private readonly updateVehicleUseCase: UpdateVehicleUseCase,
    private readonly deleteVehicleUseCase: DeleteVehicleUseCase
  ) {}

  @Post()
  async create(
    @Body() data: CreateVehicleDTO,
    @CurrentUserId() userId: string
  ) {
    const result = await this.createVehicleUseCase.execute(userId, data)

    if (result.isLeft()) {
      throw toHttpException(result.value)
    }

    return { message: 'Vehicle created successfully', id: result.value.id }
  }

  @Get()
  async list(
    @Query() query: ListVehiclesQueryDTO,
    @CurrentUserId() userId: string
  ) {
    const result = await this.listVehiclesUseCase.execute({
      userId,
      status: query.status
    })

    return result.value
  }

  @Get(':id')
  async findById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUserId() userId: string
  ) {
    const result = await this.findVehicleByIdUseCase.execute(userId, id)

    if (result.isLeft()) {
      throw toHttpException(result.value)
    }

    return result.value
  }

  @Patch(':id')
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() data: UpdateVehicleDTO,
    @CurrentUserId() userId: string
  ) {
    const result = await this.updateVehicleUseCase.execute(userId, id, data)

    if (result.isLeft()) {
      throw toHttpException(result.value)
    }

    return { message: 'Vehicle updated successfully' }
  }

  @Delete(':id')
  async delete(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUserId() userId: string
  ) {
    const result = await this.deleteVehicleUseCase.execute(userId, id)

    if (result.isLeft()) {
      throw toHttpException(result.value)
    }

    return { message: 'Vehicle deleted successfully' }
  }
}
