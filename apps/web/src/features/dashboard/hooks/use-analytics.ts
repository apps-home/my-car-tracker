import { useQuery } from '@tanstack/react-query'

import { getAnalyticsOverview, getMonthlyCosts } from '../api'
import type { AnalyticsOverviewParams, MonthlyCostsParams } from '../api/types'

export const ANALYTICS_QUERY_KEY = 'analytics'

export function useAnalyticsOverview(params: AnalyticsOverviewParams | null) {
	return useQuery({
		queryKey: [ANALYTICS_QUERY_KEY, 'overview', params],
		queryFn: () => getAnalyticsOverview(params as AnalyticsOverviewParams),
		placeholderData: (prev) => prev,
		enabled: !!params
	})
}

export function useMonthlyCosts(params: MonthlyCostsParams | null) {
	return useQuery({
		queryKey: [ANALYTICS_QUERY_KEY, 'monthly-costs', params],
		queryFn: () => getMonthlyCosts(params as MonthlyCostsParams),
		placeholderData: (prev) => prev,
		enabled: !!params
	})
}

