import { z } from 'zod'

const envSchema = z.object({
  apiBaseUrl: z.string(),
})

export type Env = z.infer<typeof envSchema>

export const env: Env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/',
} as const

envSchema.parse(env)
