import { env } from '@my-car-tracker/env/web'
import axios from 'axios'

export const n8nApiClient = axios.create({
  baseURL: env.N8N_URL,
  timeout: 120000 // 120 segundos
})
