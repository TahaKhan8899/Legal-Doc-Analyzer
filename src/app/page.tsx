'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { toast } from 'sonner';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string>('');
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.type !== 'application/pdf') {
        toast.error('Please upload a PDF file');
        return;
      }
      if (selected.size > 10 * 1024 * 1024) {
        toast.error('File size exceeds 10MB limit');
        return;
      }
      setFile(selected);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(10);
    setStatus('Uploading document...');

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Simulate step progress for better UI experience
      const progressSteps = [
        { p: 25, s: 'Extracting text...' },
        { p: 50, s: 'Splitting into semantic chunks...' },
        { p: 75, s: 'Generating embeddings...' },
        { p: 90, s: 'Finalizing index...' }
      ];

      let stepIdx = 0;
      const interval = setInterval(() => {
        if (stepIdx < progressSteps.length) {
          setProgress(progressSteps[stepIdx].p);
          setStatus(progressSteps[stepIdx].s);
          stepIdx++;
        } else {
          clearInterval(interval);
        }
      }, 800);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(interval);

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Upload failed');
      }

      const { docId } = await res.json();
      setProgress(100);
      setStatus('Ready!');
      toast.success('Document processed successfully');

      setTimeout(() => {
        router.push(`/doc/${docId}`);
      }, 500);

    } catch (error: any) {
      toast.error(error.message);
      setUploading(false);
      setProgress(0);
      setStatus('');
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex flex-col items-center justify-center p-6">
      {/* Disclaimer Banner */}
      <div className="fixed top-0 left-0 right-0 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900 py-2 px-4 text-center text-xs font-medium text-amber-800 dark:text-amber-400 z-50">
        <Info className="inline-block w-3 h-3 mr-1 mb-0.5" />
        DEMO MODE: In-memory index resets on restart. For informational purposes only. Not legal advice.
      </div>

      <div className="max-w-2xl w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 sm:text-5xl">
            Legal <span className="text-primary bg-primary/10 px-2 rounded-lg">Doc</span> Analyzer
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Intelligent risk assessment and RAG-powered legal chat.
          </p>
        </div>

        <Card className="border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm shadow-xl overflow-hidden">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl">Upload Contract</CardTitle>
            <CardDescription>Drag and drop or click to browse (Max 10MB)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 flex flex-col items-center py-8">
            {!uploading ? (
              <>
                <div
                  className={`w-full h-48 rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all cursor-pointer ${file ? 'border-primary bg-primary/5' : 'border-slate-300 dark:border-slate-700 hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    accept="application/pdf"
                    onChange={handleFileChange}
                  />
                  {file ? (
                    <div className="flex flex-col items-center text-center p-4">
                      <div className="bg-primary/10 p-3 rounded-full mb-3">
                        <FileText className="w-10 h-10 text-primary" />
                      </div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100 truncate max-w-xs">{file.name}</p>
                      <p className="text-xs text-slate-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-slate-400">
                      <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-full mb-3">
                        <Upload className="w-10 h-10" />
                      </div>
                      <p className="text-sm font-medium">Click to select PDF file</p>
                    </div>
                  )}
                </div>

                <Button
                  disabled={!file}
                  onClick={handleUpload}
                  className="w-full h-12 text-lg font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-50 dark:hover:bg-slate-200 dark:text-slate-900"
                >
                  Analyze Document
                </Button>
              </>
            ) : (
              <div className="w-full space-y-6 py-4 animate-in fade-in duration-500">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="relative h-16 w-16">
                    <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-slate-800"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-xl text-slate-900 dark:text-slate-50">{status}</p>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Processing usually takes less than 30 seconds</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 px-1">
                    <span>Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-3 rounded-full bg-slate-100 dark:bg-slate-800" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="p-4 space-y-1">
            <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" />
            <h3 className="font-bold text-sm">Instant Risk Analysis</h3>
            <p className="text-xs text-slate-500">Red flag detection using specialized legal AI logic.</p>
          </div>
          <div className="p-4 space-y-1">
            <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" />
            <h3 className="font-bold text-sm">Grounded Chat</h3>
            <p className="text-xs text-slate-500">Ask questions and see exact cited sentences from the file.</p>
          </div>
          <div className="p-4 space-y-1">
            <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" />
            <h3 className="font-bold text-sm">Privacy Focused</h3>
            <p className="text-xs text-slate-500">In-memory indexing ensures data is ephemeral for the session.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
