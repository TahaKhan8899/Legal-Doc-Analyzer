import { NextRequest, NextResponse } from 'next/server';
import { getDocMetadata } from '@/lib/storage';
import { isDocIndexed } from '@/lib/vector-store';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ docId: string }> }
) {
    const { docId } = await params;
    const metadata = await getDocMetadata(docId);

    if (!metadata) {
        return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({
        ...metadata,
        isIndexed: isDocIndexed(docId)
    });
}
