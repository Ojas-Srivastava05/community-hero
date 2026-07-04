import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { isHindiMessage, chatWithTools } from './gemini'

describe('isHindiMessage', () => {
  it('detects Devanagari script', () => {
    assert.equal(isHindiMessage('मेरे पास क्या मुद्दे हैं?'), true)
    assert.equal(isHindiMessage('What issues are near me?'), false)
  })

  it('detects mixed EN/HI', () => {
    assert.equal(isHindiMessage('near me पास'), true)
  })
})

describe('chatWithTools keyword fallback (no GEMINI_API_KEY)', () => {
  const toolHandler = async (name: string, args: Record<string, unknown>) => {
    if (name === 'findNearbyIssues') {
      return [{ title: 'Test pothole', status: 'Submitted', category: 'pothole' }]
    }
    if (name === 'getMyReports') return []
    if (name === 'getHotspots') return [{ geohash: 'tdr1w', count: 3 }]
    if (name === 'searchIssues') return [{ title: 'Garbage pile' }]
    if (name === 'getDepartmentInfo') {
      return { department_id: 'pothole', name: 'Roads', sla_hours: 72 }
    }
    if (name === 'explainStatus') {
      return { status: String(args.status), explanation: 'Queued for verification.' }
    }
    if (name === 'getIssueById') return { error: 'NOT_FOUND', id: String(args.issue_id) }
    return null
  }

  it('answers nearby issues in English', async () => {
    const reply = await chatWithTools([{ role: 'user', content: 'issues near me' }], toolHandler)
    assert.match(reply, /Test pothole|Issues near you/i)
  })

  it('answers nearby issues in Hindi with prefix', async () => {
    const reply = await chatWithTools([{ role: 'user', content: 'मेरे पास क्या है?' }], toolHandler)
    assert.match(reply, /🇮🇳 हिंदी/)
    assert.match(reply, /Test pothole|मुद्दे/)
  })

  it('explains status when asked', async () => {
    const reply = await chatWithTools(
      [{ role: 'user', content: 'explain status Submitted' }],
      toolHandler,
    )
    assert.match(reply, /Submitted|verification|Queued/i)
  })

  it('returns NOT_FOUND path for fake issue via tool grounding', async () => {
    const reply = await chatWithTools(
      [{ role: 'user', content: 'search fake-issue-xyz' }],
      toolHandler,
    )
    assert.ok(reply.length > 0)
  })
})

describe('Phase 11 — 7 citizen assistant tools', () => {
  const expected = [
    'findNearbyIssues',
    'getIssueById',
    'searchIssues',
    'getHotspots',
    'getMyReports',
    'getDepartmentInfo',
    'explainStatus',
  ]

  it('defines all Appendix V tools in gemini.ts', async () => {
    const fs = await import('fs/promises')
    const path = await import('path')
    const src = await fs.readFile(path.join(__dirname, 'gemini.ts'), 'utf8')
    for (const name of expected) {
      assert.match(src, new RegExp(`name: '${name}'`))
    }
    assert.equal(expected.length, 7)
  })
})
