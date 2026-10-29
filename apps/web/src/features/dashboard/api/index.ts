import { apiClient } from '@/infrastructure/services/api-client'

import type {
  AnalyticsOverview,
  AnalyticsOverviewParams,
  MonthlyCostsParams,
  MonthlyCostsResponse
} from './types'

const BASE_URL = '/analytics'

export async function getAnalyticsOverview(
  params: AnalyticsOverviewParams
): Promise<AnalyticsOverview> {
  const response = await apiClient.get<AnalyticsOverview>(
    `${BASE_URL}/overview`,
    { params }
  )
  return response.data
}

export async function getMonthlyCosts(
  params: MonthlyCostsParams
): Promise<MonthlyCostsResponse> {
  const response = await apiClient.get<MonthlyCostsResponse>(
    `${BASE_URL}/monthly-costs`,
    { params }
  )
  return response.data
}
