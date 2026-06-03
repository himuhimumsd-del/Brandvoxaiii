// client/src/components/layout/Topbar.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { formatCredits } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';
import { Coins, Edit2, Check, RefreshCw } from 'lucide-react';
import NotificationBell from '../shared/NotificationBell';

export default function Topbar({
  title = '',
  onRename = null,
  activeTab = '',
  setActiveTab = null,
  tabs = [],
  actionButton = null,
  onOpenNotifications = null
}) {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    setEditedTitle(title);
  }, [title]);

  const handleRenameSubmit = () => {
    if (editedTitle.trim() && editedTitle !== title && onRename) {
      onRename(editedTitle.trim());
    }
    setIsEditing(false);
  };

  const handleSyncCredits = async () => {
    setSyncing(true);
    await refreshProfile();
    setTimeout(() => setSyncing(false), 500);
  };

  return (
    <header className="flex items-center justify-between w-full h-16 px-6 bg-surface border-b border-white/5 select-none z-30">
      {/* LEFT PANEL: Editable Title */}
      <div className="flex items-center space-x-3 w-1/3">
        {onRename ? (
          isEditing ? (
            <div className="flex items-center space-x-1.5 bg-surface-elevated px-2 py-1 rounded-lg border border-primary/30">
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onBlur={handleRenameSubmit}
                onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit()}
                autoFocus
                className="bg-transparent text-sm font-bold text-white focus:outline-none w-44"
              />
              <button onClick={handleRenameSubmit} className="text-success hover:text-green-400">
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2 group">
              <h2 className="text-sm font-extrabold text-white tracking-wide truncate max-w-[200px]">
                {title || 'Untitled Video'}
              </h2>
              <button
                onClick={() => setIsEditing(true)}
                className="opacity-0 group-hover:opacity-100 text-white/40 hover:text-white p-1 rounded-md transition-all cursor-pointer"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            </div>
          )
        ) : (
          <h2 className="text-sm font-extrabold text-white tracking-wider uppercase">
            {title || 'BrandVox AI'}
          </h2>
        )}
      </div>

      {/* CENTER PANEL: Sub Tab Navigation Pills */}
      <div className="flex items-center justify-center w-1/3">
        {tabs.length > 0 && setActiveTab && (
          <div className="flex bg-surface-elevated p-1 rounded-lg border border-white/5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-1.5 text-xs font-semibold rounded-md tracking-wider transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-primary text-white shadow-glow'
                    : 'text-white/40 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT PANEL: Balance Indicators & Primary CTA */}
      <div className="flex items-center justify-end space-x-4 w-1/3">
        {/* Credits Badge */}
        <div className="flex items-center space-x-3 bg-surface-elevated px-3.5 py-1.5 rounded-lg border border-white/5 select-none">
          <Coins className="w-4 h-4 text-warning" />
          <div className="flex flex-col text-right">
            <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Balance</span>
            <span
              onClick={() => navigate('/credits')}
              className="text-xs font-black text-warning cursor-pointer hover:underline"
            >
              {formatCredits(profile?.credits || 0)}
            </span>
          </div>
          <button
            onClick={handleSyncCredits}
            className={`text-white/40 hover:text-white transition-colors cursor-pointer ${
              syncing ? 'animate-spin text-primary' : ''
            }`}
            title="Sync Balance"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>

        {/* Notification Bell */}
        <NotificationBell onOpenDrawer={onOpenNotifications} />

        {/* Global Action / Generate Button */}
        {actionButton}
      </div>
    </header>
  );
}
