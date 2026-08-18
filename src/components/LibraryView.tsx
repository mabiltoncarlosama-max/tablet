import React, { useState } from 'react';
import { Notebook, Folder } from '../types';
import { NotebookCover } from './NotebookCover';
import { type User } from '../lib/firebase';
import {
  Plus,
  Search,
  BookOpen,
  FolderPlus,
  Folder as FolderIcon,
  Star,
  LayoutGrid,
  List,
  Sparkles,
  MoreVertical,
  Trash2,
  Copy,
  Edit,
  FolderInput,
  FileDown,
  ArrowUpDown,
  GraduationCap,
  Briefcase,
  Calendar,
  Download,
  CheckCircle,
  LogOut,
  User as UserIcon,
  ShieldCheck,
} from 'lucide-react';

interface LibraryViewProps {
  notebooks: Notebook[];
  folders: Folder[];
  currentFolderId: string;
  user?: User | null;
  onSignOut?: () => void;
  onSelectFolder: (folderId: string) => void;
  onOpenNotebook: (notebook: Notebook) => void;
  onCreateNotebook: () => void;
  onEditNotebook: (notebook: Notebook) => void;
  onDeleteNotebook: (notebookId: string) => void;
  onDuplicateNotebook: (notebook: Notebook) => void;
  onToggleFavorite: (notebookId: string) => void;
  onMoveNotebookFolder: (notebookId: string, targetFolderId: string) => void;
  onCreateFolder: (name: string, icon: string, color: string) => void;
  onDeleteFolder: (folderId: string) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  notebooks,
  folders,
  currentFolderId,
  user,
  onSignOut,
  onSelectFolder,
  onOpenNotebook,
  onCreateNotebook,
  onEditNotebook,
  onDeleteNotebook,
  onDuplicateNotebook,
  onToggleFavorite,
  onMoveNotebookFolder,
  onCreateFolder,
  onDeleteFolder,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFavoriteOnly, setFilterFavoriteOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'shelf' | 'list'>('shelf');
  const [sortBy, setSortBy] = useState<'recent' | 'title' | 'pages'>('recent');
  const [selectedNotebookMenu, setSelectedNotebookMenu] = useState<string | null>(null);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('#3B82F6');
  const [newFolderIcon, setNewFolderIcon] = useState('BookOpen');
  const [showExportSuccess, setShowExportSuccess] = useState(false);

  // Manual Backup Export function
  const handleExportAllData = () => {
    const backupData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      appName: 'Cuaderno Digital Tablet',
      totalNotebooks: notebooks.length,
      totalFolders: folders.length,
      folders: folders,
      notebooks: notebooks,
    };

