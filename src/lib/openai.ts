import OpenAI from 'openai';
import { RiskReport, DocumentChunk, ChatMessage } from '@/types';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'missing-key',
});

const isKeyConfigured = () => !!process.env.OPENAI_API_KEY;

export async function createEmbeddings(texts: string[]): Promise<number[][]> {
    if (!isKeyConfigured()) {
        // Fallback: Return dummy embeddings (zeros) if key is missing
        // We'll handle retrieval fallback separately via keyword matching
        return texts.map(() => new Array(1536).fill(0));
    }

    const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: texts,
    });

    return response.data.map((d) => d.embedding);
}

export async function createEmbedding(text: string): Promise<number[]> {
    const result = await createEmbeddings([text]);
    return result[0];
}

export async function generateRiskReport(docText: string, chunks: DocumentChunk[]): Promise<RiskReport> {
    if (!isKeyConfigured()) {
        return getMockReport();
    }

    // Use the first 40 chunks for the report generation to stay within context limits while being thorough
    const contextText = chunks.slice(0, 40).map(c => `[ID:${c.id}] ${c.text}`).join('\n\n');

    const prompt = `
    You are a legal expert AI. Analyze the following document segments and provide a structured risk report.
    For each red flag or key clause, you MUST provide "evidence" with the exact "chunk_id" and a "quote".
    
    Document Segments:
    ${contextText}

    Output EXACTLY in the following JSON format:
    {
      "document_summary": "...",
      "risk_score": 0-100,
      "top_red_flags": [{ "title": "...", "severity": "low|medium|high|critical", "clause_type": "...", "why_it_matters": "...", "evidence": [{"chunk_id": "...", "quote": "...", "page": null}], "suggested_action": "..." }],
      "key_clauses": [{ "clause_type": "...", "summary": "...", "friendly_explanation": "...", "risk_notes": "...", "evidence": [{"chunk_id": "...", "quote": "...", "page": null}] }],
      "missing_or_ambiguous": ["..."],
      "negotiation_questions": ["..."]
    }
  `;

    const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
            { role: 'system', content: 'You are a senior legal counsel. Output only raw JSON.' },
            { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' }
    });

    const content = response.choices[0].message.content;
    return JSON.parse(content || '{}') as RiskReport;
}

export async function getChatResponse(
    query: string,
    contextChunks: DocumentChunk[],
    chatHistory: ChatMessage[]
): Promise<{ answer: string; citations: any[] }> {
    if (!isKeyConfigured()) {
        return {
            answer: "OpenAI API Key is missing. I'm operating in mock mode. This contract looks standard but check termination clauses.",
            citations: contextChunks.slice(0, 2).map(c => ({ chunk_id: c.id, snippet: c.text.substring(0, 100) + '...' }))
        };
    }

    const context = contextChunks.map(c => `[ID:${c.id}] ${c.text}`).join('\n\n');

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: 'system', content: 'You are a legal assistant. Answer ONLY using the provided context. If the answer is not in the context, say "I couldn’t find that in the document." Always cite your sources using the chunk ID in your thought process. Output your final response in JSON format.' },
        ...chatHistory.map(m => ({ role: m.role, content: m.content }) as OpenAI.Chat.ChatCompletionMessageParam),
        { role: 'user', content: `Context:\n${context}\n\nQuestion: ${query}` }
    ];

    const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
        response_format: { type: 'json_object' },
        functions: [
            {
                name: "formatted_response",
                parameters: {
                    type: "object",
                    properties: {
                        answer: { type: "string" },
                        citations: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    chunk_id: { type: "string" },
                                    snippet: { type: "string" }
                                }
                            }
                        }
                    },
                    required: ["answer", "citations"]
                }
            }
        ],
        function_call: { name: "formatted_response" }
    });

    const call = response.choices[0].message.function_call;
    return JSON.parse(call?.arguments || '{"answer": "Error generating response", "citations": []}');
}

function getMockReport(): RiskReport {
    return {
        document_summary: "A standard legal agreement (MOCK DATA - No API Key).",
        risk_score: 45,
        top_red_flags: [
            {
                title: "Auto-renewal Clause",
                severity: "medium",
                clause_type: "Termination",
                why_it_matters: "You might be locked in for another year if you don't cancel manually.",
                evidence: [],
                suggested_action: "Set a reminder to review 60 days before expiration."
            }
        ],
        key_clauses: [
            {
                clause_type: "Confidentiality",
                summary: "Standard NDA language.",
                friendly_explanation: "Don't talk about the deal with outsiders.",
                risk_notes: "Mutual protection is good.",
                evidence: []
            }
        ],
        missing_or_ambiguous: ["Force Majeure not explicitly defined."],
        negotiation_questions: ["Can we cap the liability at 1x contract value?"]
    };
}
