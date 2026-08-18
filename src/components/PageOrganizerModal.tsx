import React from 'react';
import { Notebook, Page, PaperTemplateType } from '../types';
import { PaperBackground } from './PaperBackground';
import { PAPER_TEMPLATES } from '../data/templates';
import { X, Plus, Copy, Trash2, ArrowLeft, ArrowRight, Layers, FileText } from 'lucide-react';

interface PageOrganizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  notebook: Notebook;
  currentPageIndex: number;
  onSelectPage: (pageIndex: number) => void;
  onAddPage: (template?: PaperTemplateType) => void;
  onDuplicatePage: (pageIndex: number) => void;
  onDeletePage: (pageIndex: number) => void;
  onMovePage: (fromIndex: number, toIndex: number) => void;
  onChangePageTemplate: (pageIndex: number, template: PaperTemplateType) => void;
}

export const PageOrganizerModal: React.FC<PageOrganizerModalProps> = ({
  isOpen,
  onClose,
  notebook,
  currentPageIndex,
  onSelectPage,
  onAddPage,
  onDuplicatePage,
  onDeletePage,
  onMovePage,
  onChangePageTemplate,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl shadow-xl border border-[#E5E2D9] w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden text-[#262626]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5E2D9] flex items-center justify-between bg-white">
          <div>
            <h2 className="text-lg font-bold text-[#262626] font-display flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#4A5568]" />
              Organizador de Páginas • {notebook.title}
            </h2>
            <p className="text-xs text-[#717171] mt-0.5">
              Reordena, duplica, cambia plantillas o añade nuevas hojas a tu libreta ({notebook.pages.length} páginas en total).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onAddPage()}
              className="px-3.5 py-1.5 rounded-xl bg-[#262626] hover:bg-[#171717] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nueva Hoja
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-[#F2F0EB] text-[#717171] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Pages Grid */}
        <div className="flex-1 p-6 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 bg-[#FAF9F6]">
          {notebook.pages.map((page: Page, index: number) => {
            const isCurrent = index === currentPageIndex;
            const tplDef = PAPER_TEMPLATES.find((t) => t.id === page.template) || PAPER_TEMPLATES[0];

            return (
              <div
                key={page.id}
                className={`relative flex flex-col rounded-xl bg-white p-3 shadow-2xs border-2 transition-all group ${
                  isCurrent
                    ? 'border-[#262626] ring-2 ring-[#262626]/20 shadow-md'
                    : 'border-[#E5E2D9] hover:border-[#A09E96]'
                }`}
              >
                {/* Page Number Badge */}
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`px-2 py-0.5 rounded-md text-xs font-semibold ${
                      isCurrent ? 'bg-[#262626] text-white' : 'bg-[#F2F0EB] text-[#4A5568]'
                    }`}
                  >
                    Página {index + 1}
                  </span>

                  <span className="text-[10px] text-[#717171] font-medium">
                    {page.strokes.length} trazos
                  </span>
                </div>

                {/* Thumbnail Preview container */}
                <div
                  onClick={() => {
                    onSelectPage(index);
                    onClose();
                  }}
                  className="relative w-full h-48 rounded-lg overflow-hidden border border-[#E5E2D9] cursor-pointer shadow-inner group-hover:scale-[1.02] transition-transform"
                >
                  <PaperBackground
                    template={page.template}
                    paperColor={page.paperColor}
                    width={340}
                    height={480}
                  />

                  {/* Overlaid strokes/text indicator */}
                  {(page.textBoxes.length > 0 || page.stickyNotes.length > 0 || page.stamps.length > 0) && (
                    <div className="absolute bottom-2 left-2 right-2 p-1 rounded bg-black/40 backdrop-blur-xs text-[10px] text-white flex items-center justify-between">
                      <span className="truncate">
                        {page.textBoxes[0]?.text || page.stickyNotes[0]?.text || 'Contenido digital'}
                      </span>
                    </div>
                  )}

                  {isCurrent && (
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-[#262626] text-white text-[10px] font-bold shadow-xs">
                      Actual
                    </div>
                  )}
                </div>

                {/* Template selector for this page */}
                <div className="mt-2 flex items-center justify-between">
                  <select
                    value={page.template}
                    onChange={(e) => onChangePageTemplate(index, e.target.value as PaperTemplateType)}
                    className="text-[11px] font-semibold text-[#4A5568] bg-[#F2F0EB] border border-[#E5E2D9] rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#262626] w-full"
                  >
                    {PAPER_TEMPLATES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Action buttons (Reorder, Duplicate, Delete) */}
                <div className="mt-2 pt-2 border-t border-[#E5E2D9] flex items-center justify-between text-[#717171]">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onMovePage(index, index - 1)}
                      disabled={index === 0}
                      className="p-1 rounded hover:bg-[#F2F0EB] disabled:opacity-30 transition-colors"
                      title="Mover a la izquierda / antes"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onMovePage(index, index + 1)}
                      disabled={index === notebook.pages.length - 1}
                      className="p-1 rounded hover:bg-[#F2F0EB] disabled:opacity-30 transition-colors"
                      title="Mover a la derecha / después"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onDuplicatePage(index)}
                      className="p-1 rounded hover:bg-[#F2F0EB] text-[#4A5568] transition-colors"
                      title="Duplicar página"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeletePage(index)}
                      disabled={notebook.pages.length <= 1}
                      className="p-1 rounded hover:bg-rose-50 text-rose-600 disabled:opacity-30 transition-colors"
                      title="Eliminar página"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#E5E2D9] bg-white flex items-center justify-between">
          <span className="text-xs text-[#717171]">
            Haz clic en cualquier hoja para abrirla en el lienzo principal.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#262626] text-white hover:bg-[#171717] shadow-xs transition-colors"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