    const jsonString = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    a.download = `respaldo-cuadernos-${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setShowExportSuccess(true);
    setTimeout(() => {
      setShowExportSuccess(false);
    }, 4000);
  };

  // Filter notebooks
  const filteredNotebooks = notebooks
    .filter((nb) => {
      // Folder filter
      if (currentFolderId !== 'folder-all' && nb.folderId !== currentFolderId) {
        return false;
      }
      // Favorites filter
      if (filterFavoriteOnly && !nb.favorite) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = nb.title.toLowerCase().includes(q);
        const matchesDesc = (nb.description || '').toLowerCase().includes(q);
        const matchesTag = (nb.tag || '').toLowerCase().includes(q);
        return matchesTitle || matchesDesc || matchesTag;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'recent') return b.updatedAt - a.updatedAt;
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'pages') return b.pages.length - a.pages.length;
      return 0;
    });

  const totalPages = notebooks.reduce((sum, nb) => sum + nb.pages.length, 0);

  const getFolderIcon = (iconName: string) => {
    switch (iconName) {
      case 'GraduationCap':
        return <GraduationCap className="w-4 h-4" />;
      case 'Briefcase':
        return <Briefcase className="w-4 h-4" />;
      case 'Calendar':
        return <Calendar className="w-4 h-4" />;
      case 'Sparkles':
        return <Sparkles className="w-4 h-4" />;
      default:
        return <FolderIcon className="w-4 h-4" />;
    }
  };

  const handleCreateFolderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    onCreateFolder(newFolderName.trim(), newFolderIcon, newFolderColor);
    setNewFolderName('');
    setShowNewFolderModal(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FAF9F6] text-[#262626] overflow-hidden select-none">
      {/* Top Tablet Navigation Bar */}
      <header className="px-6 py-4 bg-white border-b border-[#E5E2D9] shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* App Title & Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#262626] text-white flex items-center justify-center shadow-xs">
            <BookOpen className="w-5 h-5 stroke-[1.75]" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#262626] font-display leading-tight flex items-center gap-2">
              Mis Cuadernos Digitales
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#F2F0EB] text-[#4A5568] font-sans font-medium border border-[#E5E2D9]">
                Tablet Pro
              </span>
            </h1>
            <p className="text-xs text-[#717171]">
              {notebooks.length} {notebooks.length === 1 ? 'libreta' : 'libretas'} • {totalPages} páginas de apuntes
            </p>
          </div>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Search bar */}
          <div className="relative w-56 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#A09E96]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar apuntes o materias..."
              className="w-full pl-9 pr-3.5 py-2 text-xs font-medium rounded-xl border border-[#E5E2D9] bg-[#FAF9F6] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#262626] text-[#262626] placeholder-[#A09E96] transition-colors"
            />
          </div>

          {/* Filter by Favorites */}
          <button
            type="button"
            onClick={() => setFilterFavoriteOnly(!filterFavoriteOnly)}
            className={`px-3 py-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-colors ${
              filterFavoriteOnly
                ? 'border-[#262626] bg-[#262626] text-white shadow-xs'
                : 'border-[#E5E2D9] bg-white text-[#4A5568] hover:bg-[#F2F0EB]'
            }`}
            title="Mostrar sólo favoritos"
          >
            <Star className={`w-3.5 h-3.5 ${filterFavoriteOnly ? 'fill-amber-400 text-amber-400' : 'text-[#717171]'}`} />
            <span className="hidden sm:inline">Favoritos</span>
          </button>

          {/* View mode toggle */}
          <div className="flex items-center bg-[#F2F0EB] p-0.5 rounded-xl border border-[#E5E2D9]">
            <button
              type="button"
              onClick={() => setViewMode('shelf')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === 'shelf' ? 'bg-white shadow-xs text-[#262626] font-bold' : 'text-[#717171] hover:text-[#262626]'
              }`}
              title="Vista de Estantería"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === 'list' ? 'bg-white shadow-xs text-[#262626] font-bold' : 'text-[#717171] hover:text-[#262626]'
              }`}
              title="Vista de Lista"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-1 text-xs text-[#4A5568] font-medium">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#A09E96]" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'recent' | 'title' | 'pages')}
              className="bg-white border border-[#E5E2D9] rounded-xl px-2.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#262626] text-[#262626]"
            >
              <option value="recent">Recientes</option>
              <option value="title">Título (A-Z)</option>
              <option value="pages">Más páginas</option>
            </select>
          </div>

          {/* Export Data CTA Button */}
          <button
            type="button"
            onClick={handleExportAllData}
            className="px-3.5 py-2 rounded-xl border border-[#E5E2D9] bg-white hover:bg-[#F2F0EB] text-[#262626] text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
            title="Descargar archivo JSON con todos los cuadernos y carpetas para respaldo"
          >
            <Download className="w-4 h-4 text-[#4A5568]" />
            <span>Exportar Data</span>
          </button>

          {/* New Notebook CTA Button */}
          <button
            type="button"
            onClick={onCreateNotebook}
            className="px-4 py-2 rounded-xl bg-[#262626] hover:bg-[#171717] text-white text-xs font-semibold shadow-xs hover:shadow-md flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nuevo Cuaderno</span>
          </button>

          {/* User Profile & Sign Out Button */}
          {user && (
            <div className="flex items-center gap-2 pl-2 border-l border-[#E5E2D9]">
              <div
                className="flex items-center gap-2 py-1 px-2.5 rounded-xl bg-[#F2F0EB] border border-[#E5E2D9] text-xs text-[#262626]"
                title={`Sesión activa: ${user.email}`}
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Usuario'}
                    className="w-5 h-5 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-[#262626] text-white flex items-center justify-center text-[10px] font-bold">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <span className="font-semibold max-w-[100px] truncate hidden md:inline">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
              </div>

              {onSignOut && (
                <button
                  type="button"
                  onClick={onSignOut}
                  className="p-2 rounded-xl border border-[#E5E2D9] bg-white hover:bg-rose-50 hover:border-rose-300 text-[#717171] hover:text-rose-600 transition-colors shadow-2xs"
                  title="Cerrar Sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Backup Success Toast */}
      {showExportSuccess && (
        <div className="fixed top-20 right-6 z-50 bg-[#262626] text-white px-4 py-2.5 rounded-xl shadow-lg border border-black/10 flex items-center gap-2.5 text-xs animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>¡Archivo JSON de respaldo descargado exitosamente!</span>
        </div>
      )}

      {/* Main Workspace with Folders / Categories Sidebar & Shelf */}
      <div className="flex-1 flex overflow-hidden">
        {/* Folders Navigation Bar / Sidebar */}
        <aside className="w-64 bg-[#F2F0EB]/60 border-r border-[#E5E2D9] flex flex-col p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-3 px-2">
            <span className="text-[11px] font-semibold tracking-wider text-[#717171] uppercase">
              Asignaturas & Carpetas
            </span>
            <button
              type="button"
              onClick={() => setShowNewFolderModal(true)}
              className="p-1 rounded-lg hover:bg-[#E5E2D9] text-[#717171] hover:text-[#262626] transition-colors"
              title="Nueva carpeta"
            >
              <FolderPlus className="w-4 h-4" />
            </button>
          </div>

          {/* Folders List */}
          <div className="flex flex-col gap-1">
            {folders.map((folder) => {
              const isSelected = currentFolderId === folder.id;
              const count =
                folder.id === 'folder-all'
                  ? notebooks.length
                  : notebooks.filter((n) => n.folderId === folder.id).length;

              return (
                <div
                  key={folder.id}
                  onClick={() => onSelectFolder(folder.id)}
                  className={`group px-3 py-2.5 rounded-xl cursor-pointer flex items-center justify-between text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-white text-[#262626] shadow-xs border border-[#E5E2D9]'
                      : 'text-[#4A5568] hover:bg-[#E5E2D9]/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span
                      className={`p-1 rounded-lg ${
                        isSelected ? 'bg-[#F2F0EB] text-[#262626]' : 'text-[#717171] group-hover:text-[#262626]'
                      }`}
                      style={{ color: !isSelected ? folder.color : undefined }}
                    >
                      {getFolderIcon(folder.icon)}
                    </span>
                    <span className="truncate">{folder.name}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                        isSelected ? 'bg-[#262626] text-white' : 'bg-[#E5E2D9]/70 text-[#717171]'
                      }`}
                    >
                      {count}
                    </span>

                    {/* Delete custom folder */}
                    {folder.id !== 'folder-all' &&
                      folder.id !== 'folder-uni' &&
                      folder.id !== 'folder-work' &&
                      folder.id !== 'folder-planner' &&
                      folder.id !== 'folder-ideas' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteFolder(folder.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-600 transition-opacity"
                          title="Eliminar carpeta"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Tablet Tips & Backup button at bottom of sidebar */}
          <div className="mt-auto pt-4 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={handleExportAllData}
              className="w-full py-2 px-3 rounded-xl border border-[#E5E2D9] bg-white hover:bg-[#FAF9F6] text-[#262626] text-xs font-semibold shadow-2xs flex items-center justify-center gap-2 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-[#4A5568]" />
              <span>Exportar Data (JSON)</span>
            </button>

            <div className="p-3.5 rounded-2xl bg-white border border-[#E5E2D9] shadow-xs">
              <div className="flex items-center gap-2 text-[#262626] font-semibold text-xs mb-1">
                <Sparkles className="w-3.5 h-3.5 text-[#4A5568]" />
                Consejo para Tablet
              </div>
              <p className="text-[11px] text-[#717171] leading-relaxed">
                Activa el <strong>Modo Rechazo de Palma</strong> al usar lápiz óptico para escribir con total comodidad apoyando la mano.
              </p>
            </div>
          </div>
        </aside>

        {/* Notebooks Display Canvas / Bookshelf */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-8 bg-[#FAF9F6]">
          {filteredNotebooks.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-[#F2F0EB] text-[#4A5568] flex items-center justify-center border border-[#E5E2D9] mb-4">
                <BookOpen className="w-8 h-8 stroke-[1.5]" />
              </div>
              <h3 className="text-base font-bold text-[#262626] font-display">
                No hay cuadernos en esta carpeta
              </h3>
              <p className="text-xs text-[#717171] mt-1 mb-6">
                Crea tu primera libreta con hermosas portadas de cuero, plantillas Cornell o planificadores.
              </p>
              <button
                type="button"
                onClick={onCreateNotebook}
                className="px-4 py-2 rounded-xl bg-[#262626] hover:bg-[#171717] text-white text-xs font-semibold shadow-xs flex items-center gap-2 transition-all"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                Crear Cuaderno
              </button>
            </div>
          ) : viewMode === 'shelf' ? (
            /* Visual 3D Bookshelf Mode */
            <div className="flex flex-col gap-10">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8 justify-items-center">
                {/* Create New Notebook Card button */}
                <div
                  onClick={onCreateNotebook}
                  className="w-48 h-64 sm:w-52 sm:h-72 rounded-2xl border-2 border-dashed border-[#E5E2D9] hover:border-[#262626] bg-white/70 hover:bg-white cursor-pointer transition-all flex flex-col items-center justify-center p-6 text-center group shadow-xs hover:shadow-md"
                >
                  <div className="w-11 h-11 rounded-xl bg-[#F2F0EB] text-[#262626] flex items-center justify-center group-hover:scale-105 transition-transform mb-3 border border-[#E5E2D9]">
                    <Plus className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <span className="font-semibold text-xs text-[#262626]">
                    Añadir Libreta
                  </span>
                  <span className="text-[11px] text-[#A09E96] mt-1">
                    Elige estilo y plantilla
                  </span>
                </div>

                {/* Notebook items */}
                {filteredNotebooks.map((nb) => (
                  <div key={nb.id} className="relative flex flex-col items-center group">
                    <NotebookCover
                      notebook={nb}
                      onClick={() => onOpenNotebook(nb)}
                      showFavoriteToggle={() => onToggleFavorite(nb.id)}
                    />

                    {/* Quick Menu Button */}
                    <div className="absolute top-2 right-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedNotebookMenu(selectedNotebookMenu === nb.id ? null : nb.id);
                          }}
                          className="p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white shadow-md transition-colors"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>

                        {selectedNotebookMenu === nb.id && (
                          <div
                            className="absolute right-0 top-8 w-44 bg-white rounded-xl shadow-xl border border-[#E5E2D9] py-1.5 z-40 animate-in fade-in"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                onOpenNotebook(nb);
                                setSelectedNotebookMenu(null);
                              }}
                              className="w-full px-3 py-1.5 text-left text-xs font-medium text-[#262626] hover:bg-[#F2F0EB] flex items-center gap-2"
                            >
                              <BookOpen className="w-3.5 h-3.5 text-[#4A5568]" />
                              Abrir Libreta
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onEditNotebook(nb);
                                setSelectedNotebookMenu(null);
                              }}
                              className="w-full px-3 py-1.5 text-left text-xs font-medium text-[#262626] hover:bg-[#F2F0EB] flex items-center gap-2"
                            >
                              <Edit className="w-3.5 h-3.5 text-[#4A5568]" />
                              Editar Portada
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onDuplicateNotebook(nb);
                                setSelectedNotebookMenu(null);
                              }}
                              className="w-full px-3 py-1.5 text-left text-xs font-medium text-[#262626] hover:bg-[#F2F0EB] flex items-center gap-2"
                            >
                              <Copy className="w-3.5 h-3.5 text-[#4A5568]" />
                              Duplicar
                            </button>
                            <div className="h-[1px] bg-[#E5E2D9] my-1" />
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteNotebook(nb.id);
                                setSelectedNotebookMenu(null);
                              }}
                              className="w-full px-3 py-1.5 text-left text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Eliminar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* List View Mode */
            <div className="bg-white rounded-2xl border border-[#E5E2D9] shadow-xs overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F2F0EB]/60 border-b border-[#E5E2D9] text-[#717171] font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3">Cuaderno</th>
                    <th className="px-4 py-3">Carpeta / Asignatura</th>
                    <th className="px-4 py-3">Páginas</th>
                    <th className="px-4 py-3">Última Edición</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E2D9] font-medium text-[#262626]">
                  {filteredNotebooks.map((nb) => {
                    const folder = folders.find((f) => f.id === nb.folderId);
                    return (
                      <tr
                        key={nb.id}
                        onClick={() => onOpenNotebook(nb)}
                        className="hover:bg-[#F2F0EB]/50 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-3.5 flex items-center gap-3">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleFavorite(nb.id);
                            }}
                            className="text-[#A09E96] hover:text-amber-500"
                          >
                            <Star
                              className={`w-4 h-4 ${
                                nb.favorite ? 'fill-amber-400 text-amber-500' : 'text-[#D1CEC7]'
                              }`}
                            />
                          </button>
                          <div
                            className="w-6 h-8 rounded-sm shadow-xs border border-black/10"
                            style={{ backgroundColor: nb.coverColor }}
                          />
                          <div>
                            <div className="font-semibold text-[#262626]">{nb.title}</div>
                            {nb.description && (
                              <div className="text-[11px] text-[#717171] line-clamp-1">
                                {nb.description}
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="px-2 py-0.5 rounded-md bg-[#F2F0EB] text-[#4A5568] text-[11px] font-medium border border-[#E5E2D9]">
                            📁 {folder?.name || 'General'}
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="font-medium text-[#4A5568]">{nb.pages.length} páginas</span>
                        </td>

                        <td className="px-4 py-3.5 text-[#717171]">
                          {new Date(nb.updatedAt).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDuplicateNotebook(nb);
                              }}
                              className="p-1.5 rounded-lg hover:bg-[#F2F0EB] text-[#4A5568]"
                              title="Duplicar"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteNotebook(nb.id);
                              }}
                              className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600"
                              title="Eliminar"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>

      {/* New Folder Creation Modal */}
      {showNewFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="bg-white rounded-2xl shadow-xl border border-[#E5E2D9] w-full max-w-md p-6 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-[#262626] font-display flex items-center gap-2 mb-4">
              <FolderPlus className="w-4 h-4 text-[#4A5568]" />
              Nueva Carpeta / Asignatura
            </h3>

            <form onSubmit={handleCreateFolderSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#4A5568] mb-1">
                  Nombre de la Carpeta *
                </label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="ej. Anatomía, Finanzas, Idiomas..."
                  required
                  autoFocus
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E2D9] focus:outline-none focus:ring-1 focus:ring-[#262626] text-xs font-medium text-[#262626] bg-[#FAF9F6] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4A5568] mb-1">
                  Color Identificador
                </label>
                <div className="flex items-center gap-2">
                  {['#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#EF4444', '#4A5568'].map(
                    (color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewFolderColor(color)}
                        className={`w-7 h-7 rounded-full transition-transform ${
                          newFolderColor === color ? 'ring-2 ring-[#262626] scale-110 shadow-xs' : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    )
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E2D9] mt-2">
                <button
                  type="button"
                  onClick={() => setShowNewFolderModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-[#717171] hover:bg-[#F2F0EB]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!newFolderName.trim()}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#262626] hover:bg-[#171717] text-white shadow-xs disabled:opacity-50"
                >
                  Crear Carpeta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
