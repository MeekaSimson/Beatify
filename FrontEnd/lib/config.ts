import { z } from "zod"

const configSchema = z.object({
  siteName: z.string().default("Beatify"),
  aiServiceUrl: z.string().url().optional(),
  adminKey: z.string().optional(),
})

const config = configSchema.parse({
  siteName: process.env.NEXT_PUBLIC_SITE_NAME || "Beatify",
  aiServiceUrl: process.env.AI_SERVICE_URL,
  adminKey: process.env.NEXT_PUBLIC_ADMIN_KEY,
})

export default config
