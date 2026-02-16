import { DocIndex } from '@/types';

declare global {
    var __DOC_INDEX__: Map<string, DocIndex> | undefined;
}

if (!globalThis.__DOC_INDEX__) {
    globalThis.__DOC_INDEX__ = new Map<string, DocIndex>();
}

export const vectorStore = globalThis.__DOC_INDEX__;

// Helper to get from local disk metadata if memory index is lost
export function getDocFromMemory(docId: string): DocIndex | undefined {
    return vectorStore.get(docId);
}

export function saveDocToMemory(docId: string, doc: DocIndex) {
    vectorStore.set(docId, doc);
}

export function isDocIndexed(docId: string): boolean {
    return vectorStore.has(docId);
}
