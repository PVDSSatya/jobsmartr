import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../lib/api";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { UploadCloud, FileText, Loader2 } from "lucide-react";

export default function Upload() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(""); // "uploading" | "analyzing"
  const inputRef = useRef();
  const navigate = useNavigate();

  const onDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
  };

  const handleSubmit = async () => {
    if (!file) { toast.error("Please choose a PDF or DOCX"); return; }
    const lc = file.name.toLowerCase();
    if (!lc.endsWith(".pdf") && !lc.endsWith(".docx")) { toast.error("Only PDF or DOCX"); return; }
    setLoading(true);
    setStep("uploading");
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
    <div className="min-h-screen bg-[#FAFAFA]" data-testid="upload-page">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="overline mb-2">Step 1</div>
        <h1 className="font-heading font-black text-4xl sm:text-5xl tracking-tighter mb-3">Upload your resume</h1>
        <p className="text-[#6B7280] text-sm mb-8">PDF or DOCX only, max 10MB. We extract text, run ATS scoring, and build your career map.</p>

        <div
          onDragOver={(e)=>e.preventDefault()}
          onDrop={onDrop}
          onClick={()=>inputRef.current?.click()}
          className="border-2 border-dashed border-[#0A192F] bg-white p-12 text-center cursor-pointer hover:bg-[#FAFAFA] transition"
          data-testid="resume-upload-dropzone"
        >
          <input ref={inputRef} type="file" accept=".pdf,.docx" hidden onChange={(e)=>setFile(e.target.files?.[0] || null)} data-testid="resume-file-input" />
          {file ? (
            <div className="flex flex-col items-center">
              <FileText className="w-10 h-10 text-[#0055FF] mb-3" />
              <div className="font-heading font-bold text-lg tracking-tight">{file.name}</div>
              <div className="text-xs text-[#6B7280]">{(file.size/1024).toFixed(1)} KB · click to change</div>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <UploadCloud className="w-10 h-10 text-[#0A192F] mb-3" />
              <div className="font-heading font-bold text-lg tracking-tight">Drop your resume here</div>
              <div className="text-xs text-[#6B7280]">or click to browse · PDF, DOCX</div>
            </div>
          )}
        </div>

        <div className="mt-8 flex items-center gap-3">
          <Button onClick={handleSubmit} disabled={!file || loading} className="btn-primary" data-testid="analyze-submit">
            {loading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {step === "uploading" ? "Uploading…" : "Analyzing with AI…"}</>) : "Analyze Resume"}
          </Button>
          {loading && step === "analyzing" && (
            <span className="text-xs text-[#6B7280]">This takes 20–40 seconds…</span>
          )}
        </div>
      </div>
    </div>
  );
}
