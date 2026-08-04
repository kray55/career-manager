"use client";

import { useState, useCallback } from "react";
import toast from "react-hot-toast";

// ──────────────────────────────────────────────
// Types for Resume JSON structure
// ──────────────────────────────────────────────

export interface ResumeHeader {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  title: string;
  summary: string;
}

export interface ResumeExperience {
  id: string;
  company: string;
  role: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  bullets: string[];
}

export interface ResumeEducation {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  gpa: string;
}

export interface ResumeSkill {
  id: string;
  name: string;
  level: "beginner" | "intermediate" | "advanced" | "expert";
}

export interface ResumeData {
  header: ResumeHeader;
  experience: ResumeExperience[];
  education: ResumeEducation[];
  skills: ResumeSkill[];
}

const defaultResume: ResumeData = {
  header: {
    fullName: "",
    email: "",
    phone: "",
    location: "",
    title: "",
    summary: "",
  },
  experience: [],
  education: [],
  skills: [],
};

// ──────────────────────────────────────────────
// Props
// ──────────────────────────────────────────────

interface ResumeBuilderProps {
  initialData?: ResumeData;
  onSave: (data: ResumeData) => Promise<void>;
  onExport?: () => Promise<void>;
  exporting?: boolean;
}

// ──────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────

export default function ResumeBuilder({
  initialData,
  onSave,
  onExport,
  exporting = false,
}: ResumeBuilderProps) {
  const [data, setData] = useState<ResumeData>(initialData ?? defaultResume);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"header" | "experience" | "education" | "skills" | "preview">("header");

  // ── Header update ──
  const updateHeader = useCallback((field: keyof ResumeHeader, value: string) => {
    setData((prev) => ({ ...prev, header: { ...prev.header, [field]: value } }));
  }, []);

  // ── Experience ──
  const addExperience = useCallback(() => {
    const newExp: ResumeExperience = {
      id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
      company: "",
      role: "",
      location: "",
      startDate: "",
      endDate: "",
      current: false,
      bullets: [""],
    };
    setData((prev) => ({ ...prev, experience: [...prev.experience, newExp] }));
  }, []);

  const updateExperience = useCallback((id: string, field: keyof ResumeExperience, value: any) => {
    setData((prev) => ({
      ...prev,
      experience: prev.experience.map((e) => (e.id === id ? { ...e, [field]: value } : e)),
    }));
  }, []);

  const removeExperience = useCallback((id: string) => {
    setData((prev) => ({ ...prev, experience: prev.experience.filter((e) => e.id !== id) }));
  }, []);

  const addBullet = useCallback((expId: string) => {
    setData((prev) => ({
      ...prev,
      experience: prev.experience.map((e) =>
        e.id === expId ? { ...e, bullets: [...e.bullets, ""] } : e
      ),
    }));
  }, []);

  const updateBullet = useCallback((expId: string, idx: number, value: string) => {
    setData((prev) => ({
      ...prev,
      experience: prev.experience.map((e) =>
        e.id === expId
          ? { ...e, bullets: e.bullets.map((b, i) => (i === idx ? value : b)) }
          : e
      ),
    }));
  }, []);

  const removeBullet = useCallback((expId: string, idx: number) => {
    setData((prev) => ({
      ...prev,
      experience: prev.experience.map((e) =>
        e.id === expId
          ? { ...e, bullets: e.bullets.filter((_, i) => i !== idx) }
          : e
      ),
    }));
  }, []);

  // ── Education ──
  const addEducation = useCallback(() => {
    const newEdu: ResumeEducation = {
      id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
      institution: "",
      degree: "",
      field: "",
      startDate: "",
      endDate: "",
      gpa: "",
    };
    setData((prev) => ({ ...prev, education: [...prev.education, newEdu] }));
  }, []);

  const updateEducation = useCallback((id: string, field: keyof ResumeEducation, value: string) => {
    setData((prev) => ({
      ...prev,
      education: prev.education.map((e) => (e.id === id ? { ...e, [field]: value } : e)),
    }));
  }, []);

  const removeEducation = useCallback((id: string) => {
    setData((prev) => ({ ...prev, education: prev.education.filter((e) => e.id !== id) }));
  }, []);

  // ── Skills ──
  const addSkill = useCallback(() => {
    const newSkill: ResumeSkill = {
      id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
      name: "",
      level: "intermediate",
    };
    setData((prev) => ({ ...prev, skills: [...prev.skills, newSkill] }));
  }, []);

  const updateSkill = useCallback((id: string, field: keyof ResumeSkill, value: string) => {
    setData((prev) => ({
      ...prev,
      skills: prev.skills.map((s) => (s.id === id ? { ...s, [field]: value } : s)),
    }));
  }, []);

  const removeSkill = useCallback((id: string) => {
    setData((prev) => ({ ...prev, skills: prev.skills.filter((s) => s.id !== id) }));
  }, []);

  // ── Save ──
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await onSave(data);
      toast.success("Resume saved");
    } catch {
      toast.error("Failed to save resume");
    } finally {
      setSaving(false);
    }
  }, [data, onSave]);

  // ── Tabs ──
  const tabs: { key: typeof activeTab; label: string }[] = [
    { key: "header", label: "Header" },
    { key: "experience", label: "Experience" },
    { key: "education", label: "Education" },
    { key: "skills", label: "Skills" },
    { key: "preview", label: "Preview" },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-1 bg-slate-800/50 rounded-xl p-1 border border-white/10">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === tab.key
                ? "bg-primary-500/20 text-primary-300 border border-primary-500/30"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm min-h-[400px]">
        {activeTab === "header" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  value={data.header.fullName}
                  onChange={(e) => updateHeader("fullName", e.target.value)}
                  className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500/50"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Professional Title</label>
                <input
                  type="text"
                  value={data.header.title}
                  onChange={(e) => updateHeader("title", e.target.value)}
                  className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500/50"
                  placeholder="Senior Software Engineer"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Email</label>
                <input
                  type="email"
                  value={data.header.email}
                  onChange={(e) => updateHeader("email", e.target.value)}
                  className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500/50"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Phone</label>
                <input
                  type="text"
                  value={data.header.phone}
                  onChange={(e) => updateHeader("phone", e.target.value)}
                  className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500/50"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Location</label>
                <input
                  type="text"
                  value={data.header.location}
                  onChange={(e) => updateHeader("location", e.target.value)}
                  className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500/50"
                  placeholder="San Francisco, CA"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Professional Summary</label>
              <textarea
                value={data.header.summary}
                onChange={(e) => updateHeader("summary", e.target.value)}
                rows={4}
                className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500/50"
                placeholder="Results-driven professional with 5+ years of experience..."
              />
            </div>
          </div>
        )}

        {activeTab === "experience" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Work Experience</h3>
              <button
                onClick={addExperience}
                className="px-4 py-2 bg-primary-500/20 text-primary-300 text-sm rounded-lg hover:bg-primary-500/30 border border-primary-500/30"
              >
                + Add Experience
              </button>
            </div>
            {data.experience.length < 1 && (
              <p className="text-sm text-slate-500 text-center py-8">No experience entries yet. Click "Add Experience" to begin.</p>
            )}
            {data.experience.map((exp) => (
              <div key={exp.id} className="bg-slate-800/30 border border-white/5 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">{exp.role || "New Position"}</span>
                  <button
                    onClick={() => removeExperience(exp.id)}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Company"
                    value={exp.company}
                    onChange={(e) => updateExperience(exp.id, "company", e.target.value)}
                    className="bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500/50"
                  />
                  <input
                    type="text"
                    placeholder="Role / Title"
                    value={exp.role}
                    onChange={(e) => updateExperience(exp.id, "role", e.target.value)}
                    className="bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500/50"
                  />
                  <input
                    type="text"
                    placeholder="Location"
                    value={exp.location}
                    onChange={(e) => updateExperience(exp.id, "location", e.target.value)}
                    className="bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500/50"
                  />
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Start Date"
                      value={exp.startDate}
                      onChange={(e) => updateExperience(exp.id, "startDate", e.target.value)}
                      className="flex-1 bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500/50"
                    />
                    <input
                      type="text"
                      placeholder="End Date"
                      value={exp.endDate}
                      onChange={(e) => updateExperience(exp.id, "endDate", e.target.value)}
                      disabled={exp.current}
                      className="flex-1 bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500/50 disabled:opacity-40"
                    />
                    <label className="flex items-center gap-1 text-xs text-slate-400 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={exp.current}
                        onChange={(e) => updateExperience(exp.id, "current", e.target.checked)}
                        className="rounded border-white/20 bg-slate-700"
                      />
                      Current
                    </label>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Accomplishments / Bullets</span>
                    <button
                      onClick={() => addBullet(exp.id)}
                      className="text-xs text-primary-400 hover:text-primary-300"
                    >
                      + Add bullet
                    </button>
                  </div>
                  {exp.bullets.map((bullet, idx) => (
                    <div key={idx} className="flex gap-2">
                      <span className="text-slate-500 mt-2">•</span>
                      <input
                        type="text"
                        value={bullet}
                        onChange={(e) => updateBullet(exp.id, idx, e.target.value)}
                        className="flex-1 bg-slate-800/50 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-primary-500/50"
                        placeholder="Describe your accomplishment..."
                      />
                      <button
                        onClick={() => removeBullet(exp.id, idx)}
                        className="text-red-400 hover:text-red-300 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "education" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Education</h3>
              <button
                onClick={addEducation}
                className="px-4 py-2 bg-primary-500/20 text-primary-300 text-sm rounded-lg hover:bg-primary-500/30 border border-primary-500/30"
              >
                + Add Education
              </button>
            </div>
            {data.education.length < 1 && (
              <p className="text-sm text-slate-500 text-center py-8">No education entries yet.</p>
            )}
            {data.education.map((edu) => (
              <div key={edu.id} className="bg-slate-800/30 border border-white/5 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">{edu.degree || "New Degree"}</span>
                  <button onClick={() => removeEducation(edu.id)} className="text-xs text-red-400 hover:text-red-300">Remove</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input type="text" placeholder="Institution" value={edu.institution} onChange={(e) => updateEducation(edu.id, "institution", e.target.value)} className="bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500/50" />
                  <input type="text" placeholder="Degree (e.g. B.S.)" value={edu.degree} onChange={(e) => updateEducation(edu.id, "degree", e.target.value)} className="bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500/50" />
                  <input type="text" placeholder="Field of Study" value={edu.field} onChange={(e) => updateEducation(edu.id, "field", e.target.value)} className="bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500/50" />
                  <div className="flex gap-2">
                    <input type="text" placeholder="Start" value={edu.startDate} onChange={(e) => updateEducation(edu.id, "startDate", e.target.value)} className="flex-1 bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500/50" />
                    <input type="text" placeholder="End" value={edu.endDate} onChange={(e) => updateEducation(edu.id, "endDate", e.target.value)} className="flex-1 bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500/50" />
                  </div>
                  <input type="text" placeholder="GPA (optional)" value={edu.gpa} onChange={(e) => updateEducation(edu.id, "gpa", e.target.value)} className="bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500/50" />
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "skills" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Skills</h3>
              <button onClick={addSkill} className="px-4 py-2 bg-primary-500/20 text-primary-300 text-sm rounded-lg hover:bg-primary-500/30 border border-primary-500/30">+ Add Skill</button>
            </div>
            {data.skills.length < 1 && (
              <p className="text-sm text-slate-500 text-center py-8">No skills added yet.</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.skills.map((skill) => (
                <div key={skill.id} className="bg-slate-800/30 border border-white/5 rounded-lg p-3 flex items-center gap-2">
                  <input
                    type="text"
                    value={skill.name}
                    onChange={(e) => updateSkill(skill.id, "name", e.target.value)}
                    className="flex-1 bg-transparent border-none text-white text-sm focus:outline-none placeholder-slate-500"
                    placeholder="Skill name"
                  />
                  <select
                    value={skill.level}
                    onChange={(e) => updateSkill(skill.id, "level", e.target.value)}
                    className="bg-slate-700 border border-white/10 rounded text-xs text-white px-2 py-1"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="expert">Expert</option>
                  </select>
                  <button onClick={() => removeSkill(skill.id)} className="text-red-400 hover:text-red-300 text-xs">✕</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "preview" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Resume Preview</h3>
              {onExport && (
                <button
                  onClick={onExport}
                  disabled={exporting}
                  className="px-4 py-2 bg-green-500/20 text-green-300 text-sm rounded-lg hover:bg-green-500/30 border border-green-500/30 disabled:opacity-50"
                >
                  {exporting ? "Exporting..." : "Export to PDF"}
                </button>
              )}
            </div>

            {/* Preview Card */}
            <div className="bg-white text-black rounded-xl p-8 max-w-[800px] mx-auto shadow-2xl">
              {/* Header */}
              <div className="text-center border-b border-gray-300 pb-6 mb-6">
                <h1 className="text-3xl font-bold text-gray-900">{data.header.fullName || "Your Name"}</h1>
                <p className="text-lg text-gray-600 mt-1">{data.header.title || "Professional Title"}</p>
                <div className="text-sm text-gray-500 mt-2 space-x-3">
                  {data.header.email && <span>{data.header.email}</span>}
                  {data.header.phone && <span>| {data.header.phone}</span>}
                  {data.header.location && <span>| {data.header.location}</span>}
                </div>
              </div>

              {/* Summary */}
              {data.header.summary && (
                <div className="mb-6">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 mb-2">Professional Summary</h2>
                  <p className="text-sm text-gray-600">{data.header.summary}</p>
                </div>
              )}

              {/* Experience */}
              {data.experience.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 mb-3">Experience</h2>
                  {data.experience.map((exp) => (
                    <div key={exp.id} className="mb-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-gray-900">{exp.role || "Role"}</p>
                          <p className="text-sm text-gray-600">{exp.company}{exp.location ? `, ${exp.location}` : ""}</p>
                        </div>
                        <p className="text-xs text-gray-500 whitespace-nowrap">
                          {exp.startDate} – {exp.current ? "Present" : exp.endDate}
                        </p>
                      </div>
                      {exp.bullets.filter((b) => b.trim()).length > 0 && (
                        <ul className="mt-2 list-disc list-inside text-sm text-gray-600 space-y-1">
                          {exp.bullets.filter((b) => b.trim()).map((bullet, idx) => (
                            <li key={idx}>{bullet}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Education */}
              {data.education.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 mb-3">Education</h2>
                  {data.education.map((edu) => (
                    <div key={edu.id} className="mb-2">
                      <p className="font-semibold text-gray-900">{edu.degree} in {edu.field}</p>
                      <p className="text-sm text-gray-600">{edu.institution} • {edu.startDate} – {edu.endDate}{edu.gpa ? ` • GPA: ${edu.gpa}` : ""}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Skills */}
              {data.skills.length > 0 && (
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 mb-3">Skills</h2>
                  <div className="flex flex-wrap gap-2">
                    {data.skills.map((skill) => (
                      <span key={skill.id} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                        {skill.name}
                        <span className="text-xs text-gray-400 ml-1">({skill.level})</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-700 text-white font-medium rounded-xl hover:from-primary-600 hover:to-primary-800 disabled:opacity-50 transition-all"
        >
          {saving ? "Saving..." : "Save Resume"}
        </button>
      </div>
    </div>
  );
}
