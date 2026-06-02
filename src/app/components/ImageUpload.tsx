import React, { useRef, useState } from 'react';
import { Upload, X, ZoomIn } from 'lucide-react';
import { compressImage } from '../utils/imageUtils';
import { useTheme } from '../data/ThemeContext';

interface ImageUploadProps {
  value?: string;
  onChange: (data: string | undefined) => void;
  label: string;
  hint?: string;
}

export function ImageUpload({ value, onChange, label, hint }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const { colors } = useTheme();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const compressed = await compressImage(file);
      onChange(compressed);
    } catch {
      console.error('Image compression failed');
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <>
      {lightbox && value && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.92)' }}
          onClick={() => setLightbox(false)}
        >
          <img src={value} className="max-w-full max-h-full rounded-xl object-contain" />
          <button
            className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full"
            style={{ background: 'rgba(255,255,255,0.1)' }}
          >
            <X size={16} style={{ color: '#e5e7eb' }} />
          </button>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs uppercase tracking-widest" style={{ color: colors.textMuted }}>{label}</label>
          {hint && <span className="text-xs" style={{ color: colors.textFaint }}>{hint}</span>}
        </div>

        {value ? (
          <div className="relative rounded-xl overflow-hidden" style={{ border: `1px solid ${colors.border}` }}>
            <img src={value} className="w-full object-cover" style={{ maxHeight: 160 }} />
            <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 hover:opacity-100 transition-opacity" style={{ background: 'rgba(0,0,0,0.5)' }}>
              <button
                onClick={() => setLightbox(true)}
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(245,158,11,0.9)' }}
              >
                <ZoomIn size={15} color="#000" />
              </button>
              <button
                onClick={() => onChange(undefined)}
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(239,68,68,0.9)' }}
              >
                <X size={15} color="#fff" />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={loading}
            className="w-full rounded-xl flex flex-col items-center gap-2 py-5 transition-all hover:opacity-80"
            style={{ border: `2px dashed ${colors.border}`, background: 'transparent' }}
          >
            {loading ? (
              <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: '#f59e0b', borderTopColor: 'transparent' }} />
            ) : (
              <>
                <Upload size={18} style={{ color: colors.textFaint }} />
                <span className="text-xs" style={{ color: colors.textMuted }}>Click to upload</span>
              </>
            )}
          </button>
        )}

        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>
    </>
  );
}