import React from 'react';
import { PaperColor, PaperTemplateType } from '../types';
import { PAPER_COLORS } from '../data/templates';

interface PaperBackgroundProps {
  template: PaperTemplateType;
  paperColor: PaperColor;
  width?: number;
  height?: number;
  showMarginGuide?: boolean;
}

export const PaperBackground: React.FC<PaperBackgroundProps> = ({
  template,
  paperColor,
  width = 800,
  height = 1100,
  showMarginGuide = true,
}) => {
  const colorDef = PAPER_COLORS.find((c) => c.id === paperColor) || PAPER_COLORS[0];
  const isDark = colorDef.isDark || template.startsWith('dark-');

  const bgColor = isDark
    ? paperColor === 'slate'
      ? '#0F172A'
      : '#1C1917'
    : colorDef.hex;

  const lineColor = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(59, 130, 246, 0.22)';
  const secondaryLineColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(148, 163, 184, 0.25)';
  const marginLineColor = isDark ? 'rgba(244, 63, 94, 0.4)' : 'rgba(239, 68, 68, 0.35)';
  const dotColor = isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(100, 116, 139, 0.4)';
  const headerTextColor = isDark ? '#E2E8F0' : '#475569';
  const labelTextColor = isDark ? '#94A3B8' : '#64748B';

  const renderTemplateSVG = () => {
    switch (template) {
      case 'lined':
      case 'dark-lined': {
        const lineSpacing = 32;
        const topMargin = 70;
        const bottomMargin = 50;
        const leftMargin = 85;
        const linesCount = Math.floor((height - topMargin - bottomMargin) / lineSpacing);

        return (
          <g>
            {/* Horizontal Ruled Lines */}
            {Array.from({ length: linesCount }).map((_, i) => {
              const y = topMargin + i * lineSpacing;
              return (
                <line
                  key={i}
                  x1={0}
                  y1={y}
                  x2={width}
                  y2={y}
                  stroke={template === 'dark-lined' ? 'rgba(251, 191, 36, 0.25)' : lineColor}
                  strokeWidth="1.2"
                />
              );
            })}
            {/* Red / Accent Vertical Margin */}
            {showMarginGuide && (
              <line
                x1={leftMargin}
                y1={0}
                x2={leftMargin}
                y2={height}
                stroke={marginLineColor}
                strokeWidth="1.5"
              />
            )}
            {/* Subtle top header line */}
            <line
              x1={0}
              y1={topMargin}
              x2={width}
              y2={topMargin}
              stroke={template === 'dark-lined' ? 'rgba(251, 191, 36, 0.4)' : marginLineColor}
              strokeWidth="1.8"
            />
          </g>
        );
      }

      case 'lined-wide': {
        const lineSpacing = 44;
        const topMargin = 80;
        const linesCount = Math.floor((height - topMargin - 40) / lineSpacing);

        return (
          <g>
            {Array.from({ length: linesCount }).map((_, i) => {
              const y = topMargin + i * lineSpacing;
              return (
                <line
                  key={i}
                  x1={0}
                  y1={y}
                  x2={width}
                  y2={y}
                  stroke={lineColor}
                  strokeWidth="1.2"
                />
              );
            })}
            {showMarginGuide && (
              <line
                x1={95}
                y1={0}
                x2={95}
                y2={height}
                stroke={marginLineColor}
                strokeWidth="1.5"
              />
            )}
          </g>
        );
      }

      case 'grid-5mm':
      case 'dark-grid': {
        const gridSize = 24;
        const strokeColor = template === 'dark-grid' ? 'rgba(34, 211, 238, 0.25)' : secondaryLineColor;
        return (
          <g>
            <defs>
              <pattern
                id={`grid-pattern-${isDark ? 'dark' : 'light'}`}
                width={gridSize}
                height={gridSize}
                patternUnits="userSpaceOnUse"
              >
                <path
                  d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth="0.8"
                />
              </pattern>
            </defs>
            <rect width={width} height={height} fill={`url(#grid-pattern-${isDark ? 'dark' : 'light'})`} />
            {showMarginGuide && (
              <line
                x1={72}
                y1={0}
                x2={72}
                y2={height}
                stroke={marginLineColor}
                strokeWidth="1.2"
                strokeDasharray="4 2"
              />
            )}
          </g>
        );
      }

      case 'grid-10mm': {
        const smallGrid = 20;
        const largeGrid = 100;
        return (
          <g>
            <defs>
              <pattern id="small-grid" width={smallGrid} height={smallGrid} patternUnits="userSpaceOnUse">
                <path d={`M ${smallGrid} 0 L 0 0 0 ${smallGrid}`} fill="none" stroke={secondaryLineColor} strokeWidth="0.6" />
              </pattern>
              <pattern id="large-grid" width={largeGrid} height={largeGrid} patternUnits="userSpaceOnUse">
                <rect width={largeGrid} height={largeGrid} fill="url(#small-grid)" />
                <path d={`M ${largeGrid} 0 L 0 0 0 ${largeGrid}`} fill="none" stroke={lineColor} strokeWidth="1.2" />
              </pattern>
            </defs>
            <rect width={width} height={height} fill="url(#large-grid)" />
          </g>
        );
      }

      case 'dots-5mm':
      case 'dark-dots': {
        const dotSpacing = 24;
        const color = template === 'dark-dots' ? 'rgba(255, 255, 255, 0.35)' : dotColor;
        return (
          <g>
            <defs>
              <pattern id={`dot-pattern-${isDark ? 'dark' : 'light'}`} width={dotSpacing} height={dotSpacing} patternUnits="userSpaceOnUse">
                <circle cx={dotSpacing / 2} cy={dotSpacing / 2} r="1.1" fill={color} />
              </pattern>
            </defs>
            <rect width={width} height={height} fill={`url(#dot-pattern-${isDark ? 'dark' : 'light'})`} />
          </g>
        );
      }

      case 'cornell': {
        const topHeaderHeight = 90;
        const cueWidth = 220;
        const summaryHeight = 150;
        const lineSpacing = 30;
        const mainNotesHeight = height - topHeaderHeight - summaryHeight;
        const mainLinesCount = Math.floor(mainNotesHeight / lineSpacing);

        return (
          <g>
            {/* Header section */}
            <rect x="0" y="0" width={width} height={topHeaderHeight} fill={isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'} />
            <line x1="0" y1={topHeaderHeight} x2={width} y2={topHeaderHeight} stroke={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(71,85,105,0.4)'} strokeWidth="2" />
            <text x="35" y="40" fill={headerTextColor} fontSize="14" fontWeight="bold" fontFamily="Outfit">
              TEMA / MATERIA:
            </text>
            <text x={width - 180} y="40" fill={headerTextColor} fontSize="13" fontWeight="bold" fontFamily="Outfit">
              FECHA:
            </text>
            <line x1="160" y1="45" x2={width - 200} y2="45" stroke={secondaryLineColor} strokeWidth="1" strokeDasharray="3 3" />
            <line x1={width - 120} y1="45" x2={width - 35} y2="45" stroke={secondaryLineColor} strokeWidth="1" strokeDasharray="3 3" />

            {/* Vertical Cue line */}
            <line x1={cueWidth} y1={topHeaderHeight} x2={cueWidth} y2={height - summaryHeight} stroke={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(71,85,105,0.4)'} strokeWidth="2" />

            {/* Cue header text */}
            <text x="30" y={topHeaderHeight + 28} fill={labelTextColor} fontSize="12" fontWeight="bold" letterSpacing="1" fontFamily="Outfit">
              IDEAS CLAVE / DUDAS
            </text>

            {/* Main notes header text */}
            <text x={cueWidth + 25} y={topHeaderHeight + 28} fill={labelTextColor} fontSize="12" fontWeight="bold" letterSpacing="1" fontFamily="Outfit">
              APUNTES PRINCIPALES
            </text>

            {/* Horizontal lines in main notes area */}
            {Array.from({ length: mainLinesCount }).map((_, i) => {
              const y = topHeaderHeight + 40 + i * lineSpacing;
              if (y >= height - summaryHeight) return null;
              return (
                <line
                  key={i}
                  x1={cueWidth}
                  y1={y}
                  x2={width}
                  y2={y}
                  stroke={secondaryLineColor}
                  strokeWidth="1"
                />
              );
            })}

            {/* Bottom Summary Section */}
            <rect
              x="0"
              y={height - summaryHeight}
              width={width}
              height={summaryHeight}
              fill={isDark ? 'rgba(255,255,255,0.04)' : 'rgba(241,245,249,0.5)'}
            />
            <line
              x1="0"
              y1={height - summaryHeight}
              x2={width}
              y2={height - summaryHeight}
              stroke={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(71,85,105,0.4)'}
              strokeWidth="2"
            />
            <text
              x="35"
              y={height - summaryHeight + 28}
              fill={headerTextColor}
              fontSize="13"
              fontWeight="bold"
              letterSpacing="1"
              fontFamily="Outfit"
            >
              RESUMEN & CONCLUSIÓN FINAL
            </text>
            {/* Lines inside summary */}
            {Array.from({ length: 3 }).map((_, i) => {
              const y = height - summaryHeight + 55 + i * 28;
              return (
                <line
                  key={`sum-${i}`}
                  x1="35"
                  y1={y}
                  x2={width - 35}
                  y2={y}
                  stroke={secondaryLineColor}
                  strokeWidth="1"
                />
              );
            })}
          </g>
        );
      }

      case 'weekly-planner': {
        const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
        const colWidth = (width - 60) / 2;
        const rowHeight = 180;
        const startY = 110;

        return (
          <g>
            {/* Planner Header */}
            <text x="35" y="50" fill={headerTextColor} fontSize="20" fontWeight="bold" fontFamily="Outfit">
              PLANIFICADOR SEMANAL
            </text>
            <text x="35" y="75" fill={labelTextColor} fontSize="12" fontFamily="Outfit">
              SEMANA DEL: ________________ AL ________________
            </text>

            {/* Days boxes */}
            {days.map((day, i) => {
              const col = i % 2;
              const row = Math.floor(i / 2);
              const x = 30 + col * (colWidth + 10);
              const y = startY + row * (rowHeight + 10);

              if (i === 6) {
                // Sunday & Goals split
                return (
                  <g key={day}>
                    <rect
                      x={x}
                      y={y}
                      width={colWidth}
                      height={rowHeight}
                      rx="8"
                      fill={isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.7)'}
                      stroke={secondaryLineColor}
                      strokeWidth="1.5"
                    />
                    <path
                      d={`M ${x} ${y + 32} L ${x + colWidth} ${y + 32}`}
                      stroke={secondaryLineColor}
                      strokeWidth="1"
                    />
                    <text x={x + 14} y={y + 22} fill={headerTextColor} fontSize="14" fontWeight="bold" fontFamily="Outfit">
                      {day}
                    </text>
                  </g>
                );
              }

              return (
                <g key={day}>
                  <rect
                    x={x}
                    y={y}
                    width={colWidth}
                    height={rowHeight}
                    rx="8"
                    fill={isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.7)'}
                    stroke={secondaryLineColor}
                    strokeWidth="1.5"
                  />
                  <path
                    d={`M ${x} ${y + 32} L ${x + colWidth} ${y + 32}`}
                    stroke={secondaryLineColor}
                    strokeWidth="1"
                  />
                  <text x={x + 14} y={y + 22} fill={headerTextColor} fontSize="14" fontWeight="bold" fontFamily="Outfit">
                    {day}
                  </text>
                  {/* Internal dotted lines */}
                  {Array.from({ length: 4 }).map((_, li) => (
                    <line
                      key={li}
                      x1={x + 14}
                      y1={y + 60 + li * 28}
                      x2={x + colWidth - 14}
                      y2={y + 60 + li * 28}
                      stroke={secondaryLineColor}
                      strokeWidth="0.8"
                      strokeDasharray="2 2"
                    />
                  ))}
                </g>
              );
            })}

            {/* Goals box bottom right */}
            <g>
              {(() => {
                const gx = 30 + 1 * (colWidth + 10);
                const gy = startY + 3 * (rowHeight + 10);
                return (
                  <g>
                    <rect
                      x={gx}
                      y={gy}
                      width={colWidth}
                      height={rowHeight}
                      rx="8"
                      fill={isDark ? 'rgba(245, 158, 11, 0.08)' : 'rgba(254, 243, 199, 0.5)'}
                      stroke={isDark ? 'rgba(245, 158, 11, 0.3)' : '#FDE68A'}
                      strokeWidth="1.5"
                    />
                    <text x={gx + 14} y={gy + 22} fill={isDark ? '#FCD34D' : '#B45309'} fontSize="14" fontWeight="bold" fontFamily="Outfit">
                      ⭐ METAS & NOTAS DE LA SEMANA
                    </text>
                    {Array.from({ length: 4 }).map((_, li) => (
                      <circle
                        key={li}
                        cx={gx + 22}
                        cy={gy + 60 + li * 28}
                        r="5"
                        fill="none"
                        stroke={isDark ? '#FCD34D' : '#D97706'}
                        strokeWidth="1.5"
                      />
                    ))}
                  </g>
                );
              })()}
            </g>
          </g>
        );
      }

      case 'daily-planner': {
        return (
          <g>
            {/* Header */}
            <text x="35" y="45" fill={headerTextColor} fontSize="20" fontWeight="bold" fontFamily="Outfit">
              PLANIFICADOR DIARIO
            </text>
            <text x={width - 240} y="45" fill={labelTextColor} fontSize="13" fontFamily="Outfit">
              FECHA: ____ / ____ / 2026
            </text>
            <line x1="30" y1="65" x2={width - 30} y2="65" stroke={secondaryLineColor} strokeWidth="1.5" />

            {/* Left Timeline Schedule (6:00 - 21:00) */}
            <rect x="30" y="85" width="320" height={height - 120} rx="8" fill={isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.5)'} stroke={secondaryLineColor} strokeWidth="1" />
            <text x="45" y="112" fill={headerTextColor} fontSize="13" fontWeight="bold" fontFamily="Outfit">
              HORARIO DEL DÍA
            </text>
            {Array.from({ length: 15 }).map((_, i) => {
              const hour = 7 + i;
              const y = 140 + i * 55;
              if (y > height - 60) return null;
              return (
                <g key={hour}>
                  <text x="45" y={y + 4} fill={labelTextColor} fontSize="11" fontFamily="Outfit" fontWeight="600">
                    {hour < 10 ? `0${hour}:00` : `${hour}:00`}
                  </text>
                  <line x1="95" y1={y} x2="335" y2={y} stroke={secondaryLineColor} strokeWidth="0.8" />
                </g>
              );
            })}

            {/* Right Top: Top Priorities */}
            <rect x="370" y="85" width={width - 400} height="240" rx="8" fill={isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.5)'} stroke={secondaryLineColor} strokeWidth="1" />
            <text x="390" y="112" fill={headerTextColor} fontSize="13" fontWeight="bold" fontFamily="Outfit">
              🎯 PRIORIDADES PRINCIPALES (TOP 3)
            </text>
            {Array.from({ length: 3 }).map((_, i) => {
              const y = 145 + i * 50;
              return (
                <g key={i}>
                  <rect x="390" y={y - 12} width="18" height="18" rx="4" fill="none" stroke={lineColor} strokeWidth="1.5" />
                  <line x1="420" y1={y} x2={width - 50} y2={y} stroke={secondaryLineColor} strokeWidth="1" />
                </g>
              );
            })}

            {/* Right Middle: To-Do Tasks */}
            <rect x="370" y="345" width={width - 400} height="360" rx="8" fill={isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.5)'} stroke={secondaryLineColor} strokeWidth="1" />
            <text x="390" y="372" fill={headerTextColor} fontSize="13" fontWeight="bold" fontFamily="Outfit">
              📝 LISTA DE TAREAS
            </text>
            {Array.from({ length: 7 }).map((_, i) => {
              const y = 410 + i * 40;
              return (
                <g key={i}>
                  <circle cx="400" cy={y - 4} r="7" fill="none" stroke={lineColor} strokeWidth="1.2" />
                  <line x1="420" y1={y} x2={width - 50} y2={y} stroke={secondaryLineColor} strokeWidth="0.8" />
                </g>
              );
            })}

            {/* Right Bottom: Water & Notes */}
            <rect x="370" y="725" width={width - 400} height={height - 760} rx="8" fill={isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.5)'} stroke={secondaryLineColor} strokeWidth="1" />
            <text x="390" y="752" fill={headerTextColor} fontSize="13" fontWeight="bold" fontFamily="Outfit">
              💧 HIDRATACIÓN (8 VASOS) & REFLEXIÓN
            </text>
            {Array.from({ length: 8 }).map((_, i) => (
              <circle
                key={i}
                cx={395 + i * 40}
                cy={785}
                r="10"
                fill="none"
                stroke={isDark ? '#38BDF8' : '#0284C7'}
                strokeWidth="1.5"
              />
            ))}
          </g>
        );
      }

      case 'todo-checklist': {
        const topMargin = 80;
        const lineSpacing = 38;
        const linesCount = Math.floor((height - topMargin - 40) / lineSpacing);

        return (
          <g>
            <text x="35" y="48" fill={headerTextColor} fontSize="20" fontWeight="bold" fontFamily="Outfit">
              LISTA DE TAREAS & SEGUIMIENTO
            </text>
            <line x1="30" y1="65" x2={width - 30} y2="65" stroke={secondaryLineColor} strokeWidth="1.5" />

            {Array.from({ length: linesCount }).map((_, i) => {
              const y = topMargin + i * lineSpacing;
              return (
                <g key={i}>
                  <rect
                    x="40"
                    y={y - 14}
                    width="16"
                    height="16"
                    rx="4"
                    fill="none"
                    stroke={lineColor}
                    strokeWidth="1.5"
                  />
                  <line
                    x1="70"
                    y1={y}
                    x2={width - 40}
                    y2={y}
                    stroke={secondaryLineColor}
                    strokeWidth="1"
                  />
                </g>
              );
            })}
          </g>
        );
      }

      case 'music-staff': {
        const stavesCount = 8;
        const staffHeight = 32;
        const staffGap = 90;
        const startY = 80;

        return (
          <g>
            {Array.from({ length: stavesCount }).map((_, s) => {
              const baseY = startY + s * staffGap;
              if (baseY + staffHeight > height - 40) return null;
              return (
                <g key={s}>
                  {Array.from({ length: 5 }).map((_, l) => {
                    const y = baseY + l * 8;
                    return (
                      <line
                        key={l}
                        x1="40"
                        y1={y}
                        x2={width - 40}
                        y2={y}
                        stroke={isDark ? 'rgba(255,255,255,0.4)' : '#334155'}
                        strokeWidth="1"
                      />
                    );
                  })}
                  {/* Left & right barlines */}
                  <line x1="40" y1={baseY} x2="40" y2={baseY + 32} stroke={isDark ? 'rgba(255,255,255,0.5)' : '#334155'} strokeWidth="1.8" />
                  <line x1={width - 40} y1={baseY} x2={width - 40} y2={baseY + 32} stroke={isDark ? 'rgba(255,255,255,0.5)' : '#334155'} strokeWidth="1.8" />
                </g>
              );
            })}
          </g>
        );
      }

      case 'isometric': {
        const size = 30;
        const dx = size * Math.sqrt(3);
        const dy = size * 1.5;
        return (
          <g>
            <defs>
              <pattern id="isometric-pattern" width={dx} height={dy} patternUnits="userSpaceOnUse">
                <path
                  d={`M ${dx / 2} 0 L ${dx} ${size / 2} L ${dx} ${size * 1.5} L ${dx / 2} ${dy} L 0 ${size * 1.5} L 0 ${size / 2} Z`}
                  fill="none"
                  stroke={secondaryLineColor}
                  strokeWidth="0.8"
                />
              </pattern>
            </defs>
            <rect width={width} height={height} fill="url(#isometric-pattern)" />
          </g>
        );
      }

      case 'blank':
      default:
        return (
          <g>
            {/* Subtle paper grain / border frame */}
            <rect
              x="12"
              y="12"
              width={width - 24}
              height={height - 24}
              fill="none"
              stroke={secondaryLineColor}
              strokeWidth="0.5"
              strokeDasharray="2 4"
            />
          </g>
        );
    }
  };

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden select-none transition-colors duration-200"
      style={{ backgroundColor: bgColor }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full"
      >
        {renderTemplateSVG()}
      </svg>
    </div>
  );
};
