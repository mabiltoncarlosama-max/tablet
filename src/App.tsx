**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Notebook, Folder } from './types';
import {
  auth,
  onAuthStateChanged,
  signOut,
  type User,
} from './lib/firebase';
import {
  loadUserNotebooks,
  saveUserNotebook,
  deleteUserNotebook,
  loadUserFolders,
  saveUserFolders,
} from './storage/db';
import { LibraryView } from './components/LibraryView';
import { NotebookEditorView } from './components/NotebookEditorView';
import { NewNotebookModal } from './components/NewNotebookModal';
import { AuthScreen } from './components/AuthScreen';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState<boolean>(false);
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string>('folder-all');
  const [activeNotebook, setActiveNotebook] = useState<Notebook | null>(null);
  const [showNewNotebookModal, setShowNewNotebookModal] = useState<boolean>(false);
  const [editingNotebook, setEditingNotebook] = useState<Notebook | null>(null);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthChecked(true);

      if (currentUser) {
        setIsLoadingData(true);
        try {
          const [loadedFolders, loadedNotebooks] = await Promise.all([
            loadUserFolders(currentUser.uid),
            loadUserNotebooks(currentUser.uid),
          ]);
          setFolders(loadedFolders);
          setNotebooks(loadedNotebooks);
        } catch (err) {
          console.error('Failed to load user data from Firestore:', err);
        } finally {
          setIsLoadingData(false);
        }
      } else {
        setNotebooks([]);
        setFolders([]);
        setActiveNotebook(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Save notebook
  const handleSaveNotebook = async (nb: Notebook) => {
    const existingIdx = notebooks.findIndex((n) => n.id === nb.id);
    let updatedList: Notebook[];
    if (existingIdx >= 0) {
      updatedList = [...notebooks];
      updatedList[existingIdx] = nb;
    } else {
      updatedList = [nb, ...notebooks];
    }
    setNotebooks(updatedList);
    if (activeNotebook && activeNotebook.id === nb.id) {
      setActiveNotebook(nb);
    }

    if (user) {
      await saveUserNotebook(user.uid, nb);
    }
  };

  // Delete notebook
  const handleDeleteNotebook = async (notebookId: string) => {
    const updated = notebooks.filter((n) => n.id !== notebookId);
    setNotebooks(updated);
    if (activeNotebook && activeNotebook.id === notebookId) {
      setActiveNotebook(null);
    }
    if (user) {
      await deleteUserNotebook(user.uid, notebookId);
    }
  };

  // Duplicate notebook
  const handleDuplicateNotebook = async (nb: Notebook) => {
    const duplicated: Notebook = {
      ...nb,
      id: `nb-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: `${nb.title} (Copia)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      pages: nb.pages.map((p, idx) => ({
        ...p,
        id: `p-${Date.now()}-${idx}`,
      })),
    };
    await handleSaveNotebook(duplicated);
  };

  // Toggle favorite
  const handleToggleFavorite = async (notebookId: string) => {
    const nb = notebooks.find((n) => n.id === notebookId);
    if (!nb) return;
    const updated = { ...nb, favorite: !nb.favorite, updatedAt: Date.now() };
    await handleSaveNotebook(updated);
  };

  // Move notebook to folder
  const handleMoveNotebookFolder = async (notebookId: string, targetFolderId: string) => {
    const nb = notebooks.find((n) => n.id === notebookId);
    if (!nb) return;
    const updated = { ...nb, folderId: targetFolderId, updatedAt: Date.now() };
    await handleSaveNotebook(updated);
  };

  // Create custom folder
  const handleCreateFolder = async (name: string, icon: string, color: string) => {
    const newFolder: Folder = {
      id: `folder-${Date.now()}`,
      name,
      icon,
      color,
      order: folders.length,
    };
    const updated = [...folders, newFolder];
    setFolders(updated);
    if (user) {
      await saveUserFolders(user.uid, updated);
    }
  };

  // Delete custom folder
  const handleDeleteFolder = async (folderId: string) => {
    const updated = folders.filter((f) => f.id !== folderId);
    setFolders(updated);
    // Move notebooks in this folder to 'folder-all'
    for (const nb of notebooks.filter((n) => n.folderId === folderId)) {
      await handleSaveNotebook({ ...nb, folderId: 'folder-all' });
    }
    if (currentFolderId === folderId) {
      setCurrentFolderId('folder-all');
    }
    if (user) {
      await saveUserFolders(user.uid, updated);
    }
  };

  // Sign out handler
  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  // Loading initial auth state
  if (!authChecked || isLoadingData) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#FAF9F6] text-[#262626]">
        <div className="w-10 h-10 rounded-xl bg-[#262626] animate-pulse mb-3" />
        <div className="text-sm font-semibold font-display">
          {!authChecked ? 'Verificando sesión...' : 'Cargando tus cuadernos seguros...'}
        </div>
      </div>
    );
  }

  // If not authenticated, require login / register
  if (!user) {
    return <AuthScreen />;
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-[#FAF9F6] text-[#262626] overflow-hidden select-none">
      {activeNotebook ? (
        <NotebookEditorView
          notebook={activeNotebook}
          onBackToLibrary={() => setActiveNotebook(null)}
          onUpdateNotebook={handleSaveNotebook}
        />
      ) : (
        <LibraryView
          notebooks={notebooks}
          folders={folders}
          currentFolderId={currentFolderId}
          user={user}
          onSignOut={handleSignOut}
          onSelectFolder={(id) => setCurrentFolderId(id)}
          onOpenNotebook={(nb) => setActiveNotebook(nb)}
          onCreateNotebook={() => {
            setEditingNotebook(null);
            setShowNewNotebookModal(true);
          }}
          onEditNotebook={(nb) => {
            setEditingNotebook(nb);
            setShowNewNotebookModal(true);
          }}
          onDeleteNotebook={handleDeleteNotebook}
          onDuplicateNotebook={handleDuplicateNotebook}
          onToggleFavorite={handleToggleFavorite}
          onMoveNotebookFolder={handleMoveNotebookFolder}
          onCreateFolder={handleCreateFolder}
          onDeleteFolder={handleDeleteFolder}
        />
      )}

      {/* New / Edit Notebook Modal */}
      {showNewNotebookModal && (
        <NewNotebookModal
          isOpen={showNewNotebookModal}
          onClose={() => {
            setShowNewNotebookModal(false);
            setEditingNotebook(null);
          }}
          folders={folders}
          currentFolderId={currentFolderId}
          onSaveNotebook={handleSaveNotebook}
          editingNotebook={editingNotebook}
        />
      )}
    </div>
  );
}
