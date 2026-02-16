import { NextRequest, NextResponse } from 'next/server';
import { getDocMetadata, saveDocMetadata } from '@/lib/storage';
import { getChatResponse } from '@/lib/openai';
import { getDocFromMemory, saveDocToMemory } from '@/lib/vector-store';
import { getQueryEmbedding, searchChunks } from '@/lib/rag';
import { ChatMessage } from '@/types';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ docId: string }> }
) {
    const { docId } = await params;
    const { message } = await req.json();

    if (!message) {
        return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const memoryDoc = getDocFromMemory(docId);
    if (!memoryDoc) {
        return NextResponse.json({ error: 'Index not found in memory. Please re-index.' }, { status: 412 });
    }

    // 1. RAG Retrieve
    const queryVector = await getQueryEmbedding(docId, message);
    const contextChunks = searchChunks(queryVector, memoryDoc.chunks, memoryDoc.vectors);

    // 2. Chat Completion
    const { answer, citations } = await getChatResponse(message, contextChunks, memoryDoc.chatHistory);

    // 3. Update History
    const userMsg: ChatMessage = { role: 'user', content: message };
    const assistantMsg: ChatMessage = { role: 'assistant', content: answer, citations };

    memoryDoc.chatHistory.push(userMsg, assistantMsg);
    saveDocToMemory(docId, memoryDoc);

    // 4. Persist history to disk
    const metadata = await getDocMetadata(docId);
    if (metadata) {
        metadata.chatHistory = memoryDoc.chatHistory;
        await saveDocMetadata(docId, metadata);
    }

    return NextResponse.json(assistantMsg);
}
