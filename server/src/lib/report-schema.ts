import { z } from 'zod'
import { CATEGORIES } from '../types/shared'

const boolish = z.union([z.boolean(), z.string().transform((s) => s === 'true' || s === '1')])

export const createReportSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(3),
  category: z.enum(CATEGORIES),
  severity: z.coerce.number().min(1).max(5),
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  address: z.string().optional(),
  mergeIntoId: z.string().optional(),
  confidence: z.coerce.number().min(0).max(1).optional(),
  safety_risk: boolish.optional(),
  department: z.string().optional(),
  ai_analyzed: boolish.optional(),
  analysis: z.string().optional(),
})

export type CreateReportInput = z.infer<typeof createReportSchema>
