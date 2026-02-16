import fs from 'fs/promises';
import path from 'path';
import { DocumentState } from '@/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

export async function ensureDirs() {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
}

export async function saveDocMetadata(docId: string, state: DocumentState) {
    await ensureDirs();
    const filePath = path.join(DATA_DIR, `${docId}.json`);
    await fs.writeFile(filePath, JSON.stringify(state, null, 2));
}

export async function getDocMetadata(docId: string): Promise<DocumentState | null> {
    try {
        const filePath = path.join(DATA_DIR, `${docId}.json`);
        const content = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(content) as DocumentState;
    } catch (err) {
        return null;
    }
}

export async function getUploadPath(docId: string): Promise<string> {
    await ensureDirs();
    return path.join(UPLOADS_DIR, `${docId}.pdf`);
}

export async function getAllDocs(): Promise<DocumentState[]> {
    try {
        await ensureDirs();
        const files = await fs.readdir(DATA_DIR);
        const docs: DocumentState[] = [];
        for (const file of files) {
            if (file.endsWith('.json')) {
                const id = file.replace('.json', '');
                const meta = await getDocMetadata(id);
                if (meta) docs.push(meta);
            }
        }
        return docs.sort((a, b) => b.createdAt - a.createdAt);
    } catch (err) {
        return [];
    }
}
