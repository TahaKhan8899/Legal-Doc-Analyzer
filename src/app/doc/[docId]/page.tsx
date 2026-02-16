'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
    FileText, MessageSquare, ShieldAlert, ArrowLeft,
    ChevronRight, ExternalLink, Send, Info, AlertTriangle,
    CheckCircle2, Loader2, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { DocumentState, RiskReport, ChatMessage } from '@/types';

export default function DocumentPage() {
    const { docId } = useParams();
    const router = useRouter();
    const [doc, setDoc] = useState<DocumentState | null>(null);
    const [isIndexed, setIsIndexed] = useState(true);
    const [loading, setLoading] = useState(true);
    const [generatingReport, setGeneratingReport] = useState(false);
    const [chatInput, setChatInput] = useState('');
    const [sendingMsg, setSendingMsg] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchDoc();
    }, [docId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [doc?.chatHistory]);

    const fetchDoc = async () => {
        try {
            const res = await fetch(`/api/doc/${docId}`);
            if (!res.ok) throw new Error('Document not found');
            const data = await res.json();
            setDoc(data);
            setIsIndexed(data.isIndexed);
            setLoading(false);
        } catch (error) {
            toast.error('Error loading document');
            router.push('/');
        }
    };

    const generateReport = async () => {
        setGeneratingReport(true);
        try {
            const res = await fetch(`/api/doc/${docId}/report`, { method: 'POST' });
            if (!res.ok) throw new Error('Failed to generate report');
            const report = await res.json();
            setDoc(prev => prev ? { ...prev, reportJson: report } : null);
            toast.success('Risk report generated');
        } catch (error) {
            toast.error('Error generating report');
        } finally {
            setGeneratingReport(false);
        }
    };

    const sendMessage = async () => {
        if (!chatInput.trim() || sendingMsg) return;

        const msg = chatInput;
        setChatInput('');
        setSendingMsg(true);

        // Optimistic update
        const tempUserMsg: ChatMessage = { role: 'user', content: msg };
        setDoc(prev => prev ? { ...prev, chatHistory: [...prev.chatHistory, tempUserMsg] } : null);

        try {
            const res = await fetch(`/api/doc/${docId}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: msg })
            });

            if (!res.ok) {
                if (res.status === 412) {
                    setIsIndexed(false);
                    throw new Error('Index lost from memory. Please re-index.');
                }
                throw new Error('Failed to send message');
            }

            const assistantMsg = await res.json();
            setDoc(prev => prev ? {
                ...prev,
                chatHistory: [...(prev.chatHistory.filter(m => m !== tempUserMsg)), tempUserMsg, assistantMsg]
            } : null);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setSendingMsg(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse">Loading workspace...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
            {/* Header */}
            <header className="h-16 border-b bg-white dark:bg-slate-900 px-6 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <div className="flex items-center space-x-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <Separator orientation="vertical" className="h-6" />
                    <div className="flex items-center space-x-2">
                        <FileText className="w-5 h-5 text-primary" />
                        <h1 className="font-bold text-slate-900 dark:text-slate-100 truncate max-w-[200px] sm:max-w-md">
                            {doc?.filename}
                        </h1>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    {!isIndexed && (
                        <Badge variant="destructive" className="hidden sm:flex items-center gap-1.5 animate-pulse uppercase tracking-widest text-[10px] py-1">
                            <RefreshCw className="w-3 h-3" /> Index Lost
                        </Badge>
                    )}
                    <Badge variant="outline" className="hidden sm:flex items-center gap-1.5 font-mono text-[10px] py-1 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        DEMO MODE: IN-MEMORY
                    </Badge>
                </div>
            </header>

            {/* Main Layout */}
            <main className="flex-1 flex overflow-hidden">
                {!isIndexed ? (
                    <div className="w-full h-full flex items-center justify-center p-6 text-center">
                        <Card className="max-w-md border-2 border-red-200 dark:border-red-900/30">
                            <CardHeader>
                                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-2" />
                                <CardTitle>Index Not Found</CardTitle>
                                <CardDescription>
                                    The server was restarted or the in-memory index expired.
                                    You need to re-upload the document to re-index it.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button className="w-full" onClick={() => router.push('/')}>
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Return to Upload
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 h-full overflow-hidden">
                        {/* Left Side: Report */}
                        <div className="border-r flex flex-col h-full bg-white dark:bg-slate-900/50">
                            <Tabs defaultValue="report" className="flex-1 flex flex-col overflow-hidden">
                                <div className="px-6 py-2 border-b flex items-center justify-between">
                                    <TabsList className="bg-slate-100 dark:bg-slate-800">
                                        <TabsTrigger value="report" className="gap-2">
                                            <ShieldAlert className="w-4 h-4" /> Risk Report
                                        </TabsTrigger>
                                        <TabsTrigger value="document" className="gap-2">
                                            <FileText className="w-4 h-4" /> Full Text
                                        </TabsTrigger>
                                    </TabsList>
                                    {doc?.reportJson && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-muted-foreground uppercase">Risk Score</span>
                                            <div className={`text-lg font-black ${doc.reportJson.risk_score > 70 ? 'text-red-500' : doc.reportJson.risk_score > 40 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                                {doc.reportJson.risk_score}/100
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <TabsContent value="report" className="flex-1 overflow-hidden m-0">
                                    {doc?.reportJson ? (
                                        <ScrollArea className="h-full px-6 py-6">
                                            <div className="space-y-8 pb-12">
                                                {/* Summary Section */}
                                                <section className="space-y-3">
                                                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Executive Summary</h3>
                                                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border">
                                                        {doc.reportJson.document_summary}
                                                    </p>
                                                </section>

                                                {/* Red Flags Section */}
                                                <section className="space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Critical Red Flags</h3>
                                                        <Badge variant="outline">{doc.reportJson.top_red_flags.length} Detected</Badge>
                                                    </div>
                                                    <div className="space-y-4">
                                                        {doc.reportJson.top_red_flags.map((flag, i) => (
                                                            <Card key={i} className="overflow-hidden border-l-4 border-l-red-500 shadow-sm hover:shadow-md transition-shadow">
                                                                <CardHeader className="pb-3 bg-red-50/50 dark:bg-red-950/20">
                                                                    <div className="flex justify-between items-start">
                                                                        <div className="space-y-1">
                                                                            <div className="flex items-center gap-2">
                                                                                <Badge
                                                                                    variant={flag.severity === 'critical' || flag.severity === 'high' ? 'destructive' : 'secondary'}
                                                                                    className="uppercase text-[9px] font-black"
                                                                                >
                                                                                    {flag.severity}
                                                                                </Badge>
                                                                                <span className="text-xs text-muted-foreground font-medium uppercase">{flag.clause_type}</span>
                                                                            </div>
                                                                            <CardTitle className="text-lg">{flag.title}</CardTitle>
                                                                        </div>
                                                                    </div>
                                                                </CardHeader>
                                                                <CardContent className="space-y-4 pt-4">
                                                                    <div className="space-y-2">
                                                                        <p className="text-sm font-semibold">Why it matters:</p>
                                                                        <p className="text-sm text-slate-600 dark:text-slate-400">{flag.why_it_matters}</p>
                                                                    </div>
                                                                    {flag.evidence.length > 0 && (
                                                                        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                                                                            <p className="text-[10px] font-bold uppercase text-slate-400 mb-2">Evidence from contract:</p>
                                                                            <p className="text-sm italic text-slate-700 dark:text-slate-200">"{flag.evidence[0].quote}"</p>
                                                                        </div>
                                                                    )}
                                                                    <div className="pt-2">
                                                                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 uppercase">
                                                                            <CheckCircle2 className="w-3 h-3" /> Suggested Action
                                                                        </p>
                                                                        <p className="text-sm mt-1">{flag.suggested_action}</p>
                                                                    </div>
                                                                </CardContent>
                                                            </Card>
                                                        ))}
                                                    </div>
                                                </section>

                                                {/* Key Clauses */}
                                                <section className="space-y-4">
                                                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Key Clauses Breakdown</h3>
                                                    <div className="grid grid-cols-1 gap-4">
                                                        {doc.reportJson.key_clauses.map((clause, i) => (
                                                            <div key={i} className="p-4 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 space-y-3">
                                                                <div className="flex justify-between items-center">
                                                                    <Badge variant="outline" className="font-bold underline decoration-primary decoration-2 underline-offset-4">{clause.clause_type}</Badge>
                                                                    <span className="text-[10px] font-medium text-muted-foreground">CLICK TO LOCATE</span>
                                                                </div>
                                                                <p className="text-sm font-medium">{clause.summary}</p>
                                                                <p className="text-xs text-slate-500 leading-relaxed italic border-l-2 pl-3">"{clause.friendly_explanation}"</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </section>

                                                {/* Negotiation Questions */}
                                                <section className="space-y-4 bg-primary/5 dark:bg-primary/10 p-6 rounded-2xl border border-primary/20">
                                                    <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                                                        <MessageSquare className="w-4 h-4" /> Negotiation Strategy
                                                    </h3>
                                                    <div className="space-y-3">
                                                        {doc.reportJson.negotiation_questions.map((q, i) => (
                                                            <div key={i} className="bg-white dark:bg-slate-800 p-3 rounded-lg text-sm border shadow-sm flex items-start gap-2">
                                                                <ChevronRight className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                                                                {q}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </section>
                                            </div>
                                        </ScrollArea>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center p-12 text-center space-y-6">
                                            <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                                                <ShieldAlert className="w-10 h-10 text-slate-400" />
                                            </div>
                                            <div className="space-y-2 max-w-sm">
                                                <h3 className="text-xl font-bold">No Risk Report Generated</h3>
                                                <p className="text-slate-500">Our AI will scan the entire document to detect red flags and summarize legal obligations.</p>
                                            </div>
                                            <Button
                                                className="h-12 px-8 text-lg font-bold shadow-lg"
                                                onClick={generateReport}
                                                disabled={generatingReport}
                                            >
                                                {generatingReport ? (
                                                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Analyzing Clauses...</>
                                                ) : (
                                                    "Generate Risk Report"
                                                )}
                                            </Button>
                                        </div>
                                    )}
                                </TabsContent>

                                <TabsContent value="document" className="flex-1 overflow-hidden m-0">
                                    <ScrollArea className="h-full">
                                        <div className="p-8 font-mono text-sm leading-relaxed text-slate-700 dark:text-slate-300 max-w-2xl mx-auto space-y-4">
                                            {doc?.chunks.map((chunk, i) => (
                                                <div key={chunk.id} id={`chunk-${chunk.id}`} className="group relative pr-12 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900 py-1">
                                                    <span className="absolute right-0 top-1 text-[10px] font-bold text-slate-300 group-hover:text-primary">#{i + 1}</span>
                                                    {chunk.text}
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </TabsContent>
                            </Tabs>
                        </div>

                        {/* Right Side: Chat */}
                        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
                            <div className="px-6 py-4 border-b bg-white dark:bg-slate-900 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <MessageSquare className="w-5 h-5 text-primary" />
                                    <h2 className="font-bold">Grounded Chat</h2>
                                </div>
                                <Badge variant="secondary" className="text-[10px]">RAG ACTIVE</Badge>
                            </div>

                            <ScrollArea className="flex-1 p-6" viewportRef={scrollRef}>
                                <div className="space-y-6 pb-4">
                                    {doc?.chatHistory.length === 0 && (
                                        <div className="text-center py-12 space-y-4 opacity-50">
                                            <div className="w-16 h-16 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto">
                                                <MessageSquare className="w-8 h-8" />
                                            </div>
                                            <div>
                                                <p className="font-bold">Chat with this contract</p>
                                                <p className="text-xs max-w-[200px] mx-auto">Ask about termination, liabilities, or specific obligations.</p>
                                            </div>
                                        </div>
                                    )}
                                    {doc?.chatHistory.map((m, i) => (
                                        <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                                            <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm ${m.role === 'user' ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-white dark:bg-slate-900 border shadow-sm'}`}>
                                                <p className="leading-relaxed whitespace-pre-line">{m.content}</p>

                                                {m.citations && m.citations.length > 0 && (
                                                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                                                        <p className="text-[10px] font-bold uppercase text-slate-400">Sources</p>
                                                        {m.citations.map((c, idx) => (
                                                            <div key={idx} className="group relative bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-200 dark:border-slate-700 cursor-help transition-all hover:bg-white dark:hover:bg-slate-800" title={c.snippet}>
                                                                <div className="flex justify-between items-center text-[10px] font-bold text-primary mb-1">
                                                                    <span>CHUNK {c.chunk_id.substring(0, 4).toUpperCase()}</span>
                                                                    <ExternalLink className="w-3 h-3" />
                                                                </div>
                                                                <p className="text-[11px] text-slate-500 line-clamp-2 italic italic">"{c.snippet}"</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {sendingMsg && (
                                        <div className="flex items-center space-x-2 text-primary animate-pulse py-2">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span className="text-xs font-bold uppercase tracking-widest leading-none">AI Scanning document...</span>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>

                            <div className="p-6 bg-white dark:bg-slate-900 border-t">
                                <div className="relative group">
                                    <textarea
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                sendMessage();
                                            }
                                        }}
                                        placeholder="Ask a question about the document..."
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 pr-14 text-sm focus:ring-2 ring-primary/20 min-h-[60px] max-h-[200px] resize-none transition-all shadow-inner"
                                    />
                                    <Button
                                        size="icon"
                                        className="absolute right-3 bottom-3 h-10 w-10 rounded-xl shadow-lg transition-transform active:scale-95 disabled:opacity-50"
                                        onClick={sendMessage}
                                        disabled={!chatInput.trim() || sendingMsg}
                                    >
                                        <Send className="w-5 h-5" />
                                    </Button>
                                </div>
                                <p className="mt-2 text-[10px] text-center text-slate-400 font-medium">
                                    AI results are grounded in the uploaded PDF. Check source citations for verification.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
