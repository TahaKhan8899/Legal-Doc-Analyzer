import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import { saveDocMetadata, getUploadPath } from '@/lib/storage';
import { extractTextFromPdf, chunkText } from '@/lib/pdf-loader';
import { createEmbeddings } from '@/lib/openai';
import { saveDocToMemory } from '@/lib/vector-store';
import { DocumentState, DocIndex } from '@/types';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const docId = uuidv4();
        const buffer = Buffer.from(await file.arrayBuffer());

        // 1. Save PDF
        const uploadPath = await getUploadPath(docId);
        await fs.writeFile(uploadPath, buffer);

        // 2. Extract & Chunk
        const { text } = await extractTextFromPdf(buffer);
        const chunks = chunkText(text);

        // 3. Embed
        const chunkTexts = chunks.map(c => c.text);
        const vectors = await createEmbeddings(chunkTexts);

        // 4. Save to Disk
        const state: DocumentState = {
            docId,
            filename: file.name,
            createdAt: Date.now(),
            chunks,
            chatHistory: []
        };
        await saveDocMetadata(docId, state);

        // 5. Save to Memory
        const index: DocIndex = {
            ...state,
            vectors
        };
        saveDocToMemory(docId, index);

        return NextResponse.json({ docId });
    } catch (error: any) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
