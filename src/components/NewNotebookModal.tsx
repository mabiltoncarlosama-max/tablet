import React, { useState } from 'react';
import { Notebook, CoverStyle, PaperColor, PaperTemplateType, Folder } from '../types';
import { COVER_PRESETS, PAPER_TEMPLATES, PAPER_COLORS } from '../data/templates';
import { NotebookCover } from './NotebookCover';
import { X, Sparkles, BookOpen } from 'lucide-react';

interface NewNotebookModalProps {
  isOpen: boolean;
  onClose: () => void;
  folders: Folder[];
  currentFolderId: string;
  onSaveNotebook: (notebook: Notebook) => void;
  editingNotebook?: Notebook | null;
}

export const NewNotebookModal: React.FC<NewNotebookModalProps> = ({
  isOpen,
  onClose,
  folders,
  currentFolderId,
  onSaveNotebook,
  editingNotebook,
}) => {
  const [title, setTitle] = useState(editingNotebook?.title || '');
  const [description, setDescription] = useState(editingNotebook?.description || '');
  const [folderId, setFolderId] = useState(
    editingNotebook?.folderId || (currentFolderId !== 'folder-all' ? currentFolderId : folders[1]?.id || 'folder-uni')
  );
  const [coverStyle, setCoverStyle] = useState<CoverStyle>(editingNotebook?.coverStyle || 'leather-brown');
  const [tag, setTag] = useState(editingNotebook?.tag || 'Apuntes');
  const [defaultTemplate, setDefaultTemplate] = useState<PaperTemplateType>(editingNotebook?.defaultTemplate || 'lined');
  const [defaultPaperColor, setDefaultPaperColor] = useState<PaperColor>(editingNotebook?.defaultPaperColor || 'ivory');
  const [activeTab, setActiveTab] = useState<'cover' | 'paper'>('cover');

  if (!isOpen) return null;

  const currentCoverDef = COVER_PRESETS.find((c) => c.id === coverStyle) || COVER_PRESETS[0];

  const previewNotebook: Notebook = {
    id: editingNotebook?.id || 'preview-nb',
    title: title.trim() || 'Nuevo Cuaderno',
    description: description.trim() || 'Mis apuntes y notas',
    folderId,
    coverStyle,
    coverColor: currentCoverDef.accent,
    accentColor: currentCoverDef.accent,
    tag,
    favorite: editingNotebook?.favorite || false,
    defaultTemplate,
    defaultPaperColor,
    orientation: 'portrait',
    createdAt: editingNotebook?.createdAt || Date.now(),
    updatedAt: Date.now(),
    pages: editingNotebook?.pages || [
      {
        id: `p-${Date.now()}-1`,
        pageNumber: 1,
        template: defaultTemplate,
        paperColor: defaultPaperColor,
        strokes: [],
        textBoxes: [],
        stickyNotes: [],
        stamps: [],
        images: [],
        updatedAt: Date.now(),
      },
    ],
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newNotebook: Notebook = {
      ...previewNotebook,
      title: title.trim(),
      description: description.trim(),
    };

    onSaveNotebook(newNotebook);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl shadow-xl border border-[#E5E2D9] w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-[#262626]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5E2D9] flex items-center justify-between bg-white">
          <div>
            <h2 className="text-lg font-bold text-[#262626] font-display flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#4A5568]" />
              {editingNotebook ? 'Editar Libreta' : 'Crear Nuevo Cuaderno Digital'}
            </h2>
            <p className="text-xs text-[#717171] mt-0.5">
              Personaliza el diseño de portada, carpeta de asignatura y plantilla de páginas.
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

        {/* Content Body */}
        <form onSubmit={handleCreate} className="flex-1 overflow-y-auto p-6 flex flex-col lg:flex-row gap-8 bg-[#FAF9F6]">
          {/* Left Column: Live 3D Cover Preview */}
          <div className="lg:w-72 flex flex-col items-center justify-center p-6 bg-[#F2F0EB] rounded-2xl border border-[#E5E2D9]">
            <span className="text-xs font-semibold text-[#717171] mb-4 uppercase tracking-wider">
              Vista Previa de Portada
            </span>
            <div className="transform scale-95 hover:scale-100 transition-transform">
              <NotebookCover notebook={previewNotebook} size="md" />
            </div>
            <p className="text-[11px] text-[#717171] text-center mt-4">
              Estilo: <strong className="text-[#262626]">{currentCoverDef.name}</strong>
            </p>
          </div>

          {/* Right Column: Configuration Form */}
          <div className="flex-1 flex flex-col gap-4">
            {/* Title & Tag */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#4A5568] mb-1">
                  Título del Cuaderno *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="ej. Cálculo II, Química Orgánica, Agenda 2026"
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E5E2D9] focus:outline-none focus:ring-1 focus:ring-[#262626] focus:border-[#262626] text-sm font-medium text-[#262626] bg-white placeholder-[#A09E96]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4A5568] mb-1">
                  Etiqueta / Asignatura
                </label>
                <input
                  type="text"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  placeholder="ej. Semestre I"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E5E2D9] focus:outline-none focus:ring-1 focus:ring-[#262626] focus:border-[#262626] text-sm font-medium text-[#262626] bg-white placeholder-[#A09E96]"
                />
              </div>
            </div>

            {/* Folder / Subject Selection */}
            <div>
              <label className="block text-xs font-semibold text-[#4A5568] mb-1">
                Carpeta / Categoría
              </label>
              <select
                value={folderId}
                onChange={(e) => setFolderId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#E5E2D9] focus:outline-none focus:ring-1 focus:ring-[#262626] focus:border-[#262626] text-sm font-medium text-[#262626] bg-white"
              >
                {folders
                  .filter((f) => f.id !== 'folder-all')
                  .map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      📁 {folder.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Tabs: Portada vs Plantilla de Hojas */}
            <div className="flex border-b border-[#E5E2D9] gap-4 mt-2">
              <button
                type="button"
                onClick={() => setActiveTab('cover')}
                className={`pb-2 text-xs font-semibold transition-colors border-b-2 flex items-center gap-1.5 ${
                  activeTab === 'cover'
                    ? 'border-[#262626] text-[#262626]'
                    : 'border-transparent text-[#717171] hover:text-[#262626]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Estilo de Portada ({COVER_PRESETS.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('paper')}
                className={`pb-2 text-xs font-semibold transition-colors border-b-2 flex items-center gap-1.5 ${
                  activeTab === 'paper'
                    ? 'border-[#262626] text-[#262626]'
                    : 'border-transparent text-[#717171] hover:text-[#262626]'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                Plantilla Inicial de Hoja
              </button>
            </div>

            {/* Cover Styles Selector */}
            {activeTab === 'cover' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto p-1">
                {COVER_PRESETS.map((cov) => {
                  const isSelected = coverStyle === cov.id;
                  return (
                    <div
                      key={cov.id}
                      onClick={() => setCoverStyle(cov.id)}
                      className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center gap-2.5 ${
                        isSelected
                          ? 'border-[#262626] ring-1 ring-[#262626] bg-[#F2F0EB] shadow-2xs'
                          : 'border-[#E5E2D9] hover:border-[#A09E96] bg-white'
                      }`}
                    >
                      <div
                        className={`w-8 h-10 rounded-sm bg-gradient-to-br ${cov.gradient} shadow-2xs border border-black/10 flex-shrink-0`}
                      />
                      <div className="overflow-hidden">
                        <div className="text-xs font-bold text-[#262626] truncate">
                          {cov.name}
                        </div>
                        <div className="text-[10px] text-[#717171]">{cov.category}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Paper Template Selector */}
            {activeTab === 'paper' && (
              <div className="flex flex-col gap-3">
                {/* Paper Color Bar */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-[#717171]">Color de hoja:</span>
                  {PAPER_COLORS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setDefaultPaperColor(c.id)}
                      className={`w-6 h-6 rounded-full border border-black/15 shadow-2xs transition-transform ${
                        defaultPaperColor === c.id ? 'ring-2 ring-[#262626] scale-110' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    />
                  ))}
                </div>

                {/* Templates list */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
                  {PAPER_TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => setDefaultTemplate(tpl.id)}
                      className={`p-2 rounded-xl border text-left transition-all ${
                        defaultTemplate === tpl.id
                          ? 'border-[#262626] ring-1 ring-[#262626] bg-[#F2F0EB] text-[#262626] font-bold'
                          : 'border-[#E5E2D9] hover:border-[#A09E96] bg-white text-[#262626]'
                      }`}
                    >
                      <div className="text-xs font-semibold">{tpl.name}</div>
                      <div className="text-[10px] text-[#717171] line-clamp-1">{tpl.category}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-[#4A5568] mb-1">
                Descripción / Notas
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="ej. Notas de clase, resúmenes y fórmulas"
                className="w-full px-3 py-2 rounded-xl border border-[#E5E2D9] focus:outline-none focus:ring-1 focus:ring-[#262626] text-xs font-medium text-[#262626] bg-white placeholder-[#A09E96]"
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E5E2D9] bg-white flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[#717171] hover:bg-[#F2F0EB] transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={!title.trim()}
            className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-[#262626] hover:bg-[#171717] disabled:opacity-40 text-white shadow-xs transition-colors"
          >
            {editingNotebook ? 'Guardar Cambios' : 'Crear Cuaderno'}
          </button>
        </div>
      </div>
    </div>
  );
};
