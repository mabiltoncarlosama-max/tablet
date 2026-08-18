import { Page, Stroke, PaperColor, PaperTemplateType } from '../types';
import { PAPER_COLORS } from '../data/templates';
import { renderSmoothBezierStroke } from './curveSmoother';

// Draw background template patterns directly onto an HTML5 Canvas context
export function drawPaperTemplateToCanvas(
  ctx: CanvasRenderingContext2D,
  template: PaperTemplateType,
  paperColor: PaperColor,
  width: number,
  height: number
) {
  const colorDef = PAPER_COLORS.find((c) => c.id === paperColor) || PAPER_COLORS[0];
  const isDark = colorDef.isDark || template.startsWith('dark-');

  const bgColor = isDark
    ? paperColor === 'slate'
      ? '#0F172A'
      : '#1C1917'
    : colorDef.hex;

  // Background Fill
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);

  const lineColor = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(59, 130, 246, 0.22)';
  const secondaryLineColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(148, 163, 184, 0.25)';
  const marginLineColor = isDark ? 'rgba(244, 63, 94, 0.4)' : 'rgba(239, 68, 68, 0.35)';
  const dotColor = isDark ? 'rgba(255, 255, 255, 0.35)' : 'rgba(100, 116, 139, 0.4)';
  const headerTextColor = isDark ? '#E2E8F0' : '#475569';
  const labelTextColor = isDark ? '#94A3B8' : '#64748B';

  switch (template) {
    case 'lined':
    case 'dark-lined': {
      const lineSpacing = 32;
      const topMargin = 70;
      const bottomMargin = 50;
      const leftMargin = 85;
      const linesCount = Math.floor((height - topMargin - bottomMargin) / lineSpacing);

      ctx.strokeStyle = template === 'dark-lined' ? 'rgba(251, 191, 36, 0.25)' : lineColor;
      ctx.lineWidth = 1.2;
      for (let i = 0; i < linesCount; i++) {
        const y = topMargin + i * lineSpacing;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Vertical Margin
      ctx.strokeStyle = marginLineColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(leftMargin, 0);
      ctx.lineTo(leftMargin, height);
      ctx.stroke();

      // Top header line
      ctx.strokeStyle = template === 'dark-lined' ? 'rgba(251, 191, 36, 0.4)' : marginLineColor;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(0, topMargin);
      ctx.lineTo(width, topMargin);
      ctx.stroke();
      break;
    }

    case 'lined-wide': {
      const lineSpacing = 44;
      const topMargin = 80;
      const linesCount = Math.floor((height - topMargin - 40) / lineSpacing);

      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 1.2;
      for (let i = 0; i < linesCount; i++) {
        const y = topMargin + i * lineSpacing;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      ctx.strokeStyle = marginLineColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(95, 0);
      ctx.lineTo(95, height);
      ctx.stroke();
      break;
    }

    case 'grid-5mm':
    case 'dark-grid': {
      const gridSize = 24;
      ctx.strokeStyle = template === 'dark-grid' ? 'rgba(34, 211, 238, 0.25)' : secondaryLineColor;
      ctx.lineWidth = 0.8;

      ctx.beginPath();
      for (let x = 0; x <= width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = 0; y <= height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Margin
      ctx.strokeStyle = marginLineColor;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(72, 0);
      ctx.lineTo(72, height);
      ctx.stroke();
      break;
    }

    case 'grid-10mm': {
      const smallGrid = 20;
      const largeGrid = 100;

      ctx.strokeStyle = secondaryLineColor;
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      for (let x = 0; x <= width; x += smallGrid) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = 0; y <= height; y += smallGrid) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let x = 0; x <= width; x += largeGrid) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = 0; y <= height; y += largeGrid) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();
      break;
    }

    case 'dots-5mm':
    case 'dark-dots': {
      const dotSpacing = 24;
      ctx.fillStyle = template === 'dark-dots' ? 'rgba(255, 255, 255, 0.35)' : dotColor;
      for (let x = dotSpacing / 2; x < width; x += dotSpacing) {
        for (let y = dotSpacing / 2; y < height; y += dotSpacing) {
          ctx.beginPath();
          ctx.arc(x, y, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
    }

    case 'cornell': {
      const topHeaderHeight = 90;
      const cueWidth = 220;
      const summaryHeight = 150;
      const lineSpacing = 30;
      const mainNotesHeight = height - topHeaderHeight - summaryHeight;
      const mainLinesCount = Math.floor(mainNotesHeight / lineSpacing);

      // Header background
      ctx.fillStyle = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';
      ctx.fillRect(0, 0, width, topHeaderHeight);

      ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(71,85,105,0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, topHeaderHeight);
      ctx.lineTo(width, topHeaderHeight);
      ctx.stroke();

      // Header text
      ctx.fillStyle = headerTextColor;
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('TEMA / MATERIA:', 35, 40);
      ctx.fillText('FECHA:', width - 180, 40);

      // Vertical Cue line
      ctx.beginPath();
      ctx.moveTo(cueWidth, topHeaderHeight);
      ctx.lineTo(cueWidth, height - summaryHeight);
      ctx.stroke();

      // Cue text
      ctx.fillStyle = labelTextColor;
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('IDEAS CLAVE / DUDAS', 30, topHeaderHeight + 28);
      ctx.fillText('APUNTES PRINCIPALES', cueWidth + 25, topHeaderHeight + 28);

      // Horizontal lines in main notes
      ctx.strokeStyle = secondaryLineColor;
      ctx.lineWidth = 1;
      for (let i = 0; i < mainLinesCount; i++) {
        const y = topHeaderHeight + 40 + i * lineSpacing;
        if (y < height - summaryHeight) {
          ctx.beginPath();
          ctx.moveTo(cueWidth, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
      }

      // Summary section
      ctx.fillStyle = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(241,245,249,0.5)';
      ctx.fillRect(0, height - summaryHeight, width, summaryHeight);

      ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(71,85,105,0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, height - summaryHeight);
      ctx.lineTo(width, height - summaryHeight);
      ctx.stroke();

      ctx.fillStyle = headerTextColor;
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('RESUMEN & CONCLUSIÓN FINAL', 35, height - summaryHeight + 28);

      ctx.strokeStyle = secondaryLineColor;
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        const y = height - summaryHeight + 55 + i * 28;
        ctx.beginPath();
        ctx.moveTo(35, y);
        ctx.lineTo(width - 35, y);
        ctx.stroke();
      }
      break;
    }

    case 'weekly-planner': {
      const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
      const colWidth = (width - 60) / 2;
      const rowHeight = 180;
      const startY = 110;

      ctx.fillStyle = headerTextColor;
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('PLANIFICADOR SEMANAL', 35, 50);
      ctx.font = '12px sans-serif';
      ctx.fillStyle = labelTextColor;
      ctx.fillText('SEMANA DEL: ________________ AL ________________', 35, 75);

      for (let i = 0; i < days.length; i++) {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = 30 + col * (colWidth + 10);
        const y = startY + row * (rowHeight + 10);

        ctx.fillStyle = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.7)';
        ctx.strokeStyle = secondaryLineColor;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x, y, colWidth, rowHeight);
        ctx.fillRect(x, y, colWidth, rowHeight);

        ctx.beginPath();
        ctx.moveTo(x, y + 32);
        ctx.lineTo(x + colWidth, y + 32);
        ctx.stroke();

        ctx.fillStyle = headerTextColor;
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText(days[i], x + 14, y + 22);

        // Internal lines
        ctx.strokeStyle = secondaryLineColor;
        ctx.lineWidth = 0.8;
        for (let li = 0; li < 4; li++) {
          ctx.beginPath();
          ctx.moveTo(x + 14, y + 60 + li * 28);
          ctx.lineTo(x + colWidth - 14, y + 60 + li * 28);
          ctx.stroke();
        }
      }

      // Goals box bottom right
      const gx = 30 + 1 * (colWidth + 10);
      const gy = startY + 3 * (rowHeight + 10);
      ctx.fillStyle = isDark ? 'rgba(245, 158, 11, 0.08)' : 'rgba(254, 243, 199, 0.5)';
      ctx.strokeStyle = isDark ? 'rgba(245, 158, 11, 0.3)' : '#FDE68A';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(gx, gy, colWidth, rowHeight);
      ctx.fillRect(gx, gy, colWidth, rowHeight);

      ctx.fillStyle = isDark ? '#FCD34D' : '#B45309';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('⭐ METAS & NOTAS DE LA SEMANA', gx + 14, gy + 22);
      break;
    }

    case 'daily-planner': {
      ctx.fillStyle = headerTextColor;
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('PLANIFICADOR DIARIO', 35, 45);
      ctx.font = '13px sans-serif';
      ctx.fillStyle = labelTextColor;
      ctx.fillText('FECHA: ____ / ____ / 2026', width - 240, 45);

      ctx.strokeStyle = secondaryLineColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(30, 65);
      ctx.lineTo(width - 30, 65);
      ctx.stroke();

      // Schedule Box
      ctx.strokeRect(30, 85, 320, height - 120);
      ctx.fillStyle = headerTextColor;
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('HORARIO DEL DÍA', 45, 112);

      for (let i = 0; i < 15; i++) {
        const hour = 7 + i;
        const y = 140 + i * 55;
        if (y < height - 60) {
          ctx.fillStyle = labelTextColor;
          ctx.font = 'bold 11px sans-serif';
          ctx.fillText(hour < 10 ? `0${hour}:00` : `${hour}:00`, 45, y + 4);

          ctx.strokeStyle = secondaryLineColor;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(95, y);
          ctx.lineTo(335, y);
          ctx.stroke();
        }
      }

      // Priorities Box
      ctx.strokeRect(370, 85, width - 400, 240);
      ctx.fillStyle = headerTextColor;
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('🎯 PRIORIDADES PRINCIPALES (TOP 3)', 390, 112);

      // Tasks Box
      ctx.strokeRect(370, 345, width - 400, 360);
      ctx.fillStyle = headerTextColor;
      ctx.fillText('📝 LISTA DE TAREAS', 390, 372);

      // Water Box
      ctx.strokeRect(370, 725, width - 400, height - 760);
      ctx.fillStyle = headerTextColor;
      ctx.fillText('💧 HIDRATACIÓN & REFLEXIÓN', 390, 752);
      break;
    }

    case 'todo-checklist': {
      const topMargin = 80;
      const lineSpacing = 38;
      const linesCount = Math.floor((height - topMargin - 40) / lineSpacing);

      ctx.fillStyle = headerTextColor;
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('LISTA DE TAREAS & SEGUIMIENTO', 35, 48);

      ctx.strokeStyle = secondaryLineColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(30, 65);
      ctx.lineTo(width - 30, 65);
      ctx.stroke();

      for (let i = 0; i < linesCount; i++) {
        const y = topMargin + i * lineSpacing;
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(40, y - 14, 16, 16);

        ctx.strokeStyle = secondaryLineColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(70, y);
        ctx.lineTo(width - 40, y);
        ctx.stroke();
      }
      break;
    }

    case 'music-staff': {
      const stavesCount = 8;
      const staffGap = 90;
      const startY = 80;

      ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.4)' : '#334155';
      ctx.lineWidth = 1;
      for (let s = 0; s < stavesCount; s++) {
        const baseY = startY + s * staffGap;
        if (baseY + 32 < height - 40) {
          for (let l = 0; l < 5; l++) {
            const y = baseY + l * 8;
            ctx.beginPath();
            ctx.moveTo(40, y);
            ctx.lineTo(width - 40, y);
            ctx.stroke();
          }
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(40, baseY);
          ctx.lineTo(40, baseY + 32);
          ctx.moveTo(width - 40, baseY);
          ctx.lineTo(width - 40, baseY + 32);
          ctx.stroke();
          ctx.lineWidth = 1;
        }
      }
      break;
    }

    case 'isometric': {
      const size = 30;
      const dx = size * Math.sqrt(3);
      const dy = size * 1.5;

      ctx.strokeStyle = secondaryLineColor;
      ctx.lineWidth = 0.8;
      for (let x = 0; x < width + dx; x += dx) {
        for (let y = 0; y < height + dy; y += dy) {
          ctx.beginPath();
          ctx.moveTo(x + dx / 2, y);
          ctx.lineTo(x + dx, y + size / 2);
          ctx.lineTo(x + dx, y + size * 1.5);
          ctx.lineTo(x + dx / 2, y + dy);
          ctx.lineTo(x, y + size * 1.5);
          ctx.lineTo(x, y + size / 2);
          ctx.closePath();
          ctx.stroke();
        }
      }
      break;
    }

    case 'blank':
    default: {
      ctx.strokeStyle = secondaryLineColor;
      ctx.lineWidth = 0.5;
      ctx.strokeRect(12, 12, width - 24, height - 24);
      break;
    }
  }
}

