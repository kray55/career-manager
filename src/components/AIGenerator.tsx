"use client";

import { useState, useCallback } from "react";
import toast from "react-hot-toast";
import { createDocumentClient } from "@/actions/documents.client";

interface AIGeneratorProps {
  onGenerated?: (docId: string) => void;
}

type GenerationType = "resume" | "coverLetter" | "summary" | "experience";

const GENERATION_PROMPTS: Record<GenerationType, { label: string; placeholder: string; fields: { key: string; label: string; placeholder: string; type: "text" | "textarea" }[] }> = {
  resume: {
    label: "Resume",
    placeholder: "Generate a professional resume based on your details...",
    fields: [
      { key: "name", label: "Full Name", placeholder: "John Doe", type: "text" },
      { key: "email", label: "Email", placeholder: "john@example.com", type: "text" },
      { key: "phone", label: "Phone", placeholder: "+1 (555) 123-4567", type: "text" },
      { key: "summary", label: "Professional Summary", placeholder: "Highly skilled software engineer with 5+ years...", type: "textarea" },
      { key: "skills", label: "Skills (comma separated)", placeholder: "React, TypeScript, Node.js", type: "text" },
      { key: "experience", label: "Experience (brief)", placeholder: "Senior Developer at Acme Corp (202-present)...", type: "textarea" },
    ],
  },
  coverLetter: {
    label: "Cover Letter",
    placeholder: "Generate a tailored cover letter...",
    fields: [
      { key: "company", label: "Company Name", placeholder: "Acme Corp", type: "text" },
      { key: "position", label: "Job Title", placeholder: "Senior Software Engineer", type: "text" },
      { key: "name", label: "Your Name", placeholder: "John Doe", type: "text" },
      { key: "highlights", label: "Key Highlights", placeholder: "Your top 2-3 achievements relevant to this role...", type: "textarea" },
      { key: "reason", label: "Why this company?", placeholder: "I admire Acme Corp's mission to...", type: "textarea" },
    ],
  },
  summary: {
    label: "Professional Summary",
    placeholder: "Write a compelling professional summary...",
    fields: [
      { key: "currentRole", label: "Current/Past Role", placeholder: "Senior Software Engineer", type: "text" },
      { key: "years", label: "Years of Experience", placeholder: "5+", type: "text" },
      { key: "keyStrengths", label: "Key Strengths", placeholder: "full-stack development, team leadership", type: "text" },
      { key: "achievements", label: "Top Achievement", placeholder: "Led a team of 5 to deliver a product used by 1M+ users", type: "textarea" },
    ],
  },
  experience: {
    label: "Experience Entry",
    placeholder: "Generate a polished experience bullet point...",
    fields: [
      { key: "role", label: "Job Title", placeholder: "Software Engineer", type: "text" },
      { key: "company", label: "Company", placeholder: "Tech Corp", type: "text" },
      { key: "duration", label: "Duration", placeholder: "202 - Present", type: "text" },
      { key: "responsibilities", label: "Key Responsibilities", placeholder: "Led development of... Managed team of...", type: "textarea" },
      { key: "metrics", label: "Key Metrics/Results", placeholder: "Improved performance by 40%, Reduced bugs by 60%", type: "text" },
    ],
  },
};

