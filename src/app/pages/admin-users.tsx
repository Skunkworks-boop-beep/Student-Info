import { useState } from 'react';
import { Search, Zap, Ban, RotateCcw } from 'lucide-react';
import { leaderboard } from '../data/mock-data';
import { firstNameOnly } from '../utils/display-name';

export function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const users = leaderboard.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="premium-page max-w-6xl">
      <div>
        <h1 className="text-3xl" style={{ fontWeight: 700 }}>User Management</h1>
        <p className="text-sm text-muted-foreground mt-1">{leaderboard.length} registered students</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search users..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border focus:ring-2 focus:ring-primary/40 outline-none text-sm"
        />
      </div>

      <div className="premium-panel overflow-hidden">
        {users.map(u => (
          <div key={u.id} className="flex items-center gap-4 p-4 border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm" style={{ fontWeight: 600 }}>
              {firstNameOnly(u.name).charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm" style={{ fontWeight: 500 }}>{firstNameOnly(u.name)}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-primary" />{u.uni_xp} XP</span>
                <span>·</span>
                <span>{u.streak}d streak</span>
              </div>
            </div>
            <div className="flex gap-1">
              <button className="p-2 hover:bg-accent rounded-lg transition-colors text-muted-foreground" title="Reset Password">
                <RotateCcw className="w-4 h-4" />
              </button>
              <button className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-red-500" title="Suspend">
                <Ban className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
