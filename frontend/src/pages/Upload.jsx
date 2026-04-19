import React, { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../lib/api";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { UploadCloud, FileText, Loader2, ArrowLeft, ShieldCheck, Clock, BrainCircuit } from "lucide-react";

export default function Upload() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(""); // "uploading" | "analyzing"
  const [drag, setDrag] = useState(false);
  const inputRef = useRef();
  const navigate = useNavigate();

  const pickFile = (f) => {
    if (!f) return;
    const lc = f.name.toLowerCase();
    if (!lc.endsWith(".pdf") && !lc.endsWith(".docx")) { toast.error("Only PDF or DOCX"); return; }
    setFile(f);
  };

  const onDrop = (e) => {
    e.preventDefault(); setDrag(false);
    pickFile(e.dataTransfer.files?.[0]);
  };

  const handleSubmit = async () => {
    if (!file) { toast.error("Please choose a PDF or DOCX"); return; }
    setLoading(true); setStep("uploading");
    const fd = new FormData();
    fd.append("file", file);
    try {
      const up = await api.post("/resumes/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setStep("analyzing");
      toast.info("Resume uploaded. Analyzing with AI…");
      await api.post(`/resumes/${up.data.id}/analyze`);
      toast.success("Analysis complete");
      navigate(`/results/${up.data.id}`);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Upload failed");
      setLoading(false); setStep("");
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] relative" data-testid="upload-page">
      <Navbar />
      <div className="absolute inset-0 grid-lines opacity-40 pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-6 py-12 lg:py-16">
        <Link to="/dashboard" className="inline-flex items-center gap-2 eyebrow text-[#6B7280] hover:text-[#0055FF] mb-6"><ArrowLeft className="w-3 h-3" /> Back to Dashboard</Link>

        <div className="mb-10 animate-fade-up">
          <div className="eyebrow mb-2">Step 1 of 1</div>
          <h1 className="font-heading font-black text-5xl sm:text-6xl tracking-tighter text-[#0A192F]">Upload your resume</h1>
          <p className="text-[#6B7280] text-sm mt-3 max-w-xl">PDF or DOCX only, max 10MB. We extract text, run ATS scoring, and build your career map — in under 60 seconds.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 animate-fade-up" style={{ animationDelay: '80ms' }}>
            <div
              onDragOver={(e)=>{ e.preventDefault(); setDrag(true); }}
              onDragLeave={()=>setDrag(false)}
              onDrop={onDrop}
              onClick={()=>inputRef.current?.click()}
              className={`relative border-2 border-dashed p-12 text-center cursor-pointer transition ${drag ? 'border-[#0055FF] bg-[#0055FF]/5' : file ? 'border-[#34C759] bg-white' : 'border-[#0A192F] bg-white hover:bg-[#FAFAFA]'}`}
              data-testid="resume-upload-dropzone"
            >
              <input ref={inputRef} type="file" accept=".pdf,.docx" hidden onChange={(e)=>pickFile(e.target.files?.[0])} data-testid="resume-file-input" />
              {file ? (
                <div className="flex flex-col items-center animate-fade-up">
                  <div className="w-16 h-16 border border-[#34C759] flex items-center justify-center mb-4">
                    <FileText className="w-8 h-8 text-[#34C759]" strokeWidth={1.5} />
                  </div>
                  <div className="font-heading font-bold text-2xl tracking-tight">{file.name}</div>
                  <div className="text-xs text-[#6B7280] mt-2 font-mono">{(file.size/1024).toFixed(1)} KB · click to change</div>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 border border-[#0A192F] flex items-center justify-center mb-4">
                    <UploadCloud className="w-8 h-8 text-[#0A192F]" strokeWidth={1.5} />
                  </div>
                  <div className="font-heading font-bold text-2xl tracking-tight">Drop your resume here</div>
                  <div className="text-sm text-[#6B7280] mt-2">or click to browse</div>
                  <div className="flex gap-2 mt-5">
                    <span className="border border-[#E5E5E5] px-3 py-1 text-xs font-mono">.PDF</span>
                    <span className="border border-[#E5E5E5] px-3 py-1 text-xs font-mono">.DOCX</span>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center gap-3">
              <Button onClick={handleSubmit} disabled={!file || loading} className="btn-primary" data-testid="analyze-submit">
                {loading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {step === "uploading" ? "Uploading…" : "Analyzing with AI…"}</>) : "Analyze Resume"}
              </Button>
              {loading && step === "analyzing" && (
                <span className="text-xs text-[#6B7280] font-mono">This takes 20–40 seconds…</span>
              )}
            </div>

            {loading && (
              <div className="mt-6 space-y-2 animate-fade-up">
                <div className="flex items-center gap-3 text-sm">
                  <div className={`w-5 h-5 border flex items-center justify-center ${step === 'uploading' ? 'border-[#0055FF] bg-[#0055FF] text-white' : 'border-[#34C759] bg-[#34C759] text-white'}`}>✓</div>
                  <span className="font-medium">Uploading & extracting text</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className={`w-5 h-5 border flex items-center justify-center ${step === 'analyzing' ? 'border-[#0055FF] bg-[#0055FF] text-white animate-pulse' : 'border-[#E5E5E5] text-[#6B7280]'}`}>{step === 'analyzing' ? '•' : '2'}</div>
                  <span className="font-medium">Running Claude AI analysis</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-5 h-5 border border-[#E5E5E5] text-[#6B7280] flex items-center justify-center">3</div>
                  <span className="font-medium">Building your career map</span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4 animate-fade-up" style={{ animationDelay: '160ms' }}>
            {[
              { i: BrainCircuit, t: 'Powered by Claude 4.5', d: 'Best-in-class reasoning for structured career analysis.' },
              { i: Clock, t: '60-second results', d: 'From upload to insights, in under a minute.' },
              { i: ShieldCheck, t: 'Privacy first', d: 'Scoped to your account. Never shared with third parties.' },
            ].map((x) => (
              <div key={x.t} className="border border-[#E5E5E5] bg-white p-5 hover-lift hover-shadow">
                <x.i className="w-5 h-5 text-[#0055FF] mb-3" strokeWidth={2} />
                <div className="font-heading font-bold text-sm tracking-tight mb-1">{x.t}</div>
                <div className="text-xs text-[#6B7280] leading-relaxed">{x.d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
