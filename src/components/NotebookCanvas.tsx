import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Page,
  Stroke,
  ToolType,
  ShapeType,
  Point,
  TextBox,
  StickyNote,
  StampItem,
  EraserMode,
} from '../types';
import { PaperBackground } from './PaperBackground';
import { StickyNoteItem } from './StickyNoteItem';
import { TextBoxItem } from './TextBoxItem';
import { StampItemComponent } from './StampItemComponent';
import { RulerGuide } from './RulerGuide';
import {
  renderSmoothStroke,
  drawGeometricShapeDirect,
} from '../utils/canvasRenderer';
import { chaikinSmooth, renderSmoothBezierStroke } from '../utils/curveSmoother';
import {
  Trash2,
  Copy,
  Move,
  Palette,
  X,
} from 'lucide-react';

interface NotebookCanvasProps {
  page: Page;
  activeTool: ToolType;
  eraserMode: EraserMode;
  currentColor: string;
  currentSize: number;
  activeShape: ShapeType;
  isPalmRejectionActive: boolean;
  zoom: number;
  panOffset: { x: number; y: number };
  showRuler: boolean;
  onCloseRuler: () => void;
  onUpdatePage: (updatedPage: Page) => void;
  onStrokeAdded?: () => void;
}

interface SelectionBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export const NotebookCanvas: React.FC<NotebookCanvasProps> = ({
  page,
  activeTool,
  eraserMode,
  currentColor,
  currentSize,
  activeShape,
  isPalmRejectionActive,
  zoom,
  panOffset,
  showRuler,
  onCloseRuler,
  onUpdatePage,
  onStrokeAdded,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Drawing state
  const isDrawingRef = useRef(false);
  const currentPointsRef = useRef<Point[]>([]);
  const shapeStartRef = useRef<Point | null>(null);
  const [activeLaserPoints, setActiveLaserPoints] = useState<{ x: number; y: number; time: number }[]>([]);

  // Selection / Lasso State
  const [lassoPath, setLassoPath] = useState<Point[]>([]);
  const [isLassoing, setIsLassoing] = useState(false);
  const [selectedStrokeIds, setSelectedStrokeIds] = useState<string[]>([]);
  const [selectedTextBoxIds, setSelectedTextBoxIds] = useState<string[]>([]);
  const [selectedStickyIds, setSelectedStickyIds] = useState<string[]>([]);
  const [selectedStampIds, setSelectedStampIds] = useState<string[]>([]);
  const [isDraggingSelection, setIsDraggingSelection] = useState(false);
  const dragStartPointRef = useRef<Point | null>(null);
  const [showColorPickerForSelection, setShowColorPickerForSelection] = useState(false);

  const PAGE_WIDTH = 850;
  const PAGE_HEIGHT = 1200;
  const DPR = Math.max(window.devicePixelRatio || 2, 2);

  // Check if any element is selected
  const hasSelection =
    selectedStrokeIds.length > 0 ||
    selectedTextBoxIds.length > 0 ||
    selectedStickyIds.length > 0 ||
    selectedStampIds.length > 0;

  // Compute selection bounding box
  const getSelectionBounds = useCallback((): SelectionBounds | null => {
    if (!hasSelection) return null;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    // Check strokes
    page.strokes.forEach((st) => {
      if (selectedStrokeIds.includes(st.id)) {
        st.points.forEach((pt) => {
          minX = Math.min(minX, pt.x);
          minY = Math.min(minY, pt.y);
          maxX = Math.max(maxX, pt.x);
          maxY = Math.max(maxY, pt.y);
        });
        if (st.shapeStart && st.shapeEnd) {
          minX = Math.min(minX, st.shapeStart.x, st.shapeEnd.x);
          minY = Math.min(minY, st.shapeStart.y, st.shapeEnd.y);
          maxX = Math.max(maxX, st.shapeStart.x, st.shapeEnd.x);
          maxY = Math.max(maxY, st.shapeStart.y, st.shapeEnd.y);
        }
      }
    });

    // Check text boxes
    page.textBoxes.forEach((tb) => {
      if (selectedTextBoxIds.includes(tb.id)) {
        minX = Math.min(minX, tb.x);
        minY = Math.min(minY, tb.y);
        maxX = Math.max(maxX, tb.x + tb.width);
        maxY = Math.max(maxY, tb.y + Math.max(60, tb.height || 60));
      }
    });

    // Check sticky notes
    page.stickyNotes.forEach((sn) => {
      if (selectedStickyIds.includes(sn.id)) {
        minX = Math.min(minX, sn.x);
        minY = Math.min(minY, sn.y);
        maxX = Math.max(maxX, sn.x + sn.width);
        maxY = Math.max(maxY, sn.y + sn.height);
      }
    });

    // Check stamps
    page.stamps.forEach((st) => {
      if (selectedStampIds.includes(st.id)) {
        minX = Math.min(minX, st.x);
        minY = Math.min(minY, st.y);
        maxX = Math.max(maxX, st.x + 110);
        maxY = Math.max(maxY, st.y + 38);
      }
    });

    if (minX === Infinity) return null;

    // Add padding
    return {
      minX: Math.max(0, minX - 10),
      minY: Math.max(0, minY - 10),
      maxX: Math.min(PAGE_WIDTH, maxX + 10),
      maxY: Math.min(PAGE_HEIGHT, maxY + 10),
    };
  }, [hasSelection, page.strokes, page.textBoxes, page.stickyNotes, page.stamps, selectedStrokeIds, selectedTextBoxIds, selectedStickyIds, selectedStampIds]);

  // Redraw all strokes on canvas with high-DPI retina rendering
  const renderAllStrokes = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(DPR, DPR);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Render strokes with selection highlight
    for (const stroke of page.strokes) {
      const isSelected = selectedStrokeIds.includes(stroke.id);
      if (isSelected) {
        // Draw blue highlight glow behind selected stroke
        ctx.save();
        ctx.strokeStyle = '#3B82F6';
        ctx.lineWidth = stroke.size + 6;
        ctx.globalAlpha = 0.35;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        if (stroke.points.length > 1) {
          ctx.beginPath();
          ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
          for (let i = 1; i < stroke.points.length; i++) {
            ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
          }
          ctx.stroke();
        }
        ctx.restore();
      }

      renderSmoothStroke(ctx, stroke);
    }

    ctx.restore();
  }, [page.strokes, selectedStrokeIds, DPR]);

  // Set up canvas resolution (Retina 2x/3x DPR)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = PAGE_WIDTH * DPR;
    canvas.height = PAGE_HEIGHT * DPR;
    renderAllStrokes();
  }, [renderAllStrokes, DPR]);

  // Laser pointer fade effect loop
  useEffect(() => {
    if (activeLaserPoints.length === 0) return;
    const timer = setInterval(() => {
      const now = Date.now();
      setActiveLaserPoints((prev) => prev.filter((p) => now - p.time < 1200));
    }, 40);
    return () => clearInterval(timer);
  }, [activeLaserPoints.length]);

  // Clear selection if tool changes away from 'select'
  useEffect(() => {
    if (activeTool !== 'select') {
      setSelectedStrokeIds([]);
      setSelectedTextBoxIds([]);
      setSelectedStickyIds([]);
      setSelectedStampIds([]);
      setLassoPath([]);
      setIsLassoing(false);
    }
  }, [activeTool]);

  // Convert client pointer coordinate to Page canvas coordinate
  const getPageCoords = (e: React.PointerEvent | React.MouseEvent): Point | null => {
    const container = containerRef.current;
    if (!container) return null;
    const rect = container.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    const pressure = 'pressure' in e && e.pressure && e.pressure > 0 ? e.pressure : 0.5;
    return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10, pressure };
  };

  // Helper: check if a point is inside a polygon (Lasso test)
  const isPointInPolygon = (pt: Point, poly: Point[]): boolean => {
    if (poly.length < 3) return false;
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i].x,
        yi = poly[i].y;
      const xj = poly[j].x,
        yj = poly[j].y;
      const intersect =
        yi > pt.y !== yj > pt.y && pt.x < ((xj - xi) * (pt.y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  };

  // Helper: check if a point is close to another point
  const isPointNear = (pt1: Point, pt2: Point, threshold: number = 18): boolean => {
    return Math.hypot(pt1.x - pt2.x, pt1.y - pt2.y) < threshold;
  };

  // Selection Drag start on Bounding Box or Handle
  const handleSelectionDragStart = (e: React.PointerEvent) => {
    e.stopPropagation();
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // Safe ignore
    }
    const pt = getPageCoords(e);
    if (!pt) return;
    setIsDraggingSelection(true);
    dragStartPointRef.current = pt;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    // Palm rejection logic
    if (isPalmRejectionActive && e.pointerType === 'touch') {
      return;
    }

    // In normal drawing mode, ignore clicks on interactive buttons
    if (
      activeTool !== 'select' &&
      ((e.target as HTMLElement).tagName === 'BUTTON' ||
        (e.target as HTMLElement).closest('button'))
    ) {
      return;
    }

    const pt = getPageCoords(e);
    if (!pt) return;

    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // Safe ignore
    }

    // 1. SELECT / LASSO TOOL
    if (activeTool === 'select') {
      const bounds = getSelectionBounds();
      // Check if clicking inside active selection bounding box -> start dragging
      if (
        bounds &&
        pt.x >= bounds.minX &&
        pt.x <= bounds.maxX &&
        pt.y >= bounds.minY &&
        pt.y <= bounds.maxY
      ) {
        setIsDraggingSelection(true);
        dragStartPointRef.current = pt;
        return;
      }

      // Check if clicking directly on a text box to select it
      const clickedTb = page.textBoxes.find(
        (tb) =>
          pt.x >= tb.x &&
          pt.x <= tb.x + tb.width &&
          pt.y >= tb.y &&
          pt.y <= tb.y + Math.max(60, tb.height || 60)
      );
      if (clickedTb) {
        setSelectedTextBoxIds([clickedTb.id]);
        setSelectedStrokeIds([]);
        setSelectedStickyIds([]);
        setSelectedStampIds([]);
        setIsDraggingSelection(true);
        dragStartPointRef.current = pt;
        return;
      }

      // Otherwise, start a new lasso path
      setIsLassoing(true);
      setLassoPath([pt]);
      setSelectedStrokeIds([]);
      setSelectedTextBoxIds([]);
      setSelectedStickyIds([]);
      setSelectedStampIds([]);
      return;
    }

    isDrawingRef.current = true;

    if (activeTool === 'eraser') {
      if (eraserMode === 'stroke') {
        eraseStrokeAtPoint(pt);
      }
      return;
    }

    if (activeTool === 'laser') {
      setActiveLaserPoints((prev) => [...prev, { x: pt.x, y: pt.y, time: Date.now() }]);
      return;
    }

    if (activeTool === 'shape') {
      shapeStartRef.current = pt;
      currentPointsRef.current = [pt];
      return;
    }

    if (
      activeTool === 'pen' ||
      activeTool === 'ballpoint' ||
      activeTool === 'highlighter' ||
      activeTool === 'pencil'
    ) {
      currentPointsRef.current = [pt];
      drawLivePoint(pt);
    }
  };

  const drawLivePoint = (pt: Point) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.scale(DPR, DPR);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    if (activeTool === 'highlighter') {
      ctx.globalAlpha = 0.35;
      ctx.globalCompositeOperation = 'multiply';
    } else if (activeTool === 'pencil') {
      ctx.globalAlpha = 0.85;
      ctx.globalCompositeOperation = 'source-over';
    } else {
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }

    ctx.fillStyle = currentColor;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, currentSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isPalmRejectionActive && e.pointerType === 'touch') return;

    const pt = getPageCoords(e);
    if (!pt) return;

    // Dragging active selection (Translation of text, strokes, stickies, stamps)
    if (isDraggingSelection && dragStartPointRef.current) {
      const dx = pt.x - dragStartPointRef.current.x;
      const dy = pt.y - dragStartPointRef.current.y;
      dragStartPointRef.current = pt;

      // Translate selected strokes
      const updatedStrokes = page.strokes.map((st) => {
        if (!selectedStrokeIds.includes(st.id)) return st;
        return {
          ...st,
          points: st.points.map((p) => ({ ...p, x: p.x + dx, y: p.y + dy })),
          shapeStart: st.shapeStart
            ? { ...st.shapeStart, x: st.shapeStart.x + dx, y: st.shapeStart.y + dy }
            : undefined,
          shapeEnd: st.shapeEnd
            ? { ...st.shapeEnd, x: st.shapeEnd.x + dx, y: st.shapeEnd.y + dy }
            : undefined,
        };
      });

      // Translate selected text boxes
      const updatedTextBoxes = page.textBoxes.map((tb) => {
        if (!selectedTextBoxIds.includes(tb.id)) return tb;
        return { ...tb, x: Math.round(tb.x + dx), y: Math.round(tb.y + dy) };
      });

      // Translate selected sticky notes
      const updatedStickyNotes = page.stickyNotes.map((sn) => {
        if (!selectedStickyIds.includes(sn.id)) return sn;
        return { ...sn, x: Math.round(sn.x + dx), y: Math.round(sn.y + dy) };
      });

      // Translate selected stamps
      const updatedStamps = page.stamps.map((st) => {
        if (!selectedStampIds.includes(st.id)) return st;
        return { ...st, x: Math.round(st.x + dx), y: Math.round(st.y + dy) };
      });

      onUpdatePage({
        ...page,
        strokes: updatedStrokes,
        textBoxes: updatedTextBoxes,
        stickyNotes: updatedStickyNotes,
        stamps: updatedStamps,
        updatedAt: Date.now(),
      });
      return;
    }

    // Lasso path drawing
    if (isLassoing) {
      setLassoPath((prev) => [...prev, pt]);
      return;
    }

    if (!isDrawingRef.current) return;

    if (activeTool === 'eraser') {
      if (eraserMode === 'stroke') {
        eraseStrokeAtPoint(pt);
      }
      return;
    }

    if (activeTool === 'laser') {
      setActiveLaserPoints((prev) => [...prev, { x: pt.x, y: pt.y, time: Date.now() }]);
      return;
    }

    if (activeTool === 'shape' && shapeStartRef.current) {
      currentPointsRef.current = [shapeStartRef.current, pt];
      renderAllStrokes();
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.save();
      ctx.scale(DPR, DPR);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.strokeStyle = currentColor;
      ctx.fillStyle = currentColor;
      ctx.lineWidth = currentSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      drawGeometricShapeDirect(ctx, activeShape, shapeStartRef.current, pt, currentSize);
      ctx.restore();
      return;
    }

    if (
      activeTool === 'pen' ||
      activeTool === 'ballpoint' ||
      activeTool === 'highlighter' ||
      activeTool === 'pencil'
    ) {
      const points = currentPointsRef.current;
      points.push(pt);

      // Fast incremental drawing with Quadratic Bézier Midpoint Spline
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.save();
      ctx.scale(DPR, DPR);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      if (activeTool === 'highlighter') {
        ctx.globalAlpha = 0.35;
        ctx.globalCompositeOperation = 'multiply';
        ctx.lineCap = 'square';
      } else if (activeTool === 'pencil') {
        ctx.globalAlpha = 0.85;
        ctx.globalCompositeOperation = 'source-over';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      } else {
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }

      ctx.strokeStyle = currentColor;
      ctx.lineWidth = currentSize;

      if (points.length >= 3) {
        const i = points.length - 2;
        const xc = (points[i].x + points[i + 1].x) / 2;
        const yc = (points[i].y + points[i + 1].y) / 2;
        const prevXc = (points[i - 1].x + points[i].x) / 2;
        const prevYc = (points[i - 1].y + points[i].y) / 2;

        ctx.beginPath();
        ctx.moveTo(prevXc, prevYc);
        ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
        ctx.stroke();
      } else if (points.length === 2) {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        ctx.lineTo(points[1].x, points[1].y);
        ctx.stroke();
      }

      ctx.restore();
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Safe ignore
    }

    // Stop dragging selection
    if (isDraggingSelection) {
      setIsDraggingSelection(false);
      dragStartPointRef.current = null;
      return;
    }

    // Finalize Lasso Selection
    if (isLassoing) {
      setIsLassoing(false);
      if (lassoPath.length > 2) {
        // Find elements inside or near lasso polygon
        const strokesToSelect: string[] = [];
        const textToSelect: string[] = [];
        const stickyToSelect: string[] = [];
        const stampsToSelect: string[] = [];

        // Check strokes
        page.strokes.forEach((stroke) => {
          const hasPointInside = stroke.points.some((p) => isPointInPolygon(p, lassoPath));
          if (hasPointInside) {
            strokesToSelect.push(stroke.id);
          }
        });

        // Check text boxes
        page.textBoxes.forEach((tb) => {
          const center = { x: tb.x + tb.width / 2, y: tb.y + 30 };
          if (
            isPointInPolygon(center, lassoPath) ||
            isPointInPolygon({ x: tb.x, y: tb.y }, lassoPath) ||
            isPointInPolygon({ x: tb.x + tb.width, y: tb.y }, lassoPath)
          ) {
            textToSelect.push(tb.id);
          }
        });

        // Check sticky notes
        page.stickyNotes.forEach((sn) => {
          const center = { x: sn.x + sn.width / 2, y: sn.y + sn.height / 2 };
          if (isPointInPolygon(center, lassoPath)) {
            stickyToSelect.push(sn.id);
          }
        });

        // Check stamps
        page.stamps.forEach((st) => {
          const center = { x: st.x + 50, y: st.y + 19 };
          if (isPointInPolygon(center, lassoPath)) {
            stampsToSelect.push(st.id);
          }
        });

        setSelectedStrokeIds(strokesToSelect);
        setSelectedTextBoxIds(textToSelect);
        setSelectedStickyIds(stickyToSelect);
        setSelectedStampIds(stampsToSelect);
      } else if (lassoPath.length > 0) {
        // Single tap selection: select nearest text, stroke or item
        const clickPt = lassoPath[0];
        let found = false;

        // Check text boxes first for tap selection
        const foundTb = page.textBoxes.find(
          (tb) =>
            clickPt.x >= tb.x - 10 &&
            clickPt.x <= tb.x + tb.width + 10 &&
            clickPt.y >= tb.y - 10 &&
            clickPt.y <= tb.y + Math.max(60, tb.height || 60) + 10
        );
        if (foundTb) {
          setSelectedTextBoxIds([foundTb.id]);
          found = true;
        }

        // Check strokes
        if (!found) {
          for (const stroke of page.strokes) {
            const isNear = stroke.points.some((p) => isPointNear(p, clickPt, 22 + stroke.size));
            if (isNear) {
              setSelectedStrokeIds([stroke.id]);
              found = true;
              break;
            }
          }
        }

        // Check sticky
        if (!found) {
          const foundSn = page.stickyNotes.find(
            (sn) =>
              clickPt.x >= sn.x &&
              clickPt.x <= sn.x + sn.width &&
              clickPt.y >= sn.y &&
              clickPt.y <= sn.y + sn.height
          );
          if (foundSn) {
            setSelectedStickyIds([foundSn.id]);
            found = true;
          }
        }

        // Check stamp
        if (!found) {
          const foundStamp = page.stamps.find(
            (st) =>
              clickPt.x >= st.x &&
              clickPt.x <= st.x + 110 &&
              clickPt.y >= st.y &&
              clickPt.y <= st.y + 38
          );
          if (foundStamp) {
            setSelectedStampIds([foundStamp.id]);
            found = true;
          }
        }
      }

      setLassoPath([]);
      return;
    }

    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    if (activeTool === 'shape' && shapeStartRef.current && currentPointsRef.current.length >= 2) {
      const endPt = currentPointsRef.current[currentPointsRef.current.length - 1];
      const newStroke: Stroke = {
        id: `strk-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        tool: 'pen',
        color: currentColor,
        size: currentSize,
        opacity: 1,
        points: [shapeStartRef.current, endPt],
        shape: activeShape,
        shapeStart: shapeStartRef.current,
        shapeEnd: endPt,
      };

      shapeStartRef.current = null;
      currentPointsRef.current = [];
      const updatedPage = {
        ...page,
        strokes: [...page.strokes, newStroke],
        updatedAt: Date.now(),
      };
      onUpdatePage(updatedPage);
      if (onStrokeAdded) onStrokeAdded();
      return;
    }

    if (
      (activeTool === 'pen' ||
        activeTool === 'ballpoint' ||
        activeTool === 'highlighter' ||
        activeTool === 'pencil') &&
      currentPointsRef.current.length > 0
    ) {
      // Smooth the captured points with Chaikin algorithm for beautiful organic curves
      const rawPoints = currentPointsRef.current;
      const smoothed = rawPoints.length > 3 ? chaikinSmooth(rawPoints, 1) : rawPoints;

      const newStroke: Stroke = {
        id: `strk-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        tool: activeTool,
        color: currentColor,
        size: currentSize,
        opacity: activeTool === 'highlighter' ? 0.35 : activeTool === 'pencil' ? 0.85 : 1,
        points: smoothed,
      };

      currentPointsRef.current = [];
      const updatedPage = {
        ...page,
        strokes: [...page.strokes, newStroke],
        updatedAt: Date.now(),
      };
      onUpdatePage(updatedPage);
      if (onStrokeAdded) onStrokeAdded();
    }
  };

  // Smart Stroke Eraser
  const eraseStrokeAtPoint = (pt: Point) => {
    const threshold = 18;
    const remainingStrokes = page.strokes.filter((stroke) => {
      for (const p of stroke.points) {
        const dist = Math.hypot(p.x - pt.x, p.y - pt.y);
        if (dist < threshold + stroke.size / 2) {
          return false;
        }
      }
      return true;
    });

    if (remainingStrokes.length !== page.strokes.length) {
      onUpdatePage({
        ...page,
        strokes: remainingStrokes,
        updatedAt: Date.now(),
      });
    }
  };

  // Selection Actions: Delete, Duplicate, Recolor
  const handleDeleteSelection = () => {
    onUpdatePage({
      ...page,
      strokes: page.strokes.filter((s) => !selectedStrokeIds.includes(s.id)),
      textBoxes: page.textBoxes.filter((t) => !selectedTextBoxIds.includes(t.id)),
      stickyNotes: page.stickyNotes.filter((sn) => !selectedStickyIds.includes(sn.id)),
      stamps: page.stamps.filter((st) => !selectedStampIds.includes(st.id)),
      updatedAt: Date.now(),
    });
    setSelectedStrokeIds([]);
    setSelectedTextBoxIds([]);
    setSelectedStickyIds([]);
    setSelectedStampIds([]);
  };

  const handleDuplicateSelection = () => {
    const offset = 25;
    const newStrokes = page.strokes
      .filter((s) => selectedStrokeIds.includes(s.id))
      .map((s) => ({
        ...s,
        id: `strk-dup-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        points: s.points.map((p) => ({ ...p, x: p.x + offset, y: p.y + offset })),
        shapeStart: s.shapeStart
          ? { ...s.shapeStart, x: s.shapeStart.x + offset, y: s.shapeStart.y + offset }
          : undefined,
        shapeEnd: s.shapeEnd
          ? { ...s.shapeEnd, x: s.shapeEnd.x + offset, y: s.shapeEnd.y + offset }
          : undefined,
      }));

    const newTextBoxes = page.textBoxes
      .filter((t) => selectedTextBoxIds.includes(t.id))
      .map((t) => ({
        ...t,
        id: `tb-dup-${Date.now()}`,
        x: t.x + offset,
        y: t.y + offset,
      }));

    const newStickies = page.stickyNotes
      .filter((sn) => selectedStickyIds.includes(sn.id))
      .map((sn) => ({
        ...sn,
        id: `sn-dup-${Date.now()}`,
        x: sn.x + offset,
        y: sn.y + offset,
      }));

    const newStamps = page.stamps
      .filter((st) => selectedStampIds.includes(st.id))
      .map((st) => ({
        ...st,
        id: `st-dup-${Date.now()}`,
        x: st.x + offset,
        y: st.y + offset,
      }));

    onUpdatePage({
      ...page,
      strokes: [...page.strokes, ...newStrokes],
      textBoxes: [...page.textBoxes, ...newTextBoxes],
      stickyNotes: [...page.stickyNotes, ...newStickies],
      stamps: [...page.stamps, ...newStamps],
      updatedAt: Date.now(),
    });

    // Switch selection to the newly duplicated items
    setSelectedStrokeIds(newStrokes.map((s) => s.id));
    setSelectedTextBoxIds(newTextBoxes.map((t) => t.id));
    setSelectedStickyIds(newStickies.map((sn) => sn.id));
    setSelectedStampIds(newStamps.map((st) => st.id));
  };

  const handleRecolorSelectedStrokes = (color: string) => {
    const updatedStrokes = page.strokes.map((st) => {
      if (!selectedStrokeIds.includes(st.id)) return st;
      return { ...st, color };
    });

    onUpdatePage({
      ...page,
      strokes: updatedStrokes,
      updatedAt: Date.now(),
    });
    setShowColorPickerForSelection(false);
  };

  const selectionBounds = getSelectionBounds();

  return (
    <div
      ref={containerRef}
      className="relative select-none shadow-2xl transition-transform origin-top"
      style={{
        width: `${PAGE_WIDTH}px`,
        height: `${PAGE_HEIGHT}px`,
        transform: `scale(${zoom}) translate(${panOffset.x}px, ${panOffset.y}px)`,
        transformOrigin: 'center top',
      }}
    >
      {/* Paper Template Pattern Background */}
      <PaperBackground
        template={page.template}
        paperColor={page.paperColor}
        width={PAGE_WIDTH}
        height={PAGE_HEIGHT}
      />

      {/* Embedded Images */}
      {page.images.map((img) => (
        <div
          key={img.id}
          className="absolute z-10 group rounded-md overflow-hidden shadow-md border border-stone-300"
          style={{
            left: `${img.x}px`,
            top: `${img.y}px`,
            width: `${img.width}px`,
            height: `${img.height}px`,
          }}
        >
          <img src={img.dataUrl} alt="Apunte" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => {
              onUpdatePage({
                ...page,
                images: page.images.filter((i) => i.id !== img.id),
                updatedAt: Date.now(),
              });
            }}
            className="absolute top-1 right-1 p-1 rounded-md bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
            title="Eliminar imagen"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}

      {/* Text Boxes Layer */}
      {page.textBoxes.map((tb) => (
        <TextBoxItem
          key={tb.id}
          textBox={tb}
          onUpdate={(updated) => {
            const list = page.textBoxes.map((t) => (t.id === updated.id ? updated : t));
            onUpdatePage({ ...page, textBoxes: list, updatedAt: Date.now() });
          }}
          onDelete={(id) => {
            onUpdatePage({
              ...page,
              textBoxes: page.textBoxes.filter((t) => t.id !== id),
              updatedAt: Date.now(),
            });
          }}
          zoom={zoom}
        />
      ))}

      {/* Sticky Notes Layer */}
      {page.stickyNotes.map((sn) => (
        <StickyNoteItem
          key={sn.id}
          note={sn}
          onUpdate={(updated) => {
            const list = page.stickyNotes.map((n) => (n.id === updated.id ? updated : n));
            onUpdatePage({ ...page, stickyNotes: list, updatedAt: Date.now() });
          }}
          onDelete={(id) => {
            onUpdatePage({
              ...page,
              stickyNotes: page.stickyNotes.filter((n) => n.id !== id),
              updatedAt: Date.now(),
            });
          }}
          zoom={zoom}
        />
      ))}

      {/* Stamps / Study Stickers */}
      {page.stamps.map((st) => (
        <StampItemComponent
          key={st.id}
          stamp={st}
          onUpdate={(updated) => {
            const list = page.stamps.map((s) => (s.id === updated.id ? updated : s));
            onUpdatePage({ ...page, stamps: list, updatedAt: Date.now() });
          }}
          onDelete={(id) => {
            onUpdatePage({
              ...page,
              stamps: page.stamps.filter((s) => s.id !== id),
              updatedAt: Date.now(),
            });
          }}
          zoom={zoom}
        />
      ))}

      {/* HTML5 Canvas for vector drawing */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className={`absolute inset-0 z-20 w-full h-full touch-none ${
          activeTool === 'select'
            ? hasSelection
              ? 'cursor-move'
              : 'cursor-crosshair'
            : 'cursor-crosshair'
        }`}
        style={{
          width: `${PAGE_WIDTH}px`,
          height: `${PAGE_HEIGHT}px`,
        }}
      />

      {/* Lasso Path Live Preview SVG */}
      {isLassoing && lassoPath.length > 1 && (
        <svg className="absolute inset-0 pointer-events-none z-30 w-full h-full">
          <polyline
            points={lassoPath.map((p) => `${p.x},${p.y}`).join(' ')}
            fill="rgba(59, 130, 246, 0.14)"
            stroke="#2563EB"
            strokeWidth="2.5"
            strokeDasharray="6 4"
          />
        </svg>
      )}

      {/* Selection Bounding Box & Floating Action Menu */}
      {hasSelection && selectionBounds && (
        <div
          onPointerDown={handleSelectionDragStart}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="absolute z-40 pointer-events-auto border-2 border-dashed border-blue-500 rounded-xl bg-blue-500/10 cursor-move shadow-md flex flex-col justify-start"
          style={{
            left: `${selectionBounds.minX}px`,
            top: `${selectionBounds.minY}px`,
            width: `${selectionBounds.maxX - selectionBounds.minX}px`,
            height: `${selectionBounds.maxY - selectionBounds.minY}px`,
          }}
        >
          {/* Floating Actions Banner */}
          <div
            className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-1.5 p-1 bg-white rounded-xl shadow-xl border border-[#E5E2D9] text-xs font-semibold text-[#262626] whitespace-nowrap z-50 pointer-events-auto"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-1 px-2.5 py-1 text-blue-700 bg-blue-50 rounded-lg text-xs font-bold border border-blue-200">
              <Move className="w-3.5 h-3.5" />
              <span>Arrastra para mover</span>
            </div>

            {/* Recolor button (if strokes selected) */}
            {selectedStrokeIds.length > 0 && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowColorPickerForSelection(!showColorPickerForSelection)}
                  className="p-1.5 rounded-lg hover:bg-[#F2F0EB] text-[#262626] flex items-center gap-1"
                  title="Cambiar color del trazo"
                >
                  <Palette className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>Color</span>
                </button>

                {showColorPickerForSelection && (
                  <div className="absolute top-9 left-0 bg-white rounded-xl shadow-xl border border-[#E5E2D9] p-2 flex gap-1.5 z-50">
                    {['#0F172A', '#2563EB', '#DC2626', '#059669', '#D97706', '#7C3AED'].map(
                      (c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => handleRecolorSelectedStrokes(c)}
                          className="w-5 h-5 rounded-full border border-black/10 shadow-2xs hover:scale-110"
                          style={{ backgroundColor: c }}
                        />
                      )
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Duplicate button */}
            <button
              type="button"
              onClick={handleDuplicateSelection}
              className="p-1.5 rounded-lg hover:bg-[#F2F0EB] text-[#262626] flex items-center gap-1"
              title="Duplicar selección"
            >
              <Copy className="w-3.5 h-3.5 text-emerald-600" />
              <span>Duplicar</span>
            </button>

            {/* Delete button */}
            <button
              type="button"
              onClick={handleDeleteSelection}
              className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 flex items-center gap-1"
              title="Eliminar seleccionados"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Eliminar</span>
            </button>

            {/* Deselect button */}
            <button
              type="button"
              onClick={() => {
                setSelectedStrokeIds([]);
                setSelectedTextBoxIds([]);
                setSelectedStickyIds([]);
                setSelectedStampIds([]);
              }}
              className="p-1.5 rounded-lg hover:bg-[#F2F0EB] text-[#717171]"
              title="Deseleccionar"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Interactive Acrylic Ruler Guide */}
      {showRuler && <RulerGuide onClose={onCloseRuler} zoom={zoom} />}

      {/* Laser Pointer Trail Effect */}
      {activeLaserPoints.map((pt, idx) => {
        const age = Date.now() - pt.time;
        const opacity = Math.max(0, 1 - age / 1200);
        return (
          <div
            key={idx}
            className="absolute pointer-events-none rounded-full transform -translate-x-1/2 -translate-y-1/2 z-50 animate-ping"
            style={{
              left: `${pt.x}px`,
              top: `${pt.y}px`,
              width: '14px',
              height: '14px',
              backgroundColor: '#EF4444',
              boxShadow: '0 0 12px #EF4444',
              opacity,
            }}
          />
        );
      })}
    </div>
  );
};
