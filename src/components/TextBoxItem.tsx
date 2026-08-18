import React, { useState, useRef, useEffect } from 'react';
import { TextBox } from '../types';
import { Trash2, GripHorizontal, Bold, Italic, Type, Palette, Move } from 'lucide-react';

interface TextBoxItemProps {
  textBox: TextBox;
  isReadOnly?: boolean;
  onUpdate: (updated: TextBox) => void;
  onDelete: (id: string) => void;
  zoom?: number;
}

const TEXT_COLORS = [
  '#0F172A',
  '#1E293B',
  '#DC2626',
  '#2563EB',
  '#059669',
  '#D97706',
  '#7C3AED',
  '#DB2777',
  '#FFFFFF',
];

export const TextBoxItem: React.FC<TextBoxItemProps> = ({
  textBox,
  isReadOnly = false,
  onUpdate,
  onDelete,
  zoom = 1,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const [text, setText] = useState(textBox.text);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const dragStartRef = useRef<{ startX: number; startY: number; boxX: number; boxY: number }>({
    startX: 0,
    startY: 0,
    boxX: textBox.x,
    boxY: textBox.y,
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setText(textBox.text);
  }, [textBox.text]);

  const handleStartDrag = (e: React.PointerEvent) => {
    if (isReadOnly) return;
    e.stopPropagation();
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // Safe ignore
    }
    setIsDragging(true);
    setIsSelected(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      boxX: textBox.x,
      boxY: textBox.y,
    };
  };

  const handleDragMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    e.stopPropagation();
    const dx = (e.clientX - dragStartRef.current.startX) / zoom;
    const dy = (e.clientY - dragStartRef.current.startY) / zoom;
    const newX = Math.max(0, Math.round(dragStartRef.current.boxX + dx));
    const newY = Math.max(0, Math.round(dragStartRef.current.boxY + dy));

    onUpdate({
      ...textBox,
      x: newX,
      y: newY,
    });
  };

  const handleDragEnd = (e: React.PointerEvent) => {
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
      ...textBox,
      text: e.target.value,
    });
  };

  const cycleFontFamily = () => {
    const fonts = ['Caveat', 'Outfit', 'Plus Jakarta Sans', 'monospace'];
    const currentIdx = fonts.indexOf(textBox.fontFamily || 'Outfit');
    const nextFont = fonts[(currentIdx + 1) % fonts.length];
    onUpdate({ ...textBox, fontFamily: nextFont });
  };

  const getFontClass = () => {
    if (textBox.fontFamily === 'Caveat') return 'font-handwriting';
    if (textBox.fontFamily === 'Outfit') return 'font-display';
    if (textBox.fontFamily === 'monospace') return 'font-mono';
    return 'font-sans';
  };

  return (
    <div
      ref={containerRef}
      onClick={() => setIsSelected(true)}
      className={`absolute z-30 select-none rounded-lg transition-shadow group interactive-item ${
        isSelected && !isReadOnly
          ? 'ring-2 ring-blue-500 bg-white/80 backdrop-blur-xs shadow-lg p-2'
          : 'p-1 hover:ring-1 hover:ring-stone-400/50'
      }`}
      style={{
        left: `${textBox.x}px`,
        top: `${textBox.y}px`,
        width: `${textBox.width}px`,
        backgroundColor: textBox.backgroundColor || 'transparent',
      }}
    >
      {/* Floating Action Header & Drag Bar when Selected */}
      {isSelected && !isReadOnly && (
        <div
          className="flex items-center justify-between gap-1 mb-1.5 pb-1 border-b border-stone-200 text-stone-700 select-none bg-stone-100/95 -mx-1 px-1.5 py-1 rounded-t cursor-move"
          onPointerDown={handleStartDrag}
          onPointerMove={handleDragMove}
          onPointerUp={handleDragEnd}
          title="Arrastra esta barra para mover el texto por la hoja"
        >
          <div className="flex items-center gap-1">
            {/* Direct Drag Handle */}
            <div
              className="p-1 hover:bg-blue-100 text-blue-600 rounded flex items-center gap-1 cursor-grab active:cursor-grabbing font-bold text-[11px]"
              title="Arrastrar texto"
            >
              <Move className="w-3.5 h-3.5" />
              <span>Mover</span>
            </div>

            {/* Font Family Cycle */}
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={cycleFontFamily}
              className="px-1.5 py-0.5 text-xs font-semibold rounded hover:bg-stone-200 flex items-center gap-1 border border-stone-300 bg-white"
              title="Cambiar tipografía"
            >
              <Type className="w-3 h-3" />
              {textBox.fontFamily || 'Sans'}
            </button>

            {/* Font size decrement */}
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() =>
                onUpdate({ ...textBox, fontSize: Math.max(12, textBox.fontSize - 2) })
              }
              className="w-5 h-5 flex items-center justify-center rounded hover:bg-stone-200 text-xs font-bold bg-white border border-stone-200"
              title="Reducir tamaño"
            >
              -
            </button>
            <span className="text-xs font-semibold px-0.5">{textBox.fontSize}px</span>
            {/* Font size increment */}
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() =>
                onUpdate({ ...textBox, fontSize: Math.min(48, textBox.fontSize + 2) })
              }
              className="w-5 h-5 flex items-center justify-center rounded hover:bg-stone-200 text-xs font-bold bg-white border border-stone-200"
              title="Aumentar tamaño"
            >
              +
            </button>

            {/* Bold */}
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => onUpdate({ ...textBox, bold: !textBox.bold })}
              className={`p-1 rounded hover:bg-stone-200 ${
                textBox.bold ? 'bg-stone-300 font-bold text-blue-600' : ''
              }`}
              title="Negrita"
            >
              <Bold className="w-3 h-3" />
            </button>

            {/* Italic */}
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => onUpdate({ ...textBox, italic: !textBox.italic })}
              className={`p-1 rounded hover:bg-stone-200 ${
                textBox.italic ? 'bg-stone-300 italic text-blue-600' : ''
              }`}
              title="Cursiva"
            >
              <Italic className="w-3 h-3" />
            </button>
          </div>

          <div className="flex items-center gap-1" onPointerDown={(e) => e.stopPropagation()}>
            {/* Color Picker */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="p-1 rounded hover:bg-stone-200 flex items-center gap-1"
                title="Color del texto"
              >
                <Palette className="w-3 h-3" />
                <span
                  className="w-3.5 h-3.5 rounded-full border border-stone-400 inline-block shadow-2xs"
                  style={{ backgroundColor: textBox.color }}
                />
              </button>

              {showColorPicker && (
                <div className="absolute right-0 top-6 bg-white p-1.5 rounded-lg shadow-xl border border-stone-200 flex gap-1 z-50">
                  {TEXT_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        onUpdate({ ...textBox, color: c });
                        setShowColorPicker(false);
                      }}
                      className="w-5 h-5 rounded-full border border-stone-300 shadow-xs hover:scale-110"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Delete */}
            <button
              type="button"
              onClick={() => onDelete(textBox.id)}
              className="p-1 rounded hover:bg-rose-500 hover:text-white transition-colors"
              title="Eliminar texto"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Text Area */}
      <textarea
        ref={textareaRef}
        value={text}
        onChange={handleTextChange}
        disabled={isReadOnly}
        placeholder="Escribe aquí tus apuntes..."
        className={`w-full bg-transparent resize-none border-none outline-none leading-normal ${getFontClass()} ${
          textBox.bold ? 'font-bold' : ''
        } ${textBox.italic ? 'italic' : ''}`}
        style={{
          fontSize: `${textBox.fontSize}px`,
          color: textBox.color,
          minHeight: '40px',
        }}
        rows={Math.max(2, (text.match(/\n/g) || []).length + 1)}
      />
    </div>
  );
};
