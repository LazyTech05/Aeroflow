import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Settings } from 'lucide-react';

export const HeaderUserSection = ({ onOpenShareModal }) => {
  const { user, signOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (!user) return null;

  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    'User';

  const avatarUrl = user.user_metadata?.avatar_url;
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="relative">
      <div className="flex items-center justify-between p-2 rounded-xl bg-surface border border-white/5 shadow-card">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2.5 hover:bg-white/5 transition rounded-lg p-1"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className="w-8 h-8 rounded-full object-cover border border-white/10" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-brand/20 border border-brand/50 text-brand flex items-center justify-center text-xs font-semibold shadow-card">
              {initials}
            </div>
          )}
          <div className="leading-tight text-left">
            <span className="font-semibold text-xs text-slate-100 block truncate max-w-[120px]">{displayName}</span>
          </div>
        </button>
        <button 
          onClick={onOpenShareModal}
          className="p-1.5 rounded-md hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          title="Share Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {dropdownOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-full bg-surface rounded-xl shadow-card border border-white/5 py-1 z-50 backdrop-blur-xl">
          <div className="px-4 py-2 border-b border-white/5">
            <p className="text-xs text-zinc-400 truncate">{user.email}</p>
          </div>
          <button
            onClick={() => {
              setDropdownOpen(false);
              signOut();
            }}
            className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/5 transition"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};
