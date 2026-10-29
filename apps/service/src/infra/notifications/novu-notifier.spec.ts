import type { Novu } from '@novu/api'
import { describe, expect, it, vi } from 'vitest'

import { NOTIFICATION_WORKFLOWS } from '@/core/domain/notifications/notification.constants'

import { NovuNotifier } from './novu-notifier'

function makeNotifier(trigger: ReturnType<typeof vi.fn>) {
  return new NovuNotifier({ trigger } as unknown as Novu)
}

const request = {
  workflow: NOTIFICATION_WORKFLOWS.MAINTENANCE_DUE,
  to: { subscriberId: 'user-1' },
  payload: { title: 'Troca de óleo' },
  transactionId: 'maintenance-due-1-1'
}

describe('NovuNotifier', () => {
  it('should trigger the workflow for the subscriber', async () => {
    const trigger = vi.fn(async () => ({
      result: { acknowledged: true, status: 'processed' }
    }))

    const result = await makeNotifier(trigger).send(request)

    expect(result).toBe('sent')
    expect(trigger).toHaveBeenCalledWith({
      workflowId: 'maintenance-due',
      to: { subscriberId: 'user-1' },
      payload: { title: 'Troca de óleo' },
      transactionId: 'maintenance-due-1-1'
    })
  })

  it('should skip without a Novu client', async () => {
    const result = await new NovuNotifier(null).send(request)

    expect(result).toBe('skipped')
  })

  it('should report a trigger that Novu did not process', async () => {
    const trigger = vi.fn(async () => ({
      result: { acknowledged: true, status: 'trigger_not_active' }
    }))

    const result = await makeNotifier(trigger).send(request)

    expect(result).toBe('failed')
  })

  it('should not throw when Novu is unavailable', async () => {
    const trigger = vi.fn(async () => {
      throw new Error('Service unavailable')
    })

    const result = await makeNotifier(trigger).send(request)

    expect(result).toBe('failed')
  })
})
