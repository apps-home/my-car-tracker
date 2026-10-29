import { describe, expect, it } from 'vitest'

import { envSchema } from './env.schema'

const required = {
  DATABASE_URL: 'postgresql://x:x@localhost:5432/x',
  REDIS_PASSWORD: 'x',
  R2_ACCOUNT_ID: 'x',
  R2_ACCESS_KEY_ID: 'x',
  R2_SECRET_ACCESS_KEY: 'x',
  N8N_URL: 'http://localhost:5678'
}

describe('envSchema', () => {
  it('should split CORS_ORIGINS by comma, trimming spaces and trailing slashes', () => {
    const env = envSchema.parse({
      ...required,
      CORS_ORIGINS: ' https://car.example.app/ , http://192.168.0.4:3000,'
    })

    expect(env.CORS_ORIGINS).toEqual([
      'https://car.example.app',
      'http://192.168.0.4:3000'
    ])
  })

  it('should fall back to the dev origins', () => {
    expect(envSchema.parse(required).CORS_ORIGINS).toContain(
      'http://localhost:3000'
    )
    expect(
      envSchema.parse({ ...required, CORS_ORIGINS: '' }).CORS_ORIGINS
    ).toContain('http://localhost:3000')
  })
})
