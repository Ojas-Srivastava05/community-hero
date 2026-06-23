export const CATEGORIES = [
  'pothole',
  'water_leak',
  'streetlight',
  'waste',
  'road_damage',
  'drainage',
  'signage',
  'encroachment',
  'other',
] as const

export type Category = (typeof CATEGORIES)[number]

export const STATUSES = [
  'Draft',
  'Submitted',
  'Community Verified',
  'Assigned',
  'In Progress',
  'Resolved',
  'Closed',
] as const

export type IssueStatus = (typeof STATUSES)[number]

export type IssueAnalysis = {
  category: Category
  severity: number
  title: string
  description: string
  department: string
  safety_risk: boolean
  confidence: number
  estimated_fix_days?: string
}

export type Issue = {
  id: string
  title: string
  description: string
  category: Category
  severity: number
  status: IssueStatus
  lat: number
  lng: number
  address?: string
  geohash?: string
  wardId?: string
  imageUrls: string[]
  reporterId: string
  reporterEmail?: string
  departmentId?: string
  upvoteCount: number
  verificationLevel: number
  priorityScore?: number
  slaDeadline?: string
  aiMetadata?: Record<string, unknown>
  createdAt: string
  updatedAt: string
  resolvedAt?: string
  proofImageUrl?: string
  mergedInto?: string
}

export const DEPARTMENTS: Record<Category, { name: string; slaHours: Record<number, number> }> = {
  pothole: { name: 'Roads & Infrastructure', slaHours: { 1: 168, 2: 120, 3: 96, 4: 72, 5: 48 } },
  water_leak: { name: 'Water Board', slaHours: { 1: 120, 2: 96, 3: 72, 4: 48, 5: 24 } },
  streetlight: { name: 'Electrical', slaHours: { 1: 96, 2: 72, 3: 48, 4: 36, 5: 24 } },
  waste: { name: 'Sanitation', slaHours: { 1: 72, 2: 48, 3: 36, 4: 24, 5: 12 } },
  road_damage: { name: 'Roads & Infrastructure', slaHours: { 1: 168, 2: 120, 3: 96, 4: 72, 5: 48 } },
  drainage: { name: 'Stormwater', slaHours: { 1: 120, 2: 96, 3: 72, 4: 48, 5: 24 } },
  signage: { name: 'Traffic & Signage', slaHours: { 1: 96, 2: 72, 3: 48, 4: 36, 5: 24 } },
  encroachment: { name: 'Enforcement', slaHours: { 1: 168, 2: 120, 3: 96, 4: 72, 5: 48 } },
  other: { name: 'General Civic', slaHours: { 1: 168, 2: 120, 3: 96, 4: 72, 5: 48 } },
}