// Render smooth high-fidelity stroke with Bézier curves & dynamic thickness
export function renderSmoothStroke(ctx: CanvasRenderingContext2D, stroke: Stroke) {
  if (stroke.points.length === 0 && !stroke.shape) return;

  // Geometric Shape
  if (stroke.shape && stroke.shapeStart && stroke.shapeEnd) {
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.strokeStyle = stroke.color;
    ctx.fillStyle = stroke.color;
    ctx.lineWidth = stroke.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    drawGeometricShapeDirect(ctx, stroke.shape, stroke.shapeStart, stroke.shapeEnd, stroke.size);
    ctx.restore();
    return;
  }

  // Use quadratic Bezier and Chaikin smoothing
  renderSmoothBezierStroke(ctx, stroke);
}

// Geometric Shapes Direct Helper
export function drawGeometricShapeDirect(
  ctx: CanvasRenderingContext2D,
  shape: string,
  start: { x: number; y: number },
  end: { x: number; y: number },
  strokeSize: number
) {
  ctx.beginPath();
  switch (shape) {
    case 'line':
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
      break;

    case 'arrow': {
      const headLength = Math.max(14, strokeSize * 3);
      const angle = Math.atan2(end.y - start.y, end.x - start.x);
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(end.x, end.y);
      ctx.lineTo(
        end.x - headLength * Math.cos(angle - Math.PI / 6),
        end.y - headLength * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        end.x - headLength * Math.cos(angle + Math.PI / 6),
        end.y - headLength * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fill();
      break;
    }

    case 'rectangle': {
      const x = Math.min(start.x, end.x);
      const y = Math.min(start.y, end.y);
      const w = Math.abs(end.x - start.x);
      const h = Math.abs(end.y - start.y);
      ctx.strokeRect(x, y, w, h);
      break;
    }

    case 'circle': {
      const radiusX = Math.abs(end.x - start.x) / 2;
      const radiusY = Math.abs(end.y - start.y) / 2;
      const centerX = Math.min(start.x, end.x) + radiusX;
      const centerY = Math.min(start.y, end.y) + radiusY;
      ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }

    case 'triangle': {
      const topX = (start.x + end.x) / 2;
      const topY = start.y;
      ctx.moveTo(topX, topY);
      ctx.lineTo(end.x, end.y);
      ctx.lineTo(start.x, end.y);
      ctx.closePath();
      ctx.stroke();
      break;
    }

    case 'star': {
      const cx = (start.x + end.x) / 2;
      const cy = (start.y + end.y) / 2;
      const r = Math.hypot(end.x - start.x, end.y - start.y) / 2;
      const spikes = 5;
      let rot = (Math.PI / 2) * 3;
      let x = cx;
      let y = cy;
      const step = Math.PI / spikes;

      ctx.moveTo(cx, cy - r);
      for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * r;
        y = cy + Math.sin(rot) * r;
        ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * (r / 2);
        y = cy + Math.sin(rot) * (r / 2);
        ctx.lineTo(x, y);
        rot += step;
      }
      ctx.lineTo(cx, cy - r);
      ctx.closePath();
      ctx.stroke();
      break;
    }
  }
}

