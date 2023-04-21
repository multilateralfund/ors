import * as z from 'zod'

export type IUser = {
  email: string
  first_name: string
  last_name: string
  username: string
}

export const authSchema = z.object({
  username: z.string(),
  password: z.string().min(6),
})

export type AuthFormValues = z.infer<typeof authSchema>
