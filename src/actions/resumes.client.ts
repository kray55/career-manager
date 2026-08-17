export async function createResumeClient(data: { title?: string; content?: string } = { title: 'Untitled Resume', content: '{}' }): Promise<any> {
  const res = await fetch('/api/resumes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.error || 'Failed to create resume');
  return result;
}

export async function updateResumeClient(data: { id: string; content: string }): Promise<any> {
  const res = await fetch('/api/resumes', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.error || 'Failed to update resume');
  return result.data ?? result;
}

export async function exportResumeToPDFClient(id: string): Promise<{ html: string; title: string }> {
  const res = await fetch(`/api/resumes/export?id=${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error('Failed to export resume');
  return res.json();
}

export async function getResumeByIdClient(id: string): Promise<any> {
  const res = await fetch(`/api/resumes?id=${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error('Failed to fetch resume');
  const data = await res.json();
  return data.resume ?? data;
}

export async function deleteResumeClient(id: string): Promise<void> {
  const res = await fetch(`/api/resumes?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
  const result = await res.json();
  if (!res.ok) throw new Error(result.error || 'Failed to delete resume');
}

export async function restoreResumeVersionClient(resumeId: string, version: number): Promise<any> {
  const res = await fetch('/api/resumes/restore', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resumeId, version }),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.error || 'Failed to restore resume version');
  return result;
}
