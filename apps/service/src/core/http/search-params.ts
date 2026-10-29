export type SortOrder = 'asc' | 'desc'

export interface SearchParams {
  page?: number
  per_page?: number
  search?: string
  sort?: string
  order?: SortOrder
}
