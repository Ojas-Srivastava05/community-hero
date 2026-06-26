import { DEPARTMENTS, OPEN311_SERVICE_CODES, type Category } from '../types/shared'

const STATUS_MAP: Record<string, string> = {
  Draft: 'open',
  Submitted: 'open',
  'Community Verified': 'open',
  Assigned: 'open',
  'In Progress': 'open',
  Resolved: 'closed',
  Closed: 'closed',
}

export function toOpen311Record(id: string, data: Record<string, unknown>) {
  const category = (data.category as Category) || 'other'
  const dept = DEPARTMENTS[category] || DEPARTMENTS.other
  return {
    service_request_id: id,
    service_code: OPEN311_SERVICE_CODES[category] || OPEN311_SERVICE_CODES.other,
    service_name: String(data.category || 'other'),
    service_request_status: STATUS_MAP[String(data.status)] || 'open',
    description: data.description,
    lat: data.lat,
    long: data.lng,
    address_string: data.address,
    requested_datetime: data.createdAt,
    updated_datetime: data.updatedAt,
    media_url: Array.isArray(data.imageUrls) ? data.imageUrls[0] : undefined,
    agency_responsible: data.departmentId || dept.name,
  }
}
