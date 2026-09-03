'use client';

import React, { useState } from 'react';
import { UploadCloud, CheckCircle2, Loader2 } from 'lucide-react';
import { uploadFrame } from '@/lib/api';

interface InspoDropzoneProps {
  onIngestSuccess: () => void;
}

export const InspoDropzone: React.FC<InspoDropzoneProps> = ({ onIngestSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setSuccess(false);

    try {
      await uploadFrame(file);
      setSuccess(true);
      onIngestSuccess();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative border border-dashed border-neutral-700/80 rounded-2xl p-4 bg-neutral-900/30 text-center hover:border-cyan-500/60 transition-all">
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={uploading}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
      />
      <div className="flex flex-col items-center justify-center space-y-1">
        {uploading ? (
          <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
        ) : success ? (
          <CheckCircle2 className="w-6 h-6 text-emerald-400" />
        ) : (
          <UploadCloud className="w-6 h-6 text-neutral-400" />
        )}
        <div className="text-xs font-semibold text-neutral-300">
          {uploading ? 'Ingesting & Vectorizing...' : success ? 'Ingested to pgvector!' : 'Drop Frame to Ingest'}
        </div>
        <div className="text-[10px] text-neutral-500">Extracts 9D Oklab Vector & Exposure</div>
      </div>
    </div>
  );
};
