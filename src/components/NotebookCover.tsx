import React from 'react';
import { Notebook } from '../types';
import { COVER_PRESETS } from '../data/templates';
import { Star, BookOpen } from 'lucide-react';

interface NotebookCoverProps {
  notebook: Notebook;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  showFavoriteToggle?: (e: React.MouseEvent) => void;
}

export const NotebookCover: React.FC<NotebookCoverProps> = ({
  notebook,
  onClick,
  size = 'md',
  showFavoriteToggle,
}) => {
  const coverDef = COVER_PRESETS.find((c) => c.id === notebook.coverStyle) || COVER_PRESETS[0];

  const sizeClasses = {
    sm: 'w-36 h-48 text-xs',
    md: 'w-48 h-64 sm:w-52 sm:h-72 text-sm',
    lg: 'w-64 h-88 text-base',
  }[size];

  const isSpiral = notebook.coverStyle === 'academic-kraft' || notebook.coverStyle === 'spiral-minimal';

  return (
    <div
      onClick={onClick}
      className={`group relative ${sizeClasses} rounded-r-xl rounded-l-sm cursor-pointer select-none transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl flex flex-col justify-between overflow-hidden book-shadow`}
      style={{
        background: `linear-gradient(135deg, ${notebook.coverColor || '#3E2723'} 0%, #1c1917 100%)`,
      }}
    >
      {/* Dynamic cover gradient overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${coverDef.gradient} opacity-95 group-hover:opacity-100 transition-opacity`}
      />

      {/* Pattern textures */}
      {coverDef.pattern === 'grid' && (
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px]" />
      )}
      {coverDef.pattern === 'dots' && (
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1.5px,transparent_1.5px)] [background-size:16px_16px]" />
      )}
      {coverDef.pattern === 'marble' && (
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-200 via-transparent to-stone-900" />
      )}
      {coverDef.pattern === 'floral' && (
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-pink-300 via-rose-500 to-transparent" />
      )}

      {/* Leather Spine / Binding on the Left */}
      {!isSpiral ? (
        <div
          className="absolute left-0 top-0 bottom-0 w-5 sm:w-6 z-10 spine-shadow-left border-r border-black/25 flex flex-col justify-between py-4 items-center"
          style={{ backgroundColor: coverDef.spineColor }}
        >
          {/* Subtle spine ridges */}
          <div className="w-full h-1 bg-black/40 shadow-sm" />
          <div className="w-full h-1 bg-black/40 shadow-sm" />
          <div className="w-full h-1 bg-black/40 shadow-sm" />
          <div className="w-full h-1 bg-black/40 shadow-sm" />
        </div>
      ) : (
        /* Spiral Wire Coils */
        <div className="absolute left-0 top-0 bottom-0 w-6 z-20 flex flex-col justify-evenly items-center py-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="w-5 h-2.5 rounded-full bg-gradient-to-r from-stone-400 via-stone-200 to-stone-600 shadow-md border border-stone-700/50 transform -rotate-6"
            />
          ))}
        </div>
      )}

      {/* Edge Stitching */}
      {coverDef.hasStitching && (
        <div className="absolute inset-2 left-7 sm:left-8 rounded-r-lg border border-dashed border-amber-300/30 pointer-events-none z-10" />
      )}

      {/* Elastic Band Strap */}
      {coverDef.hasElasticBand && (
        <div className="absolute right-6 top-0 bottom-0 w-3 bg-stone-900/80 shadow-md border-x border-stone-700/60 z-10 flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400/80 shadow-xs" />
        </div>
      )}

      {/* Bookmark Ribbon Peaking Out at Bottom */}
      <div
        className="absolute left-12 -bottom-2 w-3.5 h-7 z-15 shadow-md transform rotate-2 origin-top"
        style={{
          backgroundColor: coverDef.accent || '#D97706',
          clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 50% 80%, 0% 100%)',
        }}
      />

      {/* Top Header / Badges */}
      <div className="relative z-20 pt-4 px-4 pl-8 sm:pl-9 flex items-center justify-between">
        {notebook.tag ? (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wider uppercase bg-black/40 backdrop-blur-xs text-stone-200 border border-white/10 shadow-xs">
            {notebook.tag}
          </span>
        ) : (
          <span />
        )}

        {showFavoriteToggle && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              showFavoriteToggle(e);
            }}
            className="p-1.5 rounded-full bg-black/30 hover:bg-black/60 transition-colors text-amber-400"
            title={notebook.favorite ? 'Quitar de favoritos' : 'Marcar como favorito'}
          >
            <Star
              className={`w-3.5 h-3.5 ${
                notebook.favorite ? 'fill-amber-400 text-amber-400' : 'text-stone-400 hover:text-amber-300'
              }`}
            />
          </button>
        )}
      </div>

      {/* Center Plaque / Title Card */}
      <div className="relative z-20 px-3 pl-8 sm:pl-9 my-auto flex flex-col items-center">
        <div
          className="w-full py-3 px-2.5 rounded-lg bg-black/75 backdrop-blur-sm border border-white/20 shadow-inner flex flex-col items-center text-center transition-transform group-hover:scale-[1.02]"
          style={{
            borderColor: `${coverDef.accent}66`,
          }}
        >
          {/* Ornate crest line */}
          <div className="w-8 h-0.5 mb-1.5 bg-gradient-to-r from-transparent via-white/40 to-transparent" />

          <h3
            className="font-cover font-bold line-clamp-2 tracking-wide leading-tight drop-shadow-md text-white"
            style={{
              fontSize: size === 'sm' ? '12px' : size === 'lg' ? '17px' : '14px',
            }}
          >
            {notebook.title}
          </h3>

          {notebook.description && (
            <p className="mt-1 text-[11px] text-stone-200 line-clamp-1 font-sans opacity-85">
              {notebook.description}
            </p>
          )}

          {/* Ornate bottom dot */}
          <div className="flex items-center gap-1 mt-1.5 opacity-60">
            <span className="w-1 h-1 rounded-full bg-white/60" />
            <span className="w-3 h-0.5 bg-white/60" />
            <span className="w-1 h-1 rounded-full bg-white/60" />
          </div>
        </div>
      </div>

      {/* Bottom Metadata (Page Count & Updated Date) */}
      <div className="relative z-20 pb-3 px-3 pl-8 sm:pl-9 flex items-center justify-between text-[11px] text-stone-300 font-medium">
        <span className="flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded-md border border-white/5">
          <BookOpen className="w-3 h-3 text-stone-300" />
          {notebook.pages.length} {notebook.pages.length === 1 ? 'pág' : 'págs'}
        </span>
        <span className="opacity-75 text-[10px]">
          {new Date(notebook.updatedAt).toLocaleDateString('es-ES', {
            month: 'short',
            day: 'numeric',
          })}
        </span>
      </div>
    </div>
  );
};
