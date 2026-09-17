export interface FolderStyle {
  badgeClass: string;
  iconClass: string;
}

const PRESET_FOLDER_COLORS: Record<string, FolderStyle> = {
  general: {
    badgeClass: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200/80 dark:border-zinc-700',
    iconClass: 'text-zinc-500 dark:text-zinc-400',
  },
  work: {
    badgeClass: 'bg-emerald-100/90 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60',
    iconClass: 'text-emerald-600 dark:text-emerald-400',
  },
  study: {
    badgeClass: 'bg-blue-100/90 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-200/80 dark:border-blue-800/60',
    iconClass: 'text-blue-600 dark:text-blue-400',
  },
  ideas: {
    badgeClass: 'bg-amber-100/90 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60',
    iconClass: 'text-amber-600 dark:text-amber-400',
  },
  projects: {
    badgeClass: 'bg-purple-100/90 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-200/80 dark:border-purple-800/60',
    iconClass: 'text-purple-600 dark:text-purple-400',
  },
};

const DYNAMIC_PALETTE: FolderStyle[] = [
  {
    badgeClass: 'bg-rose-100/90 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/60',
    iconClass: 'text-rose-600 dark:text-rose-400',
  },
  {
    badgeClass: 'bg-indigo-100/90 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800/60',
    iconClass: 'text-indigo-600 dark:text-indigo-400',
  },
  {
    badgeClass: 'bg-teal-100/90 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border-teal-200/80 dark:border-teal-800/60',
    iconClass: 'text-teal-600 dark:text-teal-400',
  },
  {
    badgeClass: 'bg-orange-100/90 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 border-orange-200/80 dark:border-orange-800/60',
    iconClass: 'text-orange-600 dark:text-orange-400',
  },
  {
    badgeClass: 'bg-cyan-100/90 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 border-cyan-200/80 dark:border-cyan-800/60',
    iconClass: 'text-cyan-600 dark:text-cyan-400',
  },
  {
    badgeClass: 'bg-pink-100/90 dark:bg-pink-950/60 text-pink-800 dark:text-pink-300 border-pink-200/80 dark:border-pink-800/60',
    iconClass: 'text-pink-600 dark:text-pink-400',
  },
];

export function getFolderStyle(folderName: string): FolderStyle {
  if (!folderName) {
    return PRESET_FOLDER_COLORS.general;
  }
  const clean = folderName.trim().toLowerCase();
  if (PRESET_FOLDER_COLORS[clean]) {
    return PRESET_FOLDER_COLORS[clean];
  }

  // Hash folder name to pick from dynamic palette
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash * 31 + clean.charCodeAt(i)) & 0xffffffff;
  }
  const index = Math.abs(hash) % DYNAMIC_PALETTE.length;
  return DYNAMIC_PALETTE[index];
}
