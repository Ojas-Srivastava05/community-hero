import { Router } from 'express'
import { CATEGORIES, DEPARTMENTS, OPEN311_SERVICE_CODES } from '../types/shared'

export const departmentsRouter = Router()

departmentsRouter.get('/', (_req, res) => {
  const services = CATEGORIES.map((category) => {
    const dept = DEPARTMENTS[category]
    return {
      service_code: OPEN311_SERVICE_CODES[category],
      service_name: category.replace(/_/g, ' '),
      description: `${dept.name} — ${category.replace(/_/g, ' ')}`,
      metadata: {
        category,
        department: dept.name,
        contact_email: dept.contactEmail,
        sla_hours: dept.slaHours,
      },
    }
  })
  res.json({ services })
})
