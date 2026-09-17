export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  folder: string;
  isPinned: boolean;
  updatedAt: number;
  createdAt: number;
  userId: string;
}

export type SyncStatus = 'saved' | 'saving' | 'offline' | 'error';

export type NoteFilter = {
  folder: string; // 'all' or specific folder name
  tag: string | null; // specific tag or null
  onlyPinned: boolean;
  searchQuery: string;
};

export interface NotebookFolder {
  id: string;
  name: string;
  icon?: string;
}
