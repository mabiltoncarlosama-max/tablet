import React, { useState } from 'react';
import { PaperColor, PaperTemplateType } from '../types';
import { PAPER_TEMPLATES, PAPER_COLORS } from '../data/templates';
import { PaperBackground } from './PaperBackground';
import { X, Check, FileText, Grid, Calendar, Sparkles } from 'lucide-react';

interface TemplateSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTemplate: PaperTemplateType;
  selectedColor: PaperColor;
  onSelect: (template: PaperTemplateType, color: PaperColor) => void;
  title?: string;
}

export const TemplateSelectorModal: React.FC<TemplateSelectorModalProps> = ({
  isOpen,
  onClose,
  selectedTemplate,
  selectedColor,
  onSelect,
  title = 'Elegir Plantilla de Hoja',
}) => {
  const [currentTemplate, setCurrentTemplate] = useState<PaperTemplateType>(selectedTemplate);
  const [currentColor, setCurrentColor] = useState<PaperColor>(selectedColor);
  const [activeCategory, setActiveCategory] = useState<'Todos' | 'Escritura' | 'Cuadrícula' | 'Planificación' | 'Especial'>('Todos');

  if (!isOpen) return null;

  const filteredTemplates = PAPER_TEMPLATES.filter((t) => {
    if (activeCategory === 'Todos') return true;
    return t.category === activeCategory;
  });

  const handleConfirm = () => {
    onSelect(currentTemplate, currentColor);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl shadow-xl border border-[#E5E2D9] w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-[#262626]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5E2D9] flex items-center justify-between bg-white">
          <div>
            <h2 className="text-lg font-bold text-[#262626] font-display flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#4A5568]" />
              {title}
            </h2>
            <p className="text-xs text-[#717171] mt-0.5">
              Personaliza el estilo de rayado, cuadrícula, método Cornell o planificador para tus apuntes.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-[#F2F0EB] text-[#717171] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Paper Color Bar */}
        <div className="px-6 py-3 border-b border-[#E5E2D9] bg-[#FAF9F6] flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-semibold text-[#717171] uppercase tracking-wider">
            Tono de Papel:
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            {PAPER_COLORS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCurrentColor(c.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                  currentColor === c.id
                    ? 'ring-2 ring-[#262626] border-[#262626] bg-white shadow-2xs font-bold'
                    : 'border-[#E5E2D9] hover:border-[#A09E96] bg-[#FAF9F6]'
                }`}
              >
                <span
                  className="w-3.5 h-3.5 rounded-full border border-black/15"
                  style={{ backgroundColor: c.hex }}
                />
                <span className="text-[#262626]">{c.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="px-6 py-2.5 border-b border-[#E5E2D9] flex gap-2 overflow-x-auto bg-white">
          {(['Todos', 'Escritura', 'Cuadrícula', 'Planificación', 'Especial'] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                activeCategory === cat
                  ? 'bg-[#262626] text-white shadow-xs'
                  : 'bg-[#F2F0EB] text-[#4A5568] hover:bg-[#E5E2D9]'
              }`}
            >
              {cat === 'Escritura' && <FileText className="w-3.5 h-3.5" />}
              {cat === 'Cuadrícula' && <Grid className="w-3.5 h-3.5" />}
              {cat === 'Planificación' && <Calendar className="w-3.5 h-3.5" />}
              {cat === 'Especial' && <Sparkles className="w-3.5 h-3.5" />}
              {cat}
            </button>
          ))}
        </div>

        {/* Template Grid Preview */}
        <div className="flex-1 p-6 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 bg-[#FAF9F6]">
          {filteredTemplates.map((tpl) => {
            const isSelected = currentTemplate === tpl.id;
            return (
              <div
                key={tpl.id}
                onClick={() => setCurrentTemplate(tpl.id)}
                className={`group relative rounded-xl border-2 cursor-pointer transition-all flex flex-col p-2.5 bg-white hover:border-[#262626] ${
                  isSelected
                    ? 'border-[#262626] ring-2 ring-[#262626]/20 bg-[#F2F0EB]/50 shadow-sm'
                    : 'border-[#E5E2D9]'
                }`}
              >
                {/* Visual miniature preview */}
                <div className="relative w-full h-36 rounded-lg overflow-hidden border border-[#E5E2D9] shadow-2xs mb-2 bg-white">
                  <PaperBackground
                    template={tpl.id}
                    paperColor={currentColor}
                    width={300}
                    height={400}
                    showMarginGuide={true}
                  />

                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#262626] text-white flex items-center justify-center shadow-xs">
                      <Check className="w-3 h-3 stroke-[2.5]" />
                    </div>
                  )}
                </div>

                {/* Title and description */}
                <h4 className="font-semibold text-xs text-[#262626] leading-tight">
                  {tpl.name}
                </h4>
                <p className="text-[11px] text-[#717171] mt-1 line-clamp-2 leading-relaxed">
                  {tpl.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-[#E5E2D9] bg-white flex items-center justify-between">
          <div className="text-xs text-[#717171]">
            Plantilla seleccionada: <strong className="text-[#262626]">{PAPER_TEMPLATES.find((t) => t.id === currentTemplate)?.name}</strong>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#717171] hover:bg-[#F2F0EB] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#262626] hover:bg-[#171717] text-white shadow-xs transition-colors"
            >
              Aplicar Plantilla
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
