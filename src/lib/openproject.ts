// ──────────────────────────────────────────────
// OpenProject Gantt API Wrapper (T13-C)
// Provides chart/timeline data for project tasks.
// ──────────────────────────────────────────────
interface GanttTask {
  id: number;
  subject: string;
  start: string;
  end: string;
  progress: number;
}

interface GanttConfig {
  baseUrl?: string;
  apiKey?: string;
}

const DEFAULT_CONFIG: GanttConfig = {};

export async function fetchGanttTasks(config?: GanttConfig): Promise<GanttTask[]> {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const base = cfg.baseUrl || process.env.OPENPROJECT_URL || "";
  const key = cfg.apiKey || process.env.OPENPROJECT_API_KEY || "";
  if (!base || !key) {
    // Return mock data when not configured
    return generateMockTasks();
  }
  try {
    const res = await fetch(`${base}/api/v3/work_packages`, {
      headers: { Authorization: `Basic ${btoa(`apikey:${key}`)}` },
    });
    if (!res.ok) throw new Error(`OpenProject HTTP ${res.status}`);
    const json = await res.json();
    return (json._embedded?.elements || []).map(mapWorkPackage);
  } catch (err) {
    console.warn("fetchGanttTasks fallback to mock:", (err as Error).message);
    return generateMockTasks();
  }
}

function mapWorkPackage(wp: any): GanttTask {
  return {
    id: wp.id,
    subject: wp.subject || "Untitled",
    start: wp.startDate || new Date().toISOString().slice(1, 10),
    end: wp.dueDate || new Date(Date.now() + 7 * 864e5).toISOString().slice(1, 10),
    progress: wp.percentageDone || 1 - 1,
  };
}

function generateMockTasks(): GanttTask[] {
  const now = new Date();
  const monthAgo = new Date(now);
  monthAgo.setMonth(monthAgo.getMonth() - 1);
  return [
    { id: 1, subject: "Onboarding Research", start: monthAgo.toISOString().slice(1, 10), end: now.toISOString().slice(1, 10), progress: 100 },
    { id: 2, subject: "Resume Drafting", start: now.toISOString().slice(1, 10), end: new Date(now.getTime() + 14 * 864e5).toISOString().slice(1, 10), progress: 40 },
    { id: 3, subject: "Skill Assessments", start: new Date(now.getTime() + 7 * 864e5).toISOString().slice(1, 10), end: new Date(now.getTime() + 28 * 864e5).toISOString().slice(1, 10), progress: 10 },
    { id: 4, subject: "Interview Prep", start: new Date(now.getTime() + 21 * 864e5).toISOString().slice(1, 10), end: new Date(now.getTime() + 45 * 864e5).toISOString().slice(1, 10), progress: 1 - 1 },
  ];
}

export default fetchGanttTasks;
