export {
  CONFIDENCE_THRESHOLD,
  type ProofComparison,
  type AgentStepStatus,
  type AgentStep,
} from './constants'

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
  slaBreached?: boolean
  aiMetadata?: Record<string, unknown>
  createdAt: string
  updatedAt: string
  resolvedAt?: string
  proofImageUrl?: string
  mergedInto?: string
  isDemo?: boolean
}

/** Appendix M — Open311 GeoReport v2 service codes */
export const OPEN311_SERVICE_CODES: Record<Category, string> = {
  pothole: '001',
  road_damage: '002',
  water_leak: '010',
  drainage: '011',
  streetlight: '020',
  waste: '030',
  signage: '040',
  encroachment: '050',
  other: '099',
}

export const DEPARTMENTS: Record<
  Category,
  { name: string; contactEmail: string; slaHours: Record<number, number> }
> = {
  pothole: {
    name: 'Roads & Infrastructure',
    contactEmail: 'roads-infrastructure@bbmp.gov.in',
    slaHours: { 1: 168, 2: 120, 3: 96, 4: 72, 5: 48 },
  },
  water_leak: {
    name: 'Water Board',
    contactEmail: 'water-board@bbmp.gov.in',
    slaHours: { 1: 120, 2: 96, 3: 72, 4: 48, 5: 24 },
  },
  streetlight: {
    name: 'Electrical',
    contactEmail: 'electrical@bbmp.gov.in',
    slaHours: { 1: 96, 2: 72, 3: 48, 4: 36, 5: 24 },
  },
  waste: {
    name: 'Sanitation',
    contactEmail: 'sanitation@bbmp.gov.in',
    slaHours: { 1: 72, 2: 48, 3: 36, 4: 24, 5: 12 },
  },
  road_damage: {
    name: 'Roads & Infrastructure',
    contactEmail: 'roads-infrastructure@bbmp.gov.in',
    slaHours: { 1: 168, 2: 120, 3: 96, 4: 72, 5: 48 },
  },
  drainage: {
    name: 'Stormwater',
    contactEmail: 'stormwater@bbmp.gov.in',
    slaHours: { 1: 120, 2: 96, 3: 72, 4: 48, 5: 24 },
  },
  signage: {
    name: 'Traffic & Signage',
    contactEmail: 'traffic-signage@bbmp.gov.in',
    slaHours: { 1: 96, 2: 72, 3: 48, 4: 36, 5: 24 },
  },
  encroachment: {
    name: 'Enforcement',
    contactEmail: 'enforcement@bbmp.gov.in',
    slaHours: { 1: 168, 2: 120, 3: 96, 4: 72, 5: 48 },
  },
  other: {
    name: 'General Civic',
    contactEmail: 'general-civic@bbmp.gov.in',
    slaHours: { 1: 168, 2: 120, 3: 96, 4: 72, 5: 48 },
  },
}
