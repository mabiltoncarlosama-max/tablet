export type ToolType =
  | 'select'        // Lazo de selección y movimiento
  | 'pen'           // Pluma / Tinta suave
  | 'ballpoint'     // Bolígrafo fino
  | 'highlighter'   // Resaltador / Subrayador
  | 'pencil'        // Lápiz grafito
  | 'eraser'        // Borrador de trazos o píxeles
  | 'shape'         // Formas geométricas
  | 'text'          // Texto digital
  | 'sticky'        // Nota adhesiva / Post-it
  | 'stamp'         // Sellos / Stickers de estudio
  | 'laser'         // Puntero láser temporal para presentaciones/repaso
  | 'ruler';        // Regla milimétrica guía

export type EraserMode = 'stroke' | 'pixel';

export type ShapeType = 'line' | 'arrow' | 'rectangle' | 'circle' | 'triangle' | 'star';

export type PaperTemplateType =
  | 'blank'
  | 'lined'
  | 'lined-wide'
  | 'grid-5mm'
  | 'grid-10mm'
  | 'dots-5mm'
  | 'cornell'
  | 'weekly-planner'
  | 'daily-planner'
  | 'todo-checklist'
  | 'music-staff'
  | 'isometric'
  | 'dark-lined'
  | 'dark-grid'
  | 'dark-dots';

export type PaperColor =
  | 'ivory'     // #FDFBF7 - Marfil clásico cálido
  | 'white'     // #FFFFFF - Blanco puro
  | 'cream'     // #F7F3E9 - Pergamino crema suave
  | 'yellow'    // #FEFCE8 - Papel amarillo legal pad
  | 'dark'      // #1C1917 - Pizarra oscura
  | 'slate'     // #0F172A - Azul noche profundo
  | 'mint'      // #F0FDF4 - Menta suave descansada
  | 'rose';     // #FFF1F2 - Rosa pastel cálido

export type CoverStyle =
  | 'leather-brown'
  | 'leather-black'
  | 'leather-blue'
  | 'leather-burgundy'
  | 'pastel-sage'
  | 'pastel-lavender'
  | 'pastel-terracotta'
  | 'pastel-ocean'
  | 'academic-kraft'
  | 'spiral-minimal'
  | 'geometric-dark'
  | 'marble-gold'
  | 'sakura-floral'
  | 'slate-carbon';

export interface Point {
  x: number;
  y: number;
  pressure?: number;
}

export interface Stroke {
  id: string;
  tool: 'pen' | 'ballpoint' | 'highlighter' | 'pencil';
  color: string;
  size: number;
  opacity: number;
  points: Point[];
  shape?: ShapeType;
  shapeStart?: Point;
  shapeEnd?: Point;
}

export interface TextBox {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  bold?: boolean;
  italic?: boolean;
  backgroundColor?: string;
}

export interface StickyNote {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  color: 'yellow' | 'pink' | 'green' | 'blue' | 'purple' | 'orange';
  rotation: number;
}

export interface StampItem {
  id: string;
  x: number;
  y: number;
  icon: string;
  label: string;
  color: string;
  size: number;
}

export interface EmbeddedImage {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  dataUrl: string;
}

export interface Page {
  id: string;
  pageNumber: number;
  template: PaperTemplateType;
  paperColor: PaperColor;
  strokes: Stroke[];
  textBoxes: TextBox[];
  stickyNotes: StickyNote[];
  stamps: StampItem[];
  images: EmbeddedImage[];
  thumbnail?: string;
  updatedAt: number;
}

export interface Notebook {
  id: string;
  title: string;
  description?: string;
  folderId: string;
  coverStyle: CoverStyle;
  coverColor: string;
  accentColor: string;
  tag: string;
  favorite: boolean;
  defaultTemplate: PaperTemplateType;
  defaultPaperColor: PaperColor;
  orientation: 'portrait' | 'landscape';
  pages: Page[];
  createdAt: number;
  updatedAt: number;
}

export interface Folder {
  id: string;
  name: string;
  icon: string;
  color: string;
  order: number;
}
