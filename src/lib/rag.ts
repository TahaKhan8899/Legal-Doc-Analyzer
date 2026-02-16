import { DocumentChunk } from '@/types';
import { createEmbedding } from './openai';

export function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    let dotProduct = 0;
    let mA = 0;
    let mB = 0;
    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        mA += a[i] * a[i];
        mB += b[i] * b[i];
    }
    return dotProduct / (Math.sqrt(mA) * Math.sqrt(mB));
}

export function searchChunks(queryVector: number[], chunks: DocumentChunk[], chunkVectors: number[][], topK: number = 6): DocumentChunk[] {
    // If API key is missing, vectors will be all zeros. Do keyword fallback.
    const isMock = queryVector.every(v => v === 0);

    if (isMock) {
        // Simple keyword scoring fallback
        return chunks.slice(0, topK); // Just return first few for now as simple mock
    }

    const scores = chunkVectors.map((v, i) => ({
        chunk: chunks[i],
        score: cosineSimilarity(queryVector, v)
    }));

    return scores
        .sort((a, b) => b.score - a.score)
        .slice(0, topK)
        .map(s => s.chunk);
}

// Simple query cache to avoid repeated embedding calls for same query in same doc
const queryCache = new Map<string, Map<string, number[]>>();

export async function getQueryEmbedding(docId: string, query: string): Promise<number[]> {
    if (!queryCache.has(docId)) {
        queryCache.set(docId, new Map());
    }
    const docCache = queryCache.get(docId)!;
    if (docCache.has(query)) {
        return docCache.get(query)!;
    }

    const embedding = await createEmbedding(query);
    docCache.set(query, embedding);
    return embedding;
}
