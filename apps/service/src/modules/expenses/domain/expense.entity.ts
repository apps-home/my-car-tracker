import { randomUUID } from 'node:crypto'

import { PayloadError } from '@/core/domain/errors/payload-error'
import type { PaymentMethod } from '@/core/domain/payment-method'
import { omitUndefined } from '@/core/utils/omit-undefined'
import { round } from '@/core/utils/round'
import { addDaysUtc, startOfDayUtc } from '@/core/utils/utc-date'

import type { CreateExpensePayload } from './dto/expense.payload'
import type { ExpenseCategory } from './expense-category'

export interface ExpenseProps {
  id: string
  vehicleId: string
  userId: string
  category: ExpenseCategory
  date: Date
  amount: number
  description: string
  locationOrRoute: string | null
  odometerKm: number | null
  paymentMethod: PaymentMethod | null
  receiptUrl: string | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

export type UpdateExpenseProps = Partial<
  Omit<ExpenseProps, 'id' | 'vehicleId' | 'userId' | 'createdAt' | 'updatedAt'>
>

export class Expense {
  private _props: ExpenseProps

  constructor(props: ExpenseProps) {
    this._props = props
  }

  static create(userId: string, data: CreateExpensePayload): Expense {
    const now = new Date()

    return new Expense(
      Expense.normalize({
        id: randomUUID(),
        vehicleId: data.vehicleId,
        userId,
        category: data.category,
        date: data.date,
        amount: data.amount,
        description: data.description,
        locationOrRoute: data.locationOrRoute ?? null,
        odometerKm: data.odometerKm ?? null,
        paymentMethod: data.paymentMethod ?? null,
        receiptUrl: null,
        notes: data.notes ?? null,
        createdAt: now,
        updatedAt: now
      })
    )
  }

  update(data: UpdateExpenseProps): void {
    this._props = Expense.normalize({
      ...this._props,
      ...omitUndefined(data),
      updatedAt: new Date()
    })
  }

  private static normalize(props: ExpenseProps): ExpenseProps {
    if (!(props.date instanceof Date) || Number.isNaN(props.date.getTime())) {
      throw new PayloadError('date must be a valid date')
    }

    // A data é o dia de calendário (00:00 UTC); um dia de folga cobre o fuso do celular
    const date = startOfDayUtc(props.date)

    if (date > addDaysUtc(startOfDayUtc(new Date()), 1)) {
      throw new PayloadError('date must not be in the future')
    }

    if (props.category === null) {
      throw new PayloadError('category must not be empty')
    }

    if (
      props.amount === null ||
      !Number.isFinite(props.amount) ||
      round(props.amount, 2) <= 0
    ) {
      throw new PayloadError('amount must be greater than zero')
    }

    const description = props.description?.trim()

    if (!description) {
      throw new PayloadError('description must not be empty')
    }

    if (
      props.odometerKm !== null &&
      (!Number.isInteger(props.odometerKm) || props.odometerKm < 0)
    ) {
      throw new PayloadError('odometerKm must be a non-negative integer')
    }

    return {
      ...props,
      date,
      amount: round(props.amount, 2),
      description,
      locationOrRoute: props.locationOrRoute?.trim() || null,
      notes: props.notes?.trim() || null
    }
  }

  get id(): string {
    return this._props.id
  }

  get vehicleId(): string {
    return this._props.vehicleId
  }

  get userId(): string {
    return this._props.userId
  }

  get category(): ExpenseCategory {
    return this._props.category
  }

  get date(): Date {
    return this._props.date
  }

  get amount(): number {
    return this._props.amount
  }

  get description(): string {
    return this._props.description
  }

  get locationOrRoute(): string | null {
    return this._props.locationOrRoute
  }

  get odometerKm(): number | null {
    return this._props.odometerKm
  }

  get paymentMethod(): PaymentMethod | null {
    return this._props.paymentMethod
  }

  get receiptUrl(): string | null {
    return this._props.receiptUrl
  }

  get notes(): string | null {
    return this._props.notes
  }

  get createdAt(): Date {
    return this._props.createdAt
  }

  get updatedAt(): Date {
    return this._props.updatedAt
  }
}
