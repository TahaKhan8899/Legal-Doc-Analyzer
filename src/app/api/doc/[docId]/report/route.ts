import { NextRequest, NextResponse } from 'next/server';
import { getDocMetadata, saveDocMetadata } from '@/lib/storage';
import { generateRiskReport } from '@/lib/openai';
import { getDocFromMemory, saveDocToMemory } from '@/lib/vector-store';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ docId: string }> }
) {
    const { docId } = await params;
    const metadata = await getDocMetadata(docId);

    if (!metadata) {
        return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (metadata.reportJson) {
        return NextResponse.json(metadata.reportJson);
    }

    // Generate report using all chunks (capped at 80 in loader anyway)
    const report = await generateRiskReport("", metadata.chunks);

    // Persist to disk
    metadata.reportJson = report;
    await saveDocMetadata(docId, metadata);

    // Sync to memory if exists
    const memoryDoc = getDocFromMemory(docId);
    if (memoryDoc) {
        memoryDoc.reportJson = report;
        saveDocToMemory(docId, memoryDoc);
    }

    return NextResponse.json(report);
}
