import React, { useState, useRef, useEffect } from 'react';
import {
  Notebook,
  Page,
  ToolType,
  ShapeType,
  EraserMode,
  PaperTemplateType,
  PaperColor,
  StickyNote,
  TextBox,
  StampItem,
} from '../types';
import { NotebookCanvas } from './NotebookCanvas';
import { TemplateSelectorModal } from './TemplateSelectorModal';
import { PageOrganizerModal } from './PageOrganizerModal';
import { ExportModal } from './ExportModal';
import { STAMP_LIST, PAPER_TEMPLATES } from '../data/templates';
import {
  ArrowLeft,
  LassoSelect,
  Pen,
  Highlighter,
  Pencil,
  Eraser,
  Square,
  Circle,
  ArrowUpRight,
  Type,
  StickyNote as StickyIcon,
  Smile,
  Ruler,
  Image as ImageIcon,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Hand,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Layers,
  FileDown,
  Sparkles,
  Plus,
  Palette,
  Check,
  Slash,
  Flame,
} from 'lucide-react';

interface NotebookEditorViewProps {
  notebook: Notebook;
  onBackToLibrary: () => void;
  onUpdateNotebook: (updated: Notebook) => void;
}

const PALETTE_COLORS = [
  '#0F172A', // Negro pizarra
  '#2563EB', // Azul oxford
  '#DC2626', // Rojo corrección
  '#059669', // Verde esmeralda
  '#D97706', // Ámbar dorado
  '#7C3AED', // Púrpura intenso
  '#DB2777', // Rosa fucsia
  '#0284C7', // Cian cielo
  '#FFFFFF', // Blanco
];

const STROKE_SIZES = [2, 4, 8, 14, 24];

