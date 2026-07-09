import { DEPARTMENTS, type Category, type Issue } from '../../../shared/types'
import { categoryLabel } from './issue-ui'

/** Demo BBMP-style inboxes — finals-ready mailto targets. */
export function departmentContact(issue: Issue): { name: string; email: string } {
  const cat = issue.category as Category
  const dept = DEPARTMENTS[cat]
  return {
    name: issue.departmentId || dept?.name || 'Municipal Authority',
    email: dept?.contactEmail || 'general-civic@bbmp.gov.in',
  }
}

export function buildComplaintDraft(issue: Issue, publicUrl?: string): {
  to: string
  subject: string
  body: string
  mailtoHref: string
  whatsappHref: string
} {
  const { name, email } = departmentContact(issue)
  const url = publicUrl || (typeof window !== 'undefined' ? window.location.href : '')
  const subject = `[Community Hero] ${categoryLabel(issue.category)} — ${issue.title.slice(0, 80)}`
  const body = [
    `To: ${name}`,
    `Re: Formal civic complaint — Community Hero ticket ${issue.id.slice(0, 10)}`,
    '',
    'Respected Sir/Madam,',
    '',
    'I am writing to formally escalate the following civic issue reported via Community Hero (CIVICPULSE AI):',
    '',
    `Title: ${issue.title}`,
    `Category: ${categoryLabel(issue.category)}`,
    `Severity: ${issue.severity}/5`,
    `Status: ${issue.status}`,
    `Location: ${issue.address || `${issue.lat.toFixed(5)}, ${issue.lng.toFixed(5)}`}`,
    issue.wardId ? `Ward: ${issue.wardId}` : null,
    `Community boosts: ${issue.upvoteCount} (verification tier ${issue.verificationLevel})`,
    issue.priorityScore != null ? `AI priority score: ${issue.priorityScore}` : null,
    issue.slaDeadline ? `SLA deadline: ${issue.slaDeadline}` : null,
    '',
    'Description:',
    issue.description,
    '',
    url ? `Live ticket: ${url}` : null,
    '',
    'Kindly acknowledge and take necessary action under the applicable municipal SLA.',
    '',
    'Regards,',
    'Community Hero citizen reporter',
  ]
    .filter((line) => line !== null)
    .join('\n')

  const mailtoHref = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(`${subject}\n\n${body}`)}`

  return { to: email, subject, body, mailtoHref, whatsappHref }
}

export async function copyComplaintDraft(issue: Issue): Promise<void> {
  const { subject, body, to } = buildComplaintDraft(issue)
  const text = `To: ${to}\nSubject: ${subject}\n\n${body}`
  await navigator.clipboard.writeText(text)
}
