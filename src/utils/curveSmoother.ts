import { Point, Stroke } from '../types';

/**
 * Chaikin's Corner Cutting Algorithm
 * Takes discrete, jagged pointer input points and produces smooth, organic curves.
 */
export function chaikinSmooth(points: Point[], iterations: number = 1): Point[] {
  if (points.length <= 2) return points;

  let current = points;

  for (let iter = 0; iter < iterations; iter++) {
    const next: Point[] = [];
    next.push(current[0]); // Keep first point fixed

    for (let i = 0; i < current.length - 1; i++) {
      const p0 = current[i];
      const p1 = current[i + 1];

      // 25% and 75% interpolation points
      const q: Point = {
        x: 0.75 * p0.x + 0.25 * p1.x,
        y: 0.75 * p0.y + 0.25 * p1.y,
        pressure: p0.pressure && p1.pressure ? 0.75 * p0.pressure + 0.25 * p1.pressure : p0.pressure,
      };

      const r: Point = {
        x: 0.25 * p0.x + 0.75 * p1.x,
        y: 0.25 * p0.y + 0.75 * p1.y,
        pressure: p0.pressure && p1.pressure ? 0.25 * p0.pressure + 0.75 * p1.pressure : p1.pressure,
      };

      next.push(q);
      next.push(r);
    }

    next.push(current[current.length - 1]); // Keep last point fixed
    current = next;
  }

  return current;
}

/**
 * Renders an ultra-smooth, anti-aliased Bézier curve for pencil, pen, ballpoint, and highlighter.
 * Applies Quadratic Bézier midpoint interpolation and natural stroke dynamics to prevent any pixelation.
 */
export function renderSmoothBezierStroke(ctx: CanvasRenderingContext2D, stroke: Stroke) {
  if (!stroke.points || stroke.points.length === 0) return;

  const points = stroke.points.length > 3 ? chaikinSmooth(stroke.points, 1) : stroke.points;
  if (points.length === 0) return;

  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Specific Tool Settings
  if (stroke.tool === 'highlighter') {
    ctx.globalAlpha = stroke.opacity || 0.35;
    ctx.globalCompositeOperation = 'multiply';
    ctx.lineCap = 'square';
    ctx.lineJoin = 'bevel';
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.size;
  } else if (stroke.tool === 'pencil') {
    // Graphite pencil: natural texture, smooth anti-aliased graphite body
    ctx.globalAlpha = (stroke.opacity || 0.85) * 0.9;
    ctx.globalCompositeOperation = 'source-over';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = Math.max(1.2, stroke.size);
  } else if (stroke.tool === 'ballpoint') {
    // Ballpoint: sharp, clean, consistent ink
    ctx.globalAlpha = stroke.opacity || 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.size;
  } else {
    // Fountain Pen: rich flowing ink
    ctx.globalAlpha = stroke.opacity || 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.size;
  }

  // 1 Point: Single Dot
  if (points.length === 1) {
    ctx.fillStyle = stroke.color;
    ctx.beginPath();
    ctx.arc(points[0].x, points[0].y, stroke.size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  // 2 Points: Straight line
  if (points.length === 2) {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    ctx.lineTo(points[1].x, points[1].y);
    ctx.stroke();
    ctx.restore();
    return;
  }

  // 3+ Points: Smooth Quadratic Bézier Curve through Midpoints
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;
    ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
  }

  const lastPoint = points[points.length - 1];
  ctx.lineTo(lastPoint.x, lastPoint.y);
  ctx.stroke();

  // For pencil, draw an inner soft anti-aliased core for realistic graphite softness
  if (stroke.tool === 'pencil' && stroke.size > 2) {
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.lineWidth = stroke.size + 1.2;
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}
