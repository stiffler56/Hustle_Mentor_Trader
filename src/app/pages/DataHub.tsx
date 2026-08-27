import React, { useState } from 'react';
import {
  Database, Github, HardDrive, Layers,
} from 'lucide-react';
import { useTheme } from '../data/ThemeContext';
import NotionSync from './NotionSync';
import GitHubSyncPage from './GitHubSync';
import DataManager from './DataManager';

type Tab = 'import' | 'github' | 'local';

const TABS: { key: Tab; label: string; icon: React.ElementType; desc: string }[] = [
  { key: 'import', label: 'Import', icon: Database, desc: 'Notion CSV or API' },
  { key: 'github', label: 'GitHub Sync', icon: Github, desc: 'Cloud backup & sync' },
  { key: 'local',  label: 'Local Data', icon: HardDrive, desc: 'Export, import, clear' },
];

export default function DataHub() {
  const { colors } = useTheme();
  const [tab, setTab] = useState<Tab>('import');

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Layers size={20} style={{ color: '#f59e0b' }} />
          <h1 className="text-xl" style={{ color: colors.text }}>Data Hub</h1>
        </div>
        <p className="text-sm" style={{ color: colors.textMuted }}>
          Import trades, sync to GitHub, and manage your local data — all in one place.
        </p>
      </div>

      <div className="flex rounded-xl p-1 gap-1" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-all"
            style={{
              background: tab === t.key ? 'rgba(245,158,11,0.12)' : 'transparent',
              color: tab === t.key ? '#f59e0b' : colors.textSub,
              border: tab === t.key ? '1px solid rgba(245,158,11,0.25)' : '1px solid transparent',
            }}
          >
            <t.icon size={14} />
            <span className="hidden sm:inline">{t.label}</span>
            <span className="sm:hidden">{t.label.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      <div>
        {tab === 'import' && <NotionSyncEmbed />}
        {tab === 'github' && <GitHubSyncEmbed />}
        {tab === 'local' && <DataManagerEmbed />}
      </div>
    </div>
  );
}

function NotionSyncEmbed() {
  return <div className="-m-4 lg:-m-6"><NotionSync /></div>;
}

function GitHubSyncEmbed() {
  return <div className="-m-4 lg:-m-6"><GitHubSyncPage /></div>;
}

function DataManagerEmbed() {
  return <div className="-m-4 lg:-m-6"><DataManager /></div>;
}