// Complete Page Renderer (Renders Background + Images + Strokes + Text + Stickies + Stamps)
export async function renderFullPageToCanvas(
  page: Page,
  width: number = 850,
  height: number = 1200,
  dpr: number = 2
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.scale(dpr, dpr);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // 1. Draw Paper Template Background
  drawPaperTemplateToCanvas(ctx, page.template, page.paperColor, width, height);

  // 2. Draw Images
  for (const img of page.images) {
    try {
      const imageEl = await new Promise<HTMLImageElement>((resolve, reject) => {
        const imgObj = new window.Image();
        imgObj.crossOrigin = 'anonymous';
        imgObj.onload = () => resolve(imgObj);
        imgObj.onerror = reject;
        imgObj.src = img.dataUrl;
      });
      ctx.drawImage(imageEl, img.x, img.y, img.width, img.height);
    } catch (e) {
      console.warn('Failed to render embedded image on export:', e);
    }
  }

  // 3. Draw Strokes
  for (const stroke of page.strokes) {
    renderSmoothStroke(ctx, stroke);
  }

  // 4. Draw Sticky Notes
  for (const sn of page.stickyNotes) {
    ctx.save();
    ctx.translate(sn.x + sn.width / 2, sn.y + sn.height / 2);
    ctx.rotate((sn.rotation * Math.PI) / 180);
    ctx.translate(-sn.width / 2, -sn.height / 2);

    const stickyColors: Record<string, { bg: string; border: string }> = {
      yellow: { bg: '#FEF08A', border: '#FACC15' },
      pink: { bg: '#FCE7F3', border: '#F472B6' },
      green: { bg: '#DCFCE7', border: '#4ADE80' },
      blue: { bg: '#E0F2FE', border: '#38BDF8' },
      purple: { bg: '#F3E8FF', border: '#C084FC' },
      orange: { bg: '#FFEDD5', border: '#FB923C' },
    };

    const scheme = stickyColors[sn.color] || stickyColors.yellow;
    ctx.fillStyle = scheme.bg;
    ctx.strokeStyle = scheme.border;
    ctx.lineWidth = 1;
    ctx.shadowColor = 'rgba(0,0,0,0.1)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 2;
    ctx.fillRect(0, 0, sn.width, sn.height);
    ctx.strokeRect(0, 0, sn.width, sn.height);

    ctx.shadowColor = 'transparent';
    ctx.fillStyle = '#1C1917';
    ctx.font = '14px sans-serif';
    const lines = (sn.text || '').split('\n');
    lines.forEach((l, idx) => {
      ctx.fillText(l, 12, 26 + idx * 20);
    });

    ctx.restore();
  }

  // 5. Draw Text Boxes
  for (const tb of page.textBoxes) {
    if (!tb.text) continue;
    ctx.save();
    const fontSize = tb.fontSize || 18;
    ctx.font = `${tb.bold ? 'bold ' : ''}${tb.italic ? 'italic ' : ''}${fontSize}px ${tb.fontFamily || 'sans-serif'}`;
    ctx.fillStyle = tb.color || '#0F172A';

    const lines = tb.text.split('\n');
    lines.forEach((l, idx) => {
      ctx.fillText(l, tb.x, tb.y + (idx + 1) * (fontSize * 1.25));
    });
    ctx.restore();
  }

  // 6. Draw Stamps
  for (const st of page.stamps) {
    ctx.save();
    ctx.fillStyle = `${st.color}20`;
    ctx.strokeStyle = st.color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(st.x, st.y, 110, 38, 12);
    ctx.fill();
    ctx.stroke();

    ctx.font = '18px sans-serif';
    ctx.fillText(st.icon, st.x + 8, st.y + 26);
    ctx.fillStyle = st.color;
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(st.label, st.x + 32, st.y + 24);
    ctx.restore();
  }

  return canvas;
}
