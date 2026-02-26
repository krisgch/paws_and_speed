import { useState, useRef } from 'react';
import { uploadReceiptImage } from '../lib/storage.ts';

interface ReceiptUploaderProps {
  registrationId: string;
  onUploaded: (path: string) => void;
  existingPath?: string | null;
}

export default function ReceiptUploader({ registrationId, onUploaded, existingPath }: ReceiptUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [uploadedPath, setUploadedPath] = useState<string | null>(existingPath ?? null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    const maxSize = 5 * 1024 * 1024; // 5 MB
    if (file.size > maxSize) {
      setError('File too large (max 5 MB)');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    setError('');
    setUploading(true);
    try {
      const path = await uploadReceiptImage(registrationId, file);
      setUploadedPath(path);
      onUploaded(path);
    } catch (err) {
      setError((err as Error).message ?? 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {uploadedPath ? (
        <div
          className="flex items-center justify-between"
          style={{
            background: 'rgba(45,212,160,0.08)',
            border: '1px solid rgba(45,212,160,0.25)',
            borderRadius: '8px',
            padding: '10px 14px',
          }}
        >
          <span className="text-[13px]" style={{ color: '#2dd4a0' }}>
            ✓ Receipt uploaded
          </span>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-[12px] cursor-pointer"
            style={{ color: '#8b90a5', background: 'none', border: 'none' }}
          >
            Replace
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="w-full cursor-pointer text-[13px] font-semibold disabled:opacity-50"
          style={{
            padding: '10px 14px',
            borderRadius: '8px',
            border: '2px dashed #2a2f40',
            background: 'transparent',
            color: '#8b90a5',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#ff6b2c'; (e.currentTarget as HTMLElement).style.color = '#ff6b2c'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#2a2f40'; (e.currentTarget as HTMLElement).style.color = '#8b90a5'; }}
        >
          {uploading ? 'Uploading…' : '📷 Upload Payment Receipt'}
        </button>
      )}

      {error && (
        <p className="text-[12px] mt-1.5" style={{ color: '#ef4444' }}>
          {error}
        </p>
      )}
    </div>
  );
}
