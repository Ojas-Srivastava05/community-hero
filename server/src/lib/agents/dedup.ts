import ngeohash from 'ngeohash'
import { db } from '../firebase-admin'
import { haversineKm } from '../geo'
import {
  cosineSimilarity,
  generateEmbedding,
  isDuplicateMatch,
  issueEmbeddingText,
  type DuplicateCandidate,
} from '../embeddings'
import type { Category } from '../../types/shared'
import type { DedupResult } from './types'

/** Agent 3 — DedupAgent: geohash proximity + embedding cosine similarity */
export async function runDedupAgent(
  lat: number,
  lng: number,
  category: Category,
  textForEmbedding: string,
  precomputedEmbedding?: number[],
  excludeId?: string,
): Promise<DedupResult> {
  const geohash = ngeohash.encode(lat, lng, 7)
  const embedding = precomputedEmbedding ?? (await generateEmbedding(textForEmbedding))
  const duplicates = await findDuplicates(lat, lng, category, embedding, excludeId)

  return { geohash, embedding, duplicates }
}

async function findDuplicates(
  lat: number,
  lng: number,
  category: string,
  embedding: number[],
  excludeId?: string,
): Promise<DuplicateCandidate[]> {
  try {
    const center = ngeohash.encode(lat, lng, 6)
    const snap = await db
      .collection('issues')
      .where('category', '==', category)
      .where('geohash', '>=', center)
      .where('geohash', '<=', center + '\uf8ff')
      .limit(25)
      .get()

    const results: DuplicateCandidate[] = []

    for (const doc of snap.docs) {
      if (excludeId && doc.id === excludeId) continue
      const data = doc.data()
      if (data.status === 'Closed' || data.mergedInto) continue

      const distKm = haversineKm(lat, lng, data.lat, data.lng)
      const stored = data.embedding as number[] | undefined
      const similarity = stored?.length
        ? cosineSimilarity(embedding, stored)
        : cosineSimilarity(
            embedding,
            await generateEmbedding(
              issueEmbeddingText(data.title || '', data.description || '', data.category || category),
            ),
          )

      if (isDuplicateMatch(similarity, distKm)) {
        results.push({
          id: doc.id,
          title: data.title || 'Untitled',
          similarity: Math.round(similarity * 1000) / 1000,
          distanceM: Math.round(distKm * 1000),
        })
      }
    }

    return results.sort((a, b) => b.similarity - a.similarity).slice(0, 5)
  } catch {
    return []
  }
}
