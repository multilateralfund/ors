import { z } from 'zod'

const envSchema = z.object({
  apiBaseUrl: z.string(),
  enableMocks: z.union([z.literal('TRUE'), z.literal('FALSE')]),
})

export type Env = z.infer<typeof envSchema>

export const env: Env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
  enableMocks: import.meta.env.VITE_ENABLE_MOCKS as 'TRUE' | 'FALSE',
} as const

envSchema.parse(env)
