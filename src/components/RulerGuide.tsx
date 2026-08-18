import React, { useState } from 'react';
import { RotateCw, X } from 'lucide-react';

interface RulerGuideProps {
  onClose: () => void;
  zoom?: number;
}

export const RulerGuide: React.FC<RulerGuideProps> = ({ onClose, zoom = 1 }) => {
  const [position, setPosition] = useState({ x: 100, y: 300 });
  const [angle, setAngle] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).tagName === 'BUTTON') return;
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsDragging(true);
    setDragOffset({
      x: e.clientX / zoom - position.x,
      y: e.clientY / zoom - position.y,
    });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    e.stopPropagation();
    setPosition({
      x: Math.round(e.clientX / zoom - dragOffset.x),
      y: Math.round(e.clientY / zoom - dragOffset.y),
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Safe ignore
      }
    }
  };

  const rotateStep = () => {
    setAngle((prev) => (prev + 15) % 360);
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className={`absolute z-40 select-none cursor-grab rounded-lg shadow-xl backdrop-blur-md border border-white/60 bg-amber-50/60 transition-shadow ${
        isDragging ? 'cursor-grabbing ring-2 ring-amber-400' : ''
      }`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: '420px',
        height: '68px',
        transform: `rotate(${angle}deg)`,
        transformOrigin: 'center center',
      }}
    >
      {/* Millimeter ruler markings */}
      <div className="absolute top-0 left-0 right-0 h-4 flex justify-between px-3 pt-0.5 border-b border-black/10">
        {Array.from({ length: 41 }).map((_, i) => {
          const isMajor = i % 5 === 0;
          const isTen = i % 10 === 0;
          return (
            <div key={i} className="flex flex-col items-center">
              <div
                className={`w-[1px] bg-stone-800 ${
                  isTen ? 'h-3.5 bg-stone-900 font-bold' : isMajor ? 'h-2.5' : 'h-1.5'
                }`}
              />
              {isTen && (
                <span className="text-[9px] font-bold text-stone-800 -mt-0.5 font-mono">
                  {i / 10}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Controls inside ruler */}
      <div className="absolute bottom-1 left-3 right-3 flex items-center justify-between text-stone-700">
        <span className="text-[11px] font-bold tracking-wider font-mono opacity-70">
          REGLA GUÍA • {angle}°
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={rotateStep}
            className="p-1 rounded-md bg-white/80 hover:bg-white shadow-xs text-stone-800 flex items-center gap-1 text-[11px] font-medium"
            title="Rotar regla (+15°)"
          >
            <RotateCw className="w-3 h-3" />
            +15°
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md bg-rose-100 hover:bg-rose-200 text-rose-700 shadow-xs"
            title="Cerrar regla"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
