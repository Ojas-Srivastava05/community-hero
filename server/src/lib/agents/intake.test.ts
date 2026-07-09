import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { runIntakeAgent } from './intake'

const dummyImage = Buffer.alloc(2048, 1)

describe('runIntakeAgent — civic context keyword gate', () => {
  it('does not block waste reports when description mentions food', async () => {
    const result = await runIntakeAgent(
      dummyImage,
      'food waste and containers',
      'Garbage pile',
      'Large accumulation of food waste and plastic near the road',
      'waste',
    )
    assert.equal(result.ok, true)
    assert.equal(result.isCivic, true)
  })

  it('blocks hard non-civic keywords regardless of context', async () => {
    const result = await runIntakeAgent(
      dummyImage,
      'explicit gambling content',
      'Spam',
      'nude gambling advertisement',
    )
    assert.equal(result.ok, false)
    assert.match(result.reason || '', /Non-civic content detected/)
  })

  it('blocks soft keywords when there is no civic context', async () => {
    const result = await runIntakeAgent(dummyImage, 'my selfie portrait', 'Photo', 'Just a selfie')
    assert.equal(result.ok, false)
    assert.match(result.reason || '', /selfie|portrait/)
  })
})
