import type { CommunicatorResult } from './types'

const HI_TEMPLATES: Record<string, string> = {
  Submitted: 'आपकी रिपोर्ट दर्ज हो गई है। हम जल्द ही इस पर कार्रवाई करेंगे।',
  'In Progress': 'आपकी समस्या पर काम चल रहा है। टीम साइट पर है।',
  Resolved: 'समस्या हल हो गई है। धन्यवाद!',
  Closed: 'यह रिपोर्ट बंद कर दी गई है।',
  Assigned: 'आपकी रिपोर्ट संबंधित विभाग को सौंप दी गई है।',
  'Community Verified': 'आपके पड़ोस ने इस समस्या की पुष्टि की है।',
}

const EN_TEMPLATES: Record<string, string> = {
  Submitted: 'Your report has been received and queued for review.',
  'In Progress': 'A crew is working on this issue.',
  Resolved: 'This issue has been marked resolved. Thank you for reporting!',
  Closed: 'This report has been closed.',
  Assigned: 'Your report has been assigned to the responsible department.',
  'Community Verified': 'Neighbors have confirmed this issue.',
}

/** Agent 5 — CitizenCommunicator: status narrative EN + HI template */
export async function runCitizenCommunicator(
  status: string,
  title: string,
  department?: string,
): Promise<CommunicatorResult> {
  const baseEn = EN_TEMPLATES[status] || `Status updated to ${status}.`
  const narrativeHi = HI_TEMPLATES[status] || `स्थिति: ${status}`

  let narrativeEn = `${baseEn} Issue: "${title}".`
  if (department) narrativeEn += ` Routed to ${department}.`

  if (process.env.GEMINI_API_KEY) {
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai')
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })
      const result = await model.generateContent(
        `Write one friendly sentence (max 25 words) telling a citizen their civic issue "${title}" is now "${status}". Department: ${department || 'civic services'}. Plain English only.`,
      )
      const text = result.response.text().trim()
      if (text.length > 10) narrativeEn = text
    } catch {
      /* keep template */
    }
  }

  return { narrativeEn, narrativeHi }
}
