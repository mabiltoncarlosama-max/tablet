import React, { useState } from 'react';
import { StampItem } from '../types';
import { Trash2 } from 'lucide-react';

interface StampItemComponentProps {
  stamp: StampItem;
  isReadOnly?: boolean;
  onUpdate: (updated: StampItem) => void;
  onDelete: (id: string) => void;
  zoom?: number;
}

export const StampItemComponent: React.FC<StampItemComponentProps> = ({
  stamp,
  isReadOnly = false,
  onUpdate,
  onDelete,
  zoom = 1,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showControls, setShowControls] = useState(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isReadOnly) return;
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsDragging(true);
    setShowControls(true);
    setDragOffset({
      x: e.clientX / zoom - stamp.x,
      y: e.clientY / zoom - stamp.y,
    });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    e.stopPropagation();
    const newX = Math.max(5, Math.round(e.clientX / zoom - dragOffset.x));
    const newY = Math.max(5, Math.round(e.clientY / zoom - dragOffset.y));
    onUpdate({
      ...stamp,
      x: newX,
      y: newY,
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

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={() => setShowControls(!showControls)}
      className={`absolute z-30 select-none group flex items-center gap-1.5 p-1 rounded-md cursor-grab transition-transform ${
        isDragging ? 'cursor-grabbing scale-110' : 'hover:scale-105'
      }`}
      style={{
        left: `${stamp.x}px`,
        top: `${stamp.y}px`,
      }}
    >
      <div
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full shadow-md font-sans text-xs font-bold text-white tracking-wide border border-white/20 backdrop-blur-xs"
        style={{
          backgroundColor: stamp.color,
          fontSize: `${Math.max(11, stamp.size * 0.4)}px`,
        }}
      >
        <span style={{ fontSize: `${stamp.size * 0.6}px` }}>{stamp.icon}</span>
        {stamp.label && <span>{stamp.label}</span>}
      </div>

      {showControls && !isReadOnly && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(stamp.id);
          }}
          className="p-1 rounded-full bg-rose-500 text-white shadow-md hover:bg-rose-600 transition-colors ml-1"
          title="Eliminar sello"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};
