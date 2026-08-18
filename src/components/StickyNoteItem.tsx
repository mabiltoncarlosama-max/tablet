import React, { useState, useRef, useEffect } from 'react';
import { StickyNote } from '../types';
import { Trash2, GripHorizontal, Palette } from 'lucide-react';

interface StickyNoteItemProps {
  note: StickyNote;
  isReadOnly?: boolean;
  onUpdate: (updated: StickyNote) => void;
  onDelete: (id: string) => void;
  zoom?: number;
}

const STICKY_COLORS = {
  yellow: { bg: 'bg-amber-100 border-amber-300 text-stone-900', tape: 'bg-amber-200/80', dot: 'bg-amber-400' },
  pink: { bg: 'bg-rose-100 border-rose-300 text-stone-900', tape: 'bg-rose-200/80', dot: 'bg-rose-400' },
  green: { bg: 'bg-emerald-100 border-emerald-300 text-stone-900', tape: 'bg-emerald-200/80', dot: 'bg-emerald-400' },
  blue: { bg: 'bg-sky-100 border-sky-300 text-stone-900', tape: 'bg-sky-200/80', dot: 'bg-sky-400' },
  purple: { bg: 'bg-purple-100 border-purple-300 text-stone-900', tape: 'bg-purple-200/80', dot: 'bg-purple-400' },
  orange: { bg: 'bg-orange-100 border-orange-300 text-stone-900', tape: 'bg-orange-200/80', dot: 'bg-orange-400' },
};

export const StickyNoteItem: React.FC<StickyNoteItemProps> = ({
  note,
  isReadOnly = false,
  onUpdate,
  onDelete,
  zoom = 1,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [text, setText] = useState(note.text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const noteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setText(note.text);
  }, [note.text]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isReadOnly) return;
    if ((e.target as HTMLElement).tagName === 'TEXTAREA' || (e.target as HTMLElement).tagName === 'BUTTON') {
      return;
    }
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsDragging(true);
    setDragOffset({
      x: e.clientX / zoom - note.x,
      y: e.clientY / zoom - note.y,
    });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    e.stopPropagation();
    const newX = Math.max(10, Math.round(e.clientX / zoom - dragOffset.x));
    const newY = Math.max(10, Math.round(e.clientY / zoom - dragOffset.y));
    onUpdate({
      ...note,
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

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    onUpdate({
      ...note,
      text: e.target.value,
    });
  };

  const currentColor = STICKY_COLORS[note.color] || STICKY_COLORS.yellow;

  return (
    <div
      ref={noteRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className={`absolute z-30 select-none shadow-lg rounded-sm border p-2 flex flex-col justify-between transition-shadow ${
        currentColor.bg
      } ${isDragging ? 'shadow-2xl ring-2 ring-amber-500 scale-105 cursor-grabbing' : 'cursor-grab'}`}
      style={{
        left: `${note.x}px`,
        top: `${note.y}px`,
        width: `${note.width}px`,
        minHeight: `${note.height}px`,
        transform: `rotate(${note.rotation || 0}deg)`,
      }}
    >
      {/* Top Tape Strip */}
      <div className="flex items-center justify-between pb-1 border-b border-black/10">
        <div className="flex items-center gap-1 opacity-70">
          <GripHorizontal className="w-3.5 h-3.5" />
          <span className="w-1.5 h-1.5 rounded-full bg-black/40" />
        </div>

        {!isReadOnly && (
          <div className="flex items-center gap-1 opacity-80 hover:opacity-100">
            {/* Color switcher */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowColorPicker(!showColorPicker);
                }}
                className="p-1 rounded-sm hover:bg-black/10 transition-colors"
                title="Cambiar color de la nota"
              >
                <Palette className="w-3 h-3" />
              </button>

              {showColorPicker && (
                <div
                  className="absolute right-0 top-6 bg-white p-1.5 rounded-lg shadow-xl border border-stone-200 flex gap-1 z-40"
                  onClick={(e) => e.stopPropagation()}
                >
                  {(Object.keys(STICKY_COLORS) as Array<keyof typeof STICKY_COLORS>).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        onUpdate({ ...note, color: c });
                        setShowColorPicker(false);
                      }}
                      className={`w-5 h-5 rounded-full border border-stone-300 ${STICKY_COLORS[c].dot} ${
                        note.color === c ? 'ring-2 ring-stone-900 ring-offset-1' : ''
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Delete button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(note.id);
              }}
              className="p-1 rounded-sm hover:bg-rose-500 hover:text-white transition-colors"
              title="Eliminar nota"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Note Text Content */}
      <textarea
        ref={textareaRef}
        value={text}
        onChange={handleTextChange}
        disabled={isReadOnly}
        placeholder="Escribe tu nota aquí..."
        className="w-full h-full flex-1 bg-transparent resize-none border-none outline-none font-handwriting text-lg leading-snug pt-1 text-stone-800 placeholder-stone-400"
        rows={4}
      />
    </div>
  );
};
