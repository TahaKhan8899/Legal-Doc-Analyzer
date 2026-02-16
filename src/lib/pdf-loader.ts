// @ts-ignore
const pdf = require('pdf-parse');
import { DocumentChunk } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export async function extractTextFromPdf(buffer: Buffer): Promise<{ text: string, pages: number }> {
    const data = await pdf(buffer);
    return {
        text: data.text,
        pages: data.numpages
    };
}

export function chunkText(text: string, size: number = 1200, overlap: number = 200, maxChunks: number = 80): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    let start = 0;

    // Clean up text: replace multiple newlines/spaces with single ones
    const cleanText = text.replace(/\s+/g, ' ').trim();

    while (start < cleanText.length && chunks.length < maxChunks) {
        let end = start + size;

        // Try to find a good breaking point (period or newline) if possible
        if (end < cleanText.length) {
            const lastPeriod = cleanText.lastIndexOf('. ', end);
            if (lastPeriod > start + (size / 2)) {
                end = lastPeriod + 1;
            }
        }

        const chunkText = cleanText.substring(start, end).trim();
        if (chunkText) {
            chunks.push({
                id: uuidv4(),
                page: null, // pdf-parse doesn't reliably give page per chunk easily without more complex parsing
                text: chunkText
            });
        }

        start = end - overlap;
        if (start < 0) start = 0;
        if (start >= cleanText.length) break;
    }

    return chunks;
}
