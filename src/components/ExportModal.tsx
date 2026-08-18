import React, { useState } from 'react';
import { Notebook } from '../types';
import jsPDF from 'jspdf';
import { X, FileDown, Image, FileCode, CheckCircle, Loader2, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { renderFullPageToCanvas } from '../utils/canvasRenderer';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  notebook: Notebook;
  currentPageIndex: number;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  notebook,
  currentPageIndex,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Export current page or all pages to high-res PDF with exact templates
  const handleExportPDF = async (allPages: boolean) => {
    try {
      setIsExporting(true);
      setSuccessMessage(null);

      const pdf = new jsPDF({
        orientation: notebook.orientation === 'landscape' ? 'landscape' : 'portrait',
        unit: 'pt',
        format: 'a4',
      });

      const pagesToExport = allPages ? notebook.pages : [notebook.pages[currentPageIndex]];
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < pagesToExport.length; i++) {
        setExportProgress(`Renderizando página ${i + 1} de ${pagesToExport.length}...`);
        if (i > 0) pdf.addPage('a4', notebook.orientation === 'landscape' ? 'landscape' : 'portrait');

        const page = pagesToExport[i];
        // Render full page canvas including template, background, and strokes at 2.5x retina DPR
        const pageCanvas = await renderFullPageToCanvas(page, 850, 1200, 2.5);
        const imgData = pageCanvas.toDataURL('image/jpeg', 0.95);

        pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
      }

      const fileName = `${notebook.title.replace(/\s+/g, '_')}_${
        allPages ? 'CuadernoCompleto' : `Hoja_${currentPageIndex + 1}`
      }.pdf`;

      pdf.save(fileName);
      setSuccessMessage('¡Documento PDF exportado con tu plantilla real!');
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.7 } });
    } catch (e) {
      console.error('Export PDF error:', e);
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  // Export current page as crisp PNG image with real template
  const handleExportPNG = async () => {
    try {
      setIsExporting(true);
      setExportProgress('Generando imagen de alta resolución...');
      const page = notebook.pages[currentPageIndex];
      const pageCanvas = await renderFullPageToCanvas(page, 850, 1200, 3); // 3x ultra-crisp

      const dataUrl = pageCanvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${notebook.title.replace(/\s+/g, '_')}_Hoja_${currentPageIndex + 1}.png`;
      link.href = dataUrl;
      link.click();
      setSuccessMessage('¡Imagen PNG de alta definición descargada!');
      confetti({ particleCount: 35, spread: 60 });
    } catch (e) {
      console.error('Export PNG error:', e);
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  // Export as JSON backup
  const handleExportJSON = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(notebook, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `${notebook.title.replace(/\s+/g, '_')}_respaldo.json`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    setSuccessMessage('¡Copia de respaldo JSON guardada!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl shadow-xl border border-[#E5E2D9] w-full max-w-lg overflow-hidden flex flex-col text-[#262626]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5E2D9] flex items-center justify-between bg-white">
          <div>
            <h2 className="text-lg font-bold text-[#262626] font-display flex items-center gap-2">
              <FileDown className="w-5 h-5 text-[#4A5568]" />
              Exportar Apuntes & Cuaderno
            </h2>
            <p className="text-xs text-[#717171] mt-0.5">
              Guarda tus hojas con la plantilla actual (cuadros, líneas, Cornell, etc.) y alta definición.
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

        {/* Options */}
        <div className="p-6 flex flex-col gap-3 bg-[#FAF9F6]">
          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {isExporting && exportProgress && (
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
              <span>{exportProgress}</span>
            </div>
          )}

          {/* Option 1: PDF All Pages */}
          <button
            type="button"
            onClick={() => handleExportPDF(true)}
            disabled={isExporting}
            className="p-4 rounded-xl border border-[#E5E2D9] hover:border-[#262626] bg-white hover:bg-[#F2F0EB] transition-all flex items-center justify-between text-left group shadow-2xs disabled:opacity-60"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#262626] text-white flex items-center justify-center shadow-xs">
                <FileDown className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-[#262626]">
                    Exportar Cuaderno Completo (PDF)
                  </h4>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Plantilla Exacta
                  </span>
                </div>
                <p className="text-xs text-[#717171] mt-0.5">
                  Todas las {notebook.pages.length} páginas con sus plantillas, notas y trazos nítidos.
                </p>
              </div>
            </div>
            {isExporting ? <Loader2 className="w-5 h-5 animate-spin text-[#262626]" /> : null}
          </button>

          {/* Option 2: PDF Current Page */}
          <button
            type="button"
            onClick={() => handleExportPDF(false)}
            disabled={isExporting}
            className="p-4 rounded-xl border border-[#E5E2D9] hover:border-[#262626] bg-white hover:bg-[#F2F0EB] transition-all flex items-center justify-between text-left group shadow-2xs disabled:opacity-60"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#4A5568] text-white flex items-center justify-center shadow-xs">
                <FileDown className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#262626]">
                  Exportar Hoja Actual (PDF)
                </h4>
                <p className="text-xs text-[#717171]">
                  Página {currentPageIndex + 1} con su fondo y formato individual.
                </p>
              </div>
            </div>
          </button>

          {/* Option 3: PNG Image */}
          <button
            type="button"
            onClick={handleExportPNG}
            disabled={isExporting}
            className="p-4 rounded-xl border border-[#E5E2D9] hover:border-[#262626] bg-white hover:bg-[#F2F0EB] transition-all flex items-center justify-between text-left group shadow-2xs disabled:opacity-60"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#717171] text-white flex items-center justify-center shadow-xs">
                <Image className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#262626]">
                  Guardar como Imagen Ultra-HD (PNG)
                </h4>
                <p className="text-xs text-[#717171]">
                  Captura nítida de 300 DPI de la hoja activa.
                </p>
              </div>
            </div>
          </button>

          {/* Option 4: Backup JSON */}
          <button
            type="button"
            onClick={handleExportJSON}
            className="p-4 rounded-xl border border-[#E5E2D9] hover:border-[#262626] bg-white hover:bg-[#F2F0EB] transition-all flex items-center justify-between text-left group shadow-2xs"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#262626] text-white flex items-center justify-center shadow-xs">
                <FileCode className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#262626]">
                  Copia de Seguridad (.JSON)
                </h4>
                <p className="text-xs text-[#717171]">
                  Respaldo digital de trazos y datos para restaurar en cualquier momento.
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E5E2D9] bg-white flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#262626] text-white hover:bg-[#171717] shadow-xs transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
