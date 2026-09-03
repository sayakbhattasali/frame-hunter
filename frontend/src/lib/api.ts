import { MediaFrame, SearchFilters } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function searchFrames(filters: SearchFilters): Promise<MediaFrame[]> {
  const res = await fetch(`${API_BASE_URL}/api/frames/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(filters),
  });

  if (!res.ok) {
    throw new Error(`Search failed: ${res.statusText}`);
  }

  const data = await res.json();
  return data.results || [];
}

export async function uploadFrame(file: File): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE_URL}/api/frames/ingest`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Upload failed: ${res.statusText}`);
  }

  return await res.json();
}

export async function deleteFrame(id: string): Promise<boolean> {
  const res = await fetch(`${API_BASE_URL}/api/frames/${id}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    throw new Error(`Delete failed: ${res.statusText}`);
  }

  return true;
}