export const NotebookEditorView: React.FC<NotebookEditorViewProps> = ({
  notebook,
  onBackToLibrary,
  onUpdateNotebook,
}) => {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [activeTool, setActiveTool] = useState<ToolType>('pen');
  const [eraserMode, setEraserMode] = useState<EraserMode>('stroke');
  const [currentColor, setCurrentColor] = useState<string>('#0F172A');
  const [currentSize, setCurrentSize] = useState<number>(3);
  const [activeShape, setActiveShape] = useState<ShapeType>('rectangle');
  const [isPalmRejectionActive, setIsPalmRejectionActive] = useState<boolean>(true);
  const [showRuler, setShowRuler] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Tool popovers
  const [showShapePicker, setShowShapePicker] = useState<boolean>(false);
  const [showStampPicker, setShowStampPicker] = useState<boolean>(false);
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
  const [showEraserPicker, setShowEraserPicker] = useState<boolean>(false);

  // Modals
  const [showTemplateModal, setShowTemplateModal] = useState<boolean>(false);
  const [showPageOrganizer, setShowPageOrganizer] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);

  // Undo / Redo history stacks
  const [history, setHistory] = useState<Page[]>([]);
  const [redoStack, setRedoStack] = useState<Page[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const workspaceContainerRef = useRef<HTMLDivElement>(null);

  // Current page
  const safePageIndex = Math.min(currentPageIndex, notebook.pages.length - 1);
  const currentPage = notebook.pages[safePageIndex] || notebook.pages[0];

  // Auto-fit zoom on mount
  useEffect(() => {
    const handleResize = () => {
      if (workspaceContainerRef.current) {
        const rect = workspaceContainerRef.current.getBoundingClientRect();
        // Calculate fit scale for 850px width canvas with padding
        const scale = Math.min(1.2, Math.max(0.65, (rect.width - 48) / 880));
        setZoom(Math.round(scale * 100) / 100);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update page with undo tracking
  const handleUpdatePage = (updatedPage: Page) => {
    // Push current state to undo history
    setHistory((prev) => [...prev.slice(-20), currentPage]);
    setRedoStack([]);

    const updatedPages = [...notebook.pages];
    updatedPages[safePageIndex] = updatedPage;

    onUpdateNotebook({
      ...notebook,
      pages: updatedPages,
      updatedAt: Date.now(),
    });
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setRedoStack((prev) => [...prev, currentPage]);
    setHistory((prev) => prev.slice(0, prev.length - 1));

    const updatedPages = [...notebook.pages];
    updatedPages[safePageIndex] = previous;
    onUpdateNotebook({ ...notebook, pages: updatedPages, updatedAt: Date.now() });
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setHistory((prev) => [...prev, currentPage]);
    setRedoStack((prev) => prev.slice(0, prev.length - 1));

    const updatedPages = [...notebook.pages];
    updatedPages[safePageIndex] = next;
    onUpdateNotebook({ ...notebook, pages: updatedPages, updatedAt: Date.now() });
  };

  // Keyboard shortcuts (Ctrl+Z, Ctrl+Y, Page Nav)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'TEXTAREA' || (e.target as HTMLElement).tagName === 'INPUT') {
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'ArrowRight' && e.altKey) {
        if (currentPageIndex < notebook.pages.length - 1) setCurrentPageIndex(currentPageIndex + 1);
      } else if (e.key === 'ArrowLeft' && e.altKey) {
        if (currentPageIndex > 0) setCurrentPageIndex(currentPageIndex - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Page management actions
  const handleAddNewPage = (template?: PaperTemplateType) => {
    const newPage: Page = {
      id: `p-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      pageNumber: notebook.pages.length + 1,
      template: template || notebook.defaultTemplate,
      paperColor: notebook.defaultPaperColor,
      strokes: [],
      textBoxes: [],
      stickyNotes: [],
      stamps: [],
      images: [],
      updatedAt: Date.now(),
    };

    const newPages = [...notebook.pages, newPage];
    onUpdateNotebook({
      ...notebook,
      pages: newPages,
      updatedAt: Date.now(),
    });
    setCurrentPageIndex(newPages.length - 1);
  };

  const handleDuplicatePage = (index: number) => {
    const target = notebook.pages[index];
    const duplicated: Page = {
      ...target,
      id: `p-${Date.now()}-dup`,
      pageNumber: notebook.pages.length + 1,
      updatedAt: Date.now(),
    };
    const newPages = [...notebook.pages];
    newPages.splice(index + 1, 0, duplicated);
    onUpdateNotebook({ ...notebook, pages: newPages, updatedAt: Date.now() });
    setCurrentPageIndex(index + 1);
  };

  const handleDeletePage = (index: number) => {
    if (notebook.pages.length <= 1) return;
    const newPages = notebook.pages.filter((_, i) => i !== index);
    onUpdateNotebook({ ...notebook, pages: newPages, updatedAt: Date.now() });
    setCurrentPageIndex(Math.max(0, index - 1));
  };

  const handleMovePage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= notebook.pages.length) return;
    const newPages = [...notebook.pages];
    const [moved] = newPages.splice(fromIndex, 1);
    newPages.splice(toIndex, 0, moved);
    onUpdateNotebook({ ...notebook, pages: newPages, updatedAt: Date.now() });
    setCurrentPageIndex(toIndex);
  };

  const handleChangePageTemplate = (index: number, template: PaperTemplateType, color?: PaperColor) => {
    const updatedPages = [...notebook.pages];
    updatedPages[index] = {
      ...updatedPages[index],
      template,
      paperColor: color || updatedPages[index].paperColor,
      updatedAt: Date.now(),
    };
    onUpdateNotebook({ ...notebook, pages: updatedPages, updatedAt: Date.now() });
  };

  // Add Interactive Items
  const handleAddTextBox = () => {
    const newTb: TextBox = {
      id: `tb-${Date.now()}`,
      x: 100,
      y: 160 + currentPage.textBoxes.length * 40,
      width: 400,
      height: 60,
      text: '',
      fontSize: 18,
      fontFamily: 'Outfit',
      color: currentColor === '#FFFFFF' ? '#0F172A' : currentColor,
    };
    handleUpdatePage({
      ...currentPage,
      textBoxes: [...currentPage.textBoxes, newTb],
    });
  };

  const handleAddStickyNote = (color: StickyNote['color'] = 'yellow') => {
    const newNote: StickyNote = {
      id: `sn-${Date.now()}`,
      x: 120 + (currentPage.stickyNotes.length % 3) * 60,
      y: 200 + (currentPage.stickyNotes.length % 3) * 60,
      width: 220,
      height: 150,
      text: '',
      color,
      rotation: Math.floor(Math.random() * 6) - 3,
    };
    handleUpdatePage({
      ...currentPage,
      stickyNotes: [...currentPage.stickyNotes, newNote],
    });
  };

  const handleAddStamp = (stampPreset: (typeof STAMP_LIST)[0]) => {
    const newStamp: StampItem = {
      id: `st-${Date.now()}`,
      x: 350,
      y: 180 + currentPage.stamps.length * 30,
      icon: stampPreset.icon,
      label: stampPreset.label,
      color: stampPreset.color,
      size: 32,
    };
    handleUpdatePage({
      ...currentPage,
      stamps: [...currentPage.stamps, newStamp],
    });
    setShowStampPicker(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (dataUrl) {
        const newImg = {
          id: `img-${Date.now()}`,
          x: 150,
          y: 200,
          width: 320,
          height: 240,
          dataUrl,
        };
        handleUpdatePage({
          ...currentPage,
          images: [...currentPage.images, newImg],
        });
      }
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const currentTemplateName =
    PAPER_TEMPLATES.find((t) => t.id === currentPage.template)?.name || 'Rayada';

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F2F0EB]/60 text-[#262626] select-none overflow-hidden touch-none font-sans">
      {/* Top Header Bar */}
      <header className="px-4 py-2.5 bg-white border-b border-[#E5E2D9] shadow-xs flex items-center justify-between gap-2 z-40">
        {/* Left: Back to library & Notebook title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToLibrary}
            className="p-2 rounded-xl hover:bg-[#F2F0EB] text-[#262626] flex items-center gap-1.5 text-xs font-semibold transition-colors"
            title="Volver a la Estantería"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2]" />
            <span className="hidden sm:inline">Mis Cuadernos</span>
          </button>

          <div className="h-5 w-[1px] bg-[#E5E2D9] hidden sm:block" />

          {/* Title & Tag */}
          <div className="flex items-center gap-2">
            <span
              className="w-3.5 h-4.5 rounded-xs shadow-xs border border-black/10"
              style={{ backgroundColor: notebook.coverColor }}
            />
            <h2 className="text-sm font-bold text-[#262626] font-display truncate max-w-[160px] sm:max-w-xs">
              {notebook.title}
            </h2>
            {notebook.tag && (
              <span className="hidden md:inline text-[10px] font-medium px-2 py-0.5 rounded-md bg-[#F2F0EB] text-[#4A5568] border border-[#E5E2D9]">
                {notebook.tag}
              </span>
            )}
          </div>
        </div>

        {/* Center: Page Navigation & Template Switcher */}
        <div className="flex items-center gap-1 bg-[#F2F0EB] p-0.5 rounded-xl border border-[#E5E2D9]">
          <button
            type="button"
            onClick={() => setCurrentPageIndex(Math.max(0, safePageIndex - 1))}
            disabled={safePageIndex === 0}
            className="p-1.5 rounded-lg hover:bg-white text-[#262626] disabled:opacity-30 transition-colors"
            title="Página anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setShowPageOrganizer(true)}
            className="px-2.5 py-1 rounded-lg hover:bg-white text-xs font-semibold text-[#262626] flex items-center gap-1.5 transition-colors"
            title="Ver todas las páginas"
          >
            <Layers className="w-3.5 h-3.5 text-[#4A5568]" />
            <span>
              {safePageIndex + 1} / {notebook.pages.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentPageIndex(Math.min(notebook.pages.length - 1, safePageIndex + 1))}
            disabled={safePageIndex === notebook.pages.length - 1}
            className="p-1.5 rounded-lg hover:bg-white text-[#262626] disabled:opacity-30 transition-colors"
            title="Página siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="h-4 w-[1px] bg-[#E5E2D9] mx-0.5" />

          {/* Quick Add Page Button */}
          <button
            type="button"
            onClick={() => handleAddNewPage()}
            className="p-1.5 rounded-lg hover:bg-white text-[#262626] transition-colors"
            title="Añadir nueva página"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
          </button>

          {/* Template badge */}
          <button
            type="button"
            onClick={() => setShowTemplateModal(true)}
            className="hidden lg:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-[#E5E2D9] text-[11px] font-medium text-[#4A5568] hover:border-[#262626] transition-colors"
            title="Cambiar plantilla de esta hoja"
          >
            <span>📄 {currentTemplateName}</span>
          </button>
        </div>

        {/* Right: Undo, Redo, Palm Rejection, Zoom, Export */}
        <div className="flex items-center gap-1.5">
          {/* Undo / Redo */}
          <button
            type="button"
            onClick={handleUndo}
            disabled={history.length === 0}
            className="p-2 rounded-xl hover:bg-[#F2F0EB] text-[#262626] disabled:opacity-30 transition-colors"
            title="Deshacer (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            className="p-2 rounded-xl hover:bg-[#F2F0EB] text-[#262626] disabled:opacity-30 transition-colors"
            title="Rehacer (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          <div className="h-5 w-[1px] bg-[#E5E2D9] hidden sm:block" />

          {/* Palm Rejection Toggle */}
          <button
            type="button"
            onClick={() => setIsPalmRejectionActive(!isPalmRejectionActive)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isPalmRejectionActive
                ? 'bg-[#262626] text-white shadow-xs'
                : 'bg-[#F2F0EB] text-[#4A5568] hover:bg-[#E5E2D9]'
            }`}
            title="Modo Rechazo de Palma (Ignora toques accidentales de la mano al escribir con stylus)"
          >
            <ShieldCheck className="w-3.5 h-3.5 stroke-[2]" />
            <span className="hidden md:inline">Rechazo Palma</span>
          </button>

          {/* Zoom controls */}
          <div className="hidden sm:flex items-center bg-[#F2F0EB] p-0.5 rounded-xl border border-[#E5E2D9]">
            <button
              type="button"
              onClick={() => setZoom((prev) => Math.max(0.5, Math.round((prev - 0.1) * 10) / 10))}
              className="p-1.5 rounded-lg hover:bg-white text-[#4A5568]"
              title="Reducir zoom"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-semibold text-[#262626] px-1.5 min-w-[40px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((prev) => Math.min(2.2, Math.round((prev + 0.1) * 10) / 10))}
              className="p-1.5 rounded-lg hover:bg-white text-[#4A5568]"
              title="Aumentar zoom"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Export button */}
          <button
            type="button"
            onClick={() => setShowExportModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-[#262626] hover:bg-[#171717] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exportar</span>
          </button>
        </div>
      </header>

      {/* Main Canvas Workspace with Floating Tablet Stylus Toolbar */}
      <div className="flex-1 relative flex overflow-hidden bg-[#FAF9F6]">
        {/* Floating Stylus & Pen Tool Palette (Dockable on top or floating) */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 p-1 bg-white/95 backdrop-blur-md rounded-2xl shadow-md border border-[#E5E2D9]">
          {/* Lasso / Selection Tool */}
          <button
            type="button"
            onClick={() => {
              setActiveTool('select');
            }}
            className={`p-2 rounded-xl flex items-center gap-1.5 text-xs font-medium transition-all ${
              activeTool === 'select'
                ? 'bg-[#2563EB] text-white shadow-xs'
                : 'text-[#4A5568] hover:bg-[#F2F0EB]'
            }`}
            title="Lazo de Selección: Señala trazos, notas o figuras para moverlos, duplicarlos, editarlos o borrarlos"
          >
            <LassoSelect className="w-4 h-4 stroke-[2]" />
            <span className="hidden md:inline">Señalar / Lazo</span>
          </button>

          <div className="h-5 w-[1px] bg-[#E5E2D9] mx-0.5" />

          {/* Pen / Pluma */}
          <button
            type="button"
            onClick={() => {
              setActiveTool('pen');
              setCurrentSize(3);
            }}
            className={`p-2 rounded-xl flex items-center gap-1.5 text-xs font-medium transition-all ${
              activeTool === 'pen'
                ? 'bg-[#262626] text-white shadow-xs'
                : 'text-[#4A5568] hover:bg-[#F2F0EB]'
            }`}
            title="Pluma de tinta suave"
          >
            <Pen className="w-4 h-4 stroke-[2]" />
            <span className="hidden md:inline">Pluma</span>
          </button>

          {/* Highlighter / Resaltador */}
          <button
            type="button"
            onClick={() => {
              setActiveTool('highlighter');
              setCurrentSize(18);
              if (currentColor === '#0F172A') setCurrentColor('#D97706');
            }}
            className={`p-2 rounded-xl flex items-center gap-1.5 text-xs font-medium transition-all ${
              activeTool === 'highlighter'
                ? 'bg-[#262626] text-white shadow-xs'
                : 'text-[#4A5568] hover:bg-[#F2F0EB]'
            }`}
            title="Resaltador / Subrayador"
          >
            <Highlighter className="w-4 h-4 stroke-[2]" />
            <span className="hidden md:inline">Resaltar</span>
          </button>

          {/* Pencil / Lápiz */}
          <button
            type="button"
            onClick={() => {
              setActiveTool('pencil');
              setCurrentSize(2);
            }}
            className={`p-2 rounded-xl flex items-center gap-1.5 text-xs font-medium transition-all ${
              activeTool === 'pencil'
                ? 'bg-[#262626] text-white shadow-xs'
                : 'text-[#4A5568] hover:bg-[#F2F0EB]'
            }`}
            title="Lápiz grafito"
          >
            <Pencil className="w-4 h-4 stroke-[2]" />
            <span className="hidden md:inline">Lápiz</span>
          </button>

          {/* Smart Eraser with Mode Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                if (activeTool === 'eraser') setShowEraserPicker(!showEraserPicker);
                else {
                  setActiveTool('eraser');
                  setShowEraserPicker(false);
                }
              }}
              className={`p-2 rounded-xl flex items-center gap-1.5 text-xs font-medium transition-all ${
                activeTool === 'eraser'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-[#4A5568] hover:bg-[#F2F0EB]'
              }`}
              title="Borrador inteligente de trazos"
            >
              <Eraser className="w-4 h-4 stroke-[2]" />
              <span className="hidden md:inline">Borrador</span>
            </button>

            {showEraserPicker && activeTool === 'eraser' && (
              <div className="absolute top-12 left-0 bg-white rounded-xl shadow-xl border border-[#E5E2D9] p-2 w-48 z-50 flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setEraserMode('stroke');
                    setShowEraserPicker(false);
                  }}
                  className={`p-2 rounded-lg text-left text-xs font-semibold flex items-center justify-between ${
                    eraserMode === 'stroke' ? 'bg-rose-50 text-rose-700 font-bold' : 'hover:bg-[#F2F0EB]'
                  }`}
                >
                  <span>Borrador de Trazo Entero</span>
                  {eraserMode === 'stroke' && <Check className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
          </div>

          {/* Shapes Tool */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setActiveTool('shape');
                setShowShapePicker(!showShapePicker);
              }}
              className={`p-2 rounded-xl flex items-center gap-1.5 text-xs font-medium transition-all ${
                activeTool === 'shape'
                  ? 'bg-[#262626] text-white shadow-xs'
                  : 'text-[#4A5568] hover:bg-[#F2F0EB]'
              }`}
              title="Herramienta de Formas Geométricas"
            >
              <Square className="w-4 h-4 stroke-[2]" />
              <span className="hidden md:inline">Formas</span>
            </button>

            {showShapePicker && (
              <div className="absolute top-12 left-0 bg-white rounded-xl shadow-xl border border-[#E5E2D9] p-1.5 flex gap-1 z-50">
                {(
                  [
                    { id: 'rectangle', icon: <Square className="w-4 h-4" />, name: 'Rectángulo' },
                    { id: 'circle', icon: <Circle className="w-4 h-4" />, name: 'Círculo' },
                    { id: 'arrow', icon: <ArrowUpRight className="w-4 h-4" />, name: 'Flecha' },
                    { id: 'line', icon: <Slash className="w-4 h-4" />, name: 'Línea' },
                    { id: 'star', icon: <Sparkles className="w-4 h-4" />, name: 'Estrella' },
                  ] as const
                ).map((sh) => (
                  <button
                    key={sh.id}
                    type="button"
                    onClick={() => {
                      setActiveShape(sh.id);
                      setShowShapePicker(false);
                    }}
                    className={`p-2 rounded-lg ${
                      activeShape === sh.id ? 'bg-[#262626] text-white' : 'hover:bg-[#F2F0EB] text-[#4A5568]'
                    }`}
                    title={sh.name}
                  >
                    {sh.icon}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="h-5 w-[1px] bg-[#E5E2D9] mx-0.5" />

          {/* Text Note Button */}
          <button
            type="button"
            onClick={handleAddTextBox}
            className="p-2 rounded-xl hover:bg-[#F2F0EB] text-[#4A5568] flex items-center gap-1.5 text-xs font-medium transition-colors"
            title="Añadir texto digital"
          >
            <Type className="w-4 h-4 stroke-[2]" />
            <span className="hidden lg:inline">Texto</span>
          </button>

          {/* Sticky Note Button */}
          <button
            type="button"
            onClick={() => handleAddStickyNote('yellow')}
            className="p-2 rounded-xl hover:bg-[#F2F0EB] text-[#4A5568] flex items-center gap-1.5 text-xs font-medium transition-colors"
            title="Pegar nota adhesiva (Post-it)"
          >
            <StickyIcon className="w-4 h-4 stroke-[2]" />
            <span className="hidden lg:inline">Post-it</span>
          </button>

          {/* Study Stamps / Stickers */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowStampPicker(!showStampPicker)}
              className="p-2 rounded-xl hover:bg-[#F2F0EB] text-[#4A5568] flex items-center gap-1.5 text-xs font-medium transition-colors"
              title="Sellos y stickers de estudio"
            >
              <Smile className="w-4 h-4 stroke-[2]" />
              <span className="hidden lg:inline">Sellos</span>
            </button>

            {showStampPicker && (
              <div className="absolute top-12 right-0 bg-white rounded-2xl shadow-xl border border-[#E5E2D9] p-3 w-64 z-50 animate-in fade-in">
                <div className="text-xs font-bold text-[#262626] mb-2">Sellos de Estudio:</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {STAMP_LIST.map((stamp) => (
                    <button
                      key={stamp.label}
                      type="button"
                      onClick={() => handleAddStamp(stamp)}
                      className="p-1.5 rounded-xl hover:bg-[#F2F0EB] flex items-center gap-2 text-left text-xs font-medium text-[#262626]"
                    >
                      <span className="text-base">{stamp.icon}</span>
                      <span className="truncate">{stamp.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Ruler Guide Toggle */}
          <button
            type="button"
            onClick={() => setShowRuler(!showRuler)}
            className={`p-2 rounded-xl text-xs font-medium transition-colors ${
              showRuler ? 'bg-[#262626] text-white' : 'hover:bg-[#F2F0EB] text-[#4A5568]'
            }`}
            title="Regla guía milimétrica"
          >
            <Ruler className="w-4 h-4 stroke-[2]" />
          </button>

          {/* Image Upload button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-xl hover:bg-[#F2F0EB] text-[#4A5568] text-xs font-medium transition-colors"
            title="Insertar imagen o diagrama"
          >
            <ImageIcon className="w-4 h-4 stroke-[2]" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />

          <div className="h-5 w-[1px] bg-[#E5E2D9] mx-0.5" />

          {/* Color Swatch / Quick Colors */}
          <div className="flex items-center gap-1">
            {PALETTE_COLORS.slice(0, 5).map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setCurrentColor(color)}
                className={`w-5 h-5 rounded-full border border-black/15 shadow-2xs transition-transform ${
                  currentColor === color ? 'ring-2 ring-[#262626] scale-110' : 'hover:scale-105'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}

            {/* Color Wheel / Full Palette popover */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="w-5 h-5 rounded-full border border-[#E5E2D9] flex items-center justify-center bg-[#F2F0EB] hover:bg-[#E5E2D9]"
                title="Más colores"
              >
                <Palette className="w-3 h-3 text-[#4A5568]" />
              </button>

              {showColorPicker && (
                <div className="absolute top-10 right-0 bg-white rounded-xl shadow-xl border border-[#E5E2D9] p-3 w-48 z-50">
                  <div className="grid grid-cols-5 gap-2">
                    {PALETTE_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => {
                          setCurrentColor(color);
                          setShowColorPicker(false);
                        }}
                        className={`w-6 h-6 rounded-full border border-black/15 shadow-2xs ${
                          currentColor === color ? 'ring-2 ring-[#262626] scale-110' : ''
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="h-5 w-[1px] bg-[#E5E2D9] mx-0.5" />

          {/* Stroke Size presets */}
          <div className="flex items-center gap-0.5">
            {STROKE_SIZES.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setCurrentSize(size)}
                className={`w-6 h-6 rounded-lg flex items-center justify-center hover:bg-[#F2F0EB] ${
                  currentSize === size ? 'bg-[#F2F0EB] ring-1 ring-[#262626]' : ''
                }`}
                title={`Grosor ${size}px`}
              >
                <span
                  className="rounded-full bg-[#262626]"
                  style={{
                    width: `${Math.min(14, size * 1.2)}px`,
                    height: `${Math.min(14, size * 1.2)}px`,
                  }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Center Canvas Viewer */}
        <div
          ref={workspaceContainerRef}
          className="flex-1 overflow-auto flex justify-center items-start pt-24 pb-32 px-4"
        >
          <NotebookCanvas
            page={currentPage}
            activeTool={activeTool}
            eraserMode={eraserMode}
            currentColor={currentColor}
            currentSize={currentSize}
            activeShape={activeShape}
            isPalmRejectionActive={isPalmRejectionActive}
            zoom={zoom}
            panOffset={panOffset}
            showRuler={showRuler}
            onCloseRuler={() => setShowRuler(false)}
            onUpdatePage={handleUpdatePage}
          />
        </div>
      </div>

      {/* Modals */}
      {showTemplateModal && (
        <TemplateSelectorModal
          isOpen={showTemplateModal}
          onClose={() => setShowTemplateModal(false)}
          selectedTemplate={currentPage.template}
          selectedColor={currentPage.paperColor}
          onSelect={(tpl, color) => handleChangePageTemplate(safePageIndex, tpl, color)}
        />
      )}

      {showPageOrganizer && (
        <PageOrganizerModal
          isOpen={showPageOrganizer}
          onClose={() => setShowPageOrganizer(false)}
          notebook={notebook}
          currentPageIndex={safePageIndex}
          onSelectPage={(idx) => setCurrentPageIndex(idx)}
          onAddPage={handleAddNewPage}
          onDuplicatePage={handleDuplicatePage}
          onDeletePage={handleDeletePage}
          onMovePage={handleMovePage}
          onChangePageTemplate={(idx, tpl) => handleChangePageTemplate(idx, tpl)}
        />
      )}

      {showExportModal && (
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          notebook={notebook}
          currentPageIndex={safePageIndex}
        />
      )}
    </div>
  );
};
