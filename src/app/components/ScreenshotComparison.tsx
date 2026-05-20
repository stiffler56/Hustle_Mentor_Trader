/**
 * Screenshot Comparison Component
 * Provides side-by-side comparison of before/after trade screenshots
 */

import { useState } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { useTheme } from '../data/ThemeContext';

interface ScreenshotComparisonProps {
  beforeImages: string[];
  afterImages: string[];
  tradeId: string;
}

export function ScreenshotComparison({ beforeImages, afterImages, tradeId }: ScreenshotComparisonProps) {
  const { colors } = useTheme();
  const [beforeIndex, setBeforeIndex] = useState(0);
  const [afterIndex, setAfterIndex] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [selectedImage, setSelectedImage] = useState<{ type: 'before' | 'after'; index: number } | null>(null);

  const currentBefore = beforeImages[beforeIndex];
  const currentAfter = afterImages[afterIndex];

  const handleZoomIn = () => setZoom(Math.min(zoom + 10, 200));
  const handleZoomOut = () => setZoom(Math.max(zoom - 10, 50));

  return (
    <div>
      {/* Main Comparison View */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        {/* Before */}
        <div
          style={{
            background: colors.background,
            border: `1px solid ${colors.border}`,
            borderRadius: '0.5rem',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '0.75rem',
              borderBottom: `1px solid ${colors.border}`,
              fontSize: '0.875rem',
              fontWeight: '600',
              color: colors.textMuted,
            }}
          >
            📸 Before Entry
          </div>
          {currentBefore ? (
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '300px',
                overflow: 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img
                src={currentBefore}
                alt="Before"
                onClick={() => setSelectedImage({ type: 'before', index: beforeIndex })}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  transform: `scale(${zoom / 100})`,
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease',
                }}
              />
            </div>
          ) : (
            <div
              style={{
                height: '300px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: colors.textMuted,
              }}
            >
              No before image
            </div>
          )}
          {beforeImages.length > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', borderTop: `1px solid ${colors.border}` }}>
              <button
                onClick={() => setBeforeIndex(Math.max(0, beforeIndex - 1))}
                disabled={beforeIndex === 0}
                style={{
                  padding: '0.5rem',
                  background: colors.background,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '0.375rem',
                  color: colors.text,
                  cursor: beforeIndex === 0 ? 'not-allowed' : 'pointer',
                  opacity: beforeIndex === 0 ? 0.5 : 1,
                }}
              >
                <ChevronLeft size={16} />
              </button>
              <span style={{ fontSize: '0.75rem', color: colors.textMuted }}>
                {beforeIndex + 1} / {beforeImages.length}
              </span>
              <button
                onClick={() => setBeforeIndex(Math.min(beforeImages.length - 1, beforeIndex + 1))}
                disabled={beforeIndex === beforeImages.length - 1}
                style={{
                  padding: '0.5rem',
                  background: colors.background,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '0.375rem',
                  color: colors.text,
                  cursor: beforeIndex === beforeImages.length - 1 ? 'not-allowed' : 'pointer',
                  opacity: beforeIndex === beforeImages.length - 1 ? 0.5 : 1,
                }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>

        {/* After */}
        <div
          style={{
            background: colors.background,
            border: `1px solid ${colors.border}`,
            borderRadius: '0.5rem',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '0.75rem',
              borderBottom: `1px solid ${colors.border}`,
              fontSize: '0.875rem',
              fontWeight: '600',
              color: colors.textMuted,
            }}
          >
            📸 After Exit
          </div>
          {currentAfter ? (
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '300px',
                overflow: 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img
                src={currentAfter}
                alt="After"
                onClick={() => setSelectedImage({ type: 'after', index: afterIndex })}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  transform: `scale(${zoom / 100})`,
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease',
                }}
              />
            </div>
          ) : (
            <div
              style={{
                height: '300px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: colors.textMuted,
              }}
            >
              No after image
            </div>
          )}
          {afterImages.length > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', borderTop: `1px solid ${colors.border}` }}>
              <button
                onClick={() => setAfterIndex(Math.max(0, afterIndex - 1))}
                disabled={afterIndex === 0}
                style={{
                  padding: '0.5rem',
                  background: colors.background,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '0.375rem',
                  color: colors.text,
                  cursor: afterIndex === 0 ? 'not-allowed' : 'pointer',
                  opacity: afterIndex === 0 ? 0.5 : 1,
                }}
              >
                <ChevronLeft size={16} />
              </button>
              <span style={{ fontSize: '0.75rem', color: colors.textMuted }}>
                {afterIndex + 1} / {afterImages.length}
              </span>
              <button
                onClick={() => setAfterIndex(Math.min(afterImages.length - 1, afterIndex + 1))}
                disabled={afterIndex === afterImages.length - 1}
                style={{
                  padding: '0.5rem',
                  background: colors.background,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '0.375rem',
                  color: colors.text,
                  cursor: afterIndex === afterImages.length - 1 ? 'not-allowed' : 'pointer',
                  opacity: afterIndex === afterImages.length - 1 ? 0.5 : 1,
                }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Zoom Controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '1rem',
          padding: '1rem',
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: '0.5rem',
          marginBottom: '1.5rem',
        }}
      >
        <button
          onClick={handleZoomOut}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            background: colors.background,
            border: `1px solid ${colors.border}`,
            borderRadius: '0.375rem',
            color: colors.text,
            cursor: 'pointer',
            fontSize: '0.875rem',
          }}
        >
          <ZoomOut size={16} /> Zoom Out
        </button>
        <span style={{ display: 'flex', alignItems: 'center', color: colors.textMuted, fontSize: '0.875rem' }}>
          {zoom}%
        </span>
        <button
          onClick={handleZoomIn}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            background: colors.background,
            border: `1px solid ${colors.border}`,
            borderRadius: '0.375rem',
            color: colors.text,
            cursor: 'pointer',
            fontSize: '0.875rem',
          }}
        >
          <ZoomIn size={16} /> Zoom In
        </button>
      </div>

      {/* Fullscreen Modal */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
          }}
        >
          <img
            src={selectedImage.type === 'before' ? beforeImages[selectedImage.index] : afterImages[selectedImage.index]}
            alt="Fullscreen"
            style={{
              maxWidth: '90%',
              maxHeight: '90%',
              objectFit: 'contain',
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