export default function AIGenerator({ onGenerated }: AIGeneratorProps) {
  const [type, setType] = useState<GenerationType>("coverLetter");
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);

  const config = GENERATION_PROMPTS[type];

  const handleFieldChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const getPromptText = useCallback(() => {
    const parts = [`Generate a ${config.label.toLowerCase()} for a job application.`];
    for (const field of config.fields) {
      if (formData[field.key]?.trim()) {
        parts.push(`${field.label}: ${formData[field.key].trim()}`);
      }
    }
    parts.push("Format the output as clean HTML with appropriate headings (<h1>, <h2>, <h3>), paragraphs (<p>), and lists (<ul>/<li>). Make it professional and ready to use.");
    return parts.join("\n");
  }, [type, formData, config]);

  const handleGenerate = useCallback(async () => {
    const hasData = config.fields.some(f => formData[f.key]?.trim());
    if (!hasData) {
      toast.error("Please fill in at least one field");
      return;
    }

    setIsGenerating(true);
    setGeneratedContent(null);

    try {
      const response = await fetch("/api/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, fields: formData }),
      });
      const result = await response.json();
      if (!response.ok || !result.content) {
        throw new Error(result.error || "Generation failed");
      }

      const generated = result.content as string;
      const documentResult = await createDocumentClient({
        title: `${config.label} - AI Generated`,
        content: generated,
        type: type === "resume" ? "resume" : type === "coverLetter" ? "coverLetter" : "document",
        status: "draft",
        tags: `ai-generated, ${type}`,
      });

      if (!documentResult.success) {
        throw new Error(documentResult.error || "Generated content could not be saved");
      }

      setGeneratedContent(generated);
      toast.success(`${config.label} generated and saved to Documents.`);
      onGenerated?.(documentResult.data.id);
    } catch (err: any) {
      toast.error("Generation failed: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  }, [type, formData, config, getPromptText, onGenerated]);

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">🤖 AI Document Generator</h3>
          <p className="text-xs text-slate-500 mt-1">Generate resumes, cover letters, summaries, and experience entries.</p>
        </div>
        <a
          href="https://vercel.com/one-techx/career-manager/settings/environment-variables"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-200 text-xs font-medium hover:bg-purple-500/20 transition-colors"
          title="Open Vercel Production environment variables"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 3h7v7m0-7L10 14M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /></svg>
          Configure AI in Vercel
        </a>
      </div>

      <div className="mb-6 rounded-xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-xs text-slate-300">
        <p className="font-medium text-amber-200">Production AI setup</p>
        <p className="mt-1">In Vercel, add <code className="text-purple-200">OPENAI_API_KEY</code> to the <strong>Production</strong> environment, then redeploy. Never paste the secret into this app or into chat.</p>
      </div>
      
      {/* Type Selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(Object.keys(GENERATION_PROMPTS) as GenerationType[]).map(k => (
          <button key={k} onClick={() => { setType(k); setFormData({}); setGeneratedContent(null); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
              type === k ? "bg-purple-600/20 text-purple-300 border border-purple-500/30" : "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10"
            }`}>
            {GENERATION_PROMPTS[k].label}
          </button>
        ))}
      </div>

      {/* Form Fields */}
      <div className="space-y-3 mb-6">
        {config.fields.map(field => (
          <div key={field.key}>
            <label className="block text-xs text-slate-500 mb-1">{field.label}</label>
            {field.type === "textarea" ? (
              <textarea
                value={formData[field.key] || ""}
                onChange={e => handleFieldChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                rows={3}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              />
            ) : (
              <input
                type="text"
                value={formData[field.key] || ""}
                onChange={e => handleFieldChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            )}
          </div>
        ))}
      </div>

      {/* Generate Button */}
      <button onClick={handleGenerate} disabled={isGenerating}
        className="w-full py-2.5 bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 text-white text-sm font-medium rounded-xl disabled:opacity-50 flex items-center justify-center gap-2">
        {isGenerating ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
            Generating...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            Generate {config.label}
          </>
        )}
      </button>

      {/* Generated Content Preview */}
      {generatedContent && (
        <div className="mt-6 border-t border-white/10 pt-4">
          <h4 className="text-sm font-medium text-white mb-3">Generated Content</h4>
          <div className="prose prose-invert max-w-none text-sm text-slate-300 bg-slate-800/50 rounded-lg p-4 max-h-60 overflow-y-auto"
            dangerouslySetInnerHTML={{ __html: generatedContent }} />
          <div className="flex gap-2 mt-3">
            <button onClick={() => { navigator.clipboard.writeText(generatedContent); toast.success("Copied!"); }}
              className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs rounded-lg hover:text-white">
              Copy HTML
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Template-based generation (simulates AI)
function generateFromTemplate(type: GenerationType, data: Record<string, string>): string {
  switch (type) {
    case "resume": {
      const name = data.name || "Your Name";
      const email = data.email || "email@example.com";
      const phone = data.phone || "Phone";
      const summary = data.summary || "Professional with experience in the industry.";
      const skills = data.skills || "Relevant skills";
      const exp = data.experience || "Experience details";
      return `<h1>${name}</h1>
<p>${email} | ${phone}</p>
<hr/>
<h2>Professional Summary</h2>
<p>${summary}</p>
<h2>Experience</h2>
<p>${exp.replace(/\n/g, '<br/>')}</p>
<h2>Skills</h2>
<p>${skills}</p>`;
    }
    case "coverLetter": {
      const company = data.company || "[Company Name]";
      const position = data.position || "[Job Title]";
      const name = data.name || "Your Name";
      const highlights = data.highlights || "Your key achievements";
      const reason = data.reason || "Your reasons for interest";
      return `<h2>${name}</h2>
<p>email@example.com | Phone</p>
<hr/>
<p>Dear Hiring Manager at <strong>${company}</strong>,</p>
<br/>
<p>I am writing to express my strong interest in the <strong>${position}</strong> position at <strong>${company}</strong>.</p>
<br/>
<p>${highlights.replace(/\n/g, '<br/>')}</p>
<br/>
<p>${reason.replace(/\n/g, '<br/>')}</p>
<br/>
<p>I would welcome the opportunity to discuss how my skills and experience align with the needs of your team.</p>
<br/>
<p>Sincerely,</p>
<p>${name}</p>`;
    }
    case "summary": {
      const role = data.currentRole || "Professional";
      const years = data.years || "X";
      const strengths = data.keyStrengths || "key strengths";
      const achievements = data.achievements || "key achievements";
      return `<h2>Professional Summary</h2>
<p>Results-driven ${role} with ${years} years of experience. Proven track record in ${strengths}. ${achievements}</p>`;
    }
    case "experience": {
      const role = data.role || "Job Title";
      const company = data.company || "Company Name";
      const duration = data.duration || "Duration";
      const responsibilities = data.responsibilities || "Key responsibilities";
      const metrics = data.metrics ? ` Key results: ${data.metrics}.` : "";
      return `<h3>${role} — ${company}</h3>
<p><em>${duration}</em></p>
<ul>
<li>${responsibilities.replace(/\n/g, '</li><li>')}${metrics}</li>
</ul>`;
    }
    default:
      return "<p>Generated content</p>";
  }
}
