export async function createResumeClient(data: { title?: string; content?: string } = { title: 'Untitled Resume', content: '{}' }) : Promise<any> {
  try {
    const res = await fetch('/api/resumes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to create resume');
    return result;
  } catch (err: any) {
    throw err;
  }
}
