import { CurrentUserId } from '@lib/auth/nest'
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'

import { toHttpException } from '@/infra/http/to-http-exception'

import { CreateMaintenanceUseCase } from '../application/use-cases/create-maintenance'
import { CreateMaintenanceTaskUseCase } from '../application/use-cases/create-maintenance-task'
import { DeleteMaintenanceUseCase } from '../application/use-cases/delete-maintenance'
import { DeleteMaintenanceTaskUseCase } from '../application/use-cases/delete-maintenance-task'
import { FindMaintenanceByIdUseCase } from '../application/use-cases/find-maintenance'
import { GetInvoiceUrlUseCase } from '../application/use-cases/get-invoice-url'
import { ListActiveWarrantiesUseCase } from '../application/use-cases/list-active-warranties'
import { ListMaintenanceTasksUseCase } from '../application/use-cases/list-maintenance-tasks'
import { ListMaintenancesUseCase } from '../application/use-cases/list-maintenances'
import { UpdateMaintenanceUseCase } from '../application/use-cases/update-maintenance'
import { UpdateMaintenanceTaskUseCase } from '../application/use-cases/update-maintenance-task'
import { UploadInvoiceUseCase } from '../application/use-cases/upload-invoice'
import {
  CreateMaintenanceDTO,
  CreateMaintenanceTaskDTO,
  ListMaintenancesQueryDTO,
  ListMaintenanceTasksQueryDTO,
  ListWarrantiesQueryDTO,
  UpdateMaintenanceDTO,
  UpdateMaintenanceTaskDTO
} from './maintenance.dto'

/** Foto (celular) ou PDF da nota fiscal / OS */
export function isInvoiceMimeType(mimetype: string) {
  return mimetype.startsWith('image/') || mimetype === 'application/pdf'
}

@Controller('maintenances')
export class MaintenanceController {
  constructor(
    private readonly createMaintenanceUseCase: CreateMaintenanceUseCase,
    private readonly listMaintenancesUseCase: ListMaintenancesUseCase,
    private readonly listActiveWarrantiesUseCase: ListActiveWarrantiesUseCase,
    private readonly findMaintenanceByIdUseCase: FindMaintenanceByIdUseCase,
    private readonly updateMaintenanceUseCase: UpdateMaintenanceUseCase,
    private readonly deleteMaintenanceUseCase: DeleteMaintenanceUseCase,
    private readonly uploadInvoiceUseCase: UploadInvoiceUseCase,
    private readonly getInvoiceUrlUseCase: GetInvoiceUrlUseCase,
    private readonly createMaintenanceTaskUseCase: CreateMaintenanceTaskUseCase,
    private readonly listMaintenanceTasksUseCase: ListMaintenanceTasksUseCase,
    private readonly updateMaintenanceTaskUseCase: UpdateMaintenanceTaskUseCase,
    private readonly deleteMaintenanceTaskUseCase: DeleteMaintenanceTaskUseCase
  ) {}

  @Post()
  async create(
    @Body() data: CreateMaintenanceDTO,
    @CurrentUserId() userId: string
  ) {
    const result = await this.createMaintenanceUseCase.execute(userId, data)

    if (result.isLeft()) {
      throw toHttpException(result.value)
    }

    return { message: 'Maintenance created successfully', id: result.value.id }
  }

  @Get()
  async list(
    @Query() query: ListMaintenancesQueryDTO,
    @CurrentUserId() userId: string
  ) {
    const result = await this.listMaintenancesUseCase.execute({
      ...query,
      userId
    })

    return result.value
  }

  @Get('warranties')
  async warranties(
    @Query() query: ListWarrantiesQueryDTO,
    @CurrentUserId() userId: string
  ) {
    const result = await this.listActiveWarrantiesUseCase.execute({
      ...query,
      userId
    })

    return result.value
  }

  @Get('tasks')
  async listTasks(
    @Query() query: ListMaintenanceTasksQueryDTO,
    @CurrentUserId() userId: string
  ) {
    const result = await this.listMaintenanceTasksUseCase.execute({
      ...query,
      userId
    })

    return result.value
  }

  @Post('tasks')
  async createTask(
    @Body() data: CreateMaintenanceTaskDTO,
    @CurrentUserId() userId: string
  ) {
    const result = await this.createMaintenanceTaskUseCase.execute(userId, data)

    if (result.isLeft()) {
      throw toHttpException(result.value)
    }

    return {
      message: 'Maintenance task created successfully',
      id: result.value.id
    }
  }

  @Patch('tasks/:id')
  async updateTask(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() data: UpdateMaintenanceTaskDTO,
    @CurrentUserId() userId: string
  ) {
    const result = await this.updateMaintenanceTaskUseCase.execute(
      userId,
      id,
      data
    )

    if (result.isLeft()) {
      throw toHttpException(result.value)
    }

    return { message: 'Maintenance task updated successfully' }
  }

  @Delete('tasks/:id')
  async deleteTask(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUserId() userId: string
  ) {
    const result = await this.deleteMaintenanceTaskUseCase.execute(userId, id)

    if (result.isLeft()) {
      throw toHttpException(result.value)
    }

    return { message: 'Maintenance task deleted successfully' }
  }

  @Get(':id')
  async findById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUserId() userId: string
  ) {
    const result = await this.findMaintenanceByIdUseCase.execute(userId, id)

    if (result.isLeft()) {
      throw toHttpException(result.value)
    }

    return result.value
  }

  @Patch(':id')
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() data: UpdateMaintenanceDTO,
    @CurrentUserId() userId: string
  ) {
    const result = await this.updateMaintenanceUseCase.execute(userId, id, data)

    if (result.isLeft()) {
      throw toHttpException(result.value)
    }

    return { message: 'Maintenance updated successfully' }
  }

  @Delete(':id')
  async delete(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUserId() userId: string
  ) {
    const result = await this.deleteMaintenanceUseCase.execute(userId, id)

    if (result.isLeft()) {
      throw toHttpException(result.value)
    }

    return { message: 'Maintenance deleted successfully' }
  }

  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter(_req, file, callback) {
        if (!isInvoiceMimeType(file.mimetype)) {
          return callback(
            new BadRequestException('Invoice must be an image or a PDF'),
            false
          )
        }

        callback(null, true)
      },
      limits: { fileSize: 1024 * 1024 * 10, files: 1 }
    })
  )
  @Post(':id/upload-invoice')
  async uploadInvoice(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUserId() userId: string
  ) {
    if (!file) {
      throw new BadRequestException('file is required')
    }

    const result = await this.uploadInvoiceUseCase.execute({
      userId,
      maintenanceId: id,
      file
    })

    if (result.isLeft()) {
      throw toHttpException(result.value)
    }

    return { message: 'Invoice uploaded successfully' }
  }

  @Get(':id/invoice')
  async invoice(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUserId() userId: string
  ) {
    const result = await this.getInvoiceUrlUseCase.execute(userId, id)

    if (result.isLeft()) {
      throw toHttpException(result.value)
    }

    return result.value
  }
}
