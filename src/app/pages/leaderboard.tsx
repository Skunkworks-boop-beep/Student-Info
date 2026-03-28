import { Trophy, Medal, Zap, Flame, Crown } from 'lucide-react';
import { leaderboard, xpActions, currentUser } from '../data/mock-data';
import { firstNameOnly } from '../utils/display-name';

export function LeaderboardPage() {
  const sorted = [...leaderboard].sort((a, b) => b.uni_xp - a.uni_xp);
  const myRank = sorted.findIndex(u => u.id === currentUser.id) + 1;

  const topColors = ['bg-yellow-500', 'bg-gray-400', 'bg-amber-700'];
  const topIcons = [Crown, Medal, Medal];

  return (
    <div className="premium-page max-w-5xl">
      <div>
        <h1 className="text-3xl" style={{ fontWeight: 700 }}>UNI XP Leaderboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Rankings and XP actions shown here come from the bundled leaderboard sample—not live competition data.
        </p>
      </div>

      {/* Your rank */}
      <div className="bg-gradient-to-r from-primary to-primary/70 rounded-2xl p-5 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-lg" style={{ fontWeight: 700 }}>
              #{myRank}
            </div>
            <div>
              <p style={{ fontWeight: 600 }}>{firstNameOnly(currentUser.name)}</p>
              <p className="text-sm opacity-80">Your current ranking</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1">
              <Zap className="w-5 h-5" />
              <span className="text-3xl" style={{ fontWeight: 700 }}>{currentUser.uni_xp}</span>
            </div>
            <p className="text-xs opacity-80">XP Points</p>
          </div>
        </div>
      </div>

      {/* Top 3 podium */}
      <div className="flex items-end justify-center gap-4 py-4">
        {[1, 0, 2].map(idx => {
          const user = sorted[idx];
          if (!user) return null;
          const rank = idx + 1;
          const Icon = topIcons[idx];
          return (
            <div key={user.id} className={`flex flex-col items-center ${idx === 0 ? 'order-2' : idx === 1 ? 'order-1' : 'order-3'}`}>
              <Icon className={`w-6 h-6 mb-2 ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-400' : 'text-amber-700'}`} />
              <div className={`w-14 h-14 rounded-full ${topColors[idx]} flex items-center justify-center text-white text-lg mb-2`} style={{ fontWeight: 700 }}>
                {firstNameOnly(user.name).charAt(0)}
              </div>
              <p className="text-sm" style={{ fontWeight: 600 }}>{firstNameOnly(user.name)}</p>
              <p className="text-xs text-muted-foreground">{user.uni_xp} XP</p>
              <div className={`mt-2 w-20 ${idx === 0 ? 'h-20 bg-yellow-100 dark:bg-yellow-900/20' : idx === 1 ? 'h-14 bg-gray-100 dark:bg-gray-800' : 'h-10 bg-amber-100 dark:bg-amber-900/20'} rounded-t-lg flex items-center justify-center`}>
                <span className="text-lg" style={{ fontWeight: 700 }}>#{rank}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Full list */}
      <div className="premium-panel overflow-hidden">
        {sorted.map((user, i) => (
          <div key={user.id} className={`flex items-center gap-4 p-4 border-b border-border last:border-0 ${user.id === currentUser.id ? 'bg-secondary/50' : ''}`}>
            <span className="w-8 text-center text-sm text-muted-foreground" style={{ fontWeight: 600 }}>#{i + 1}</span>
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm" style={{ fontWeight: 600 }}>
              {firstNameOnly(user.name).charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm" style={{ fontWeight: 500 }}>{firstNameOnly(user.name)}</p>
              <div className="flex items-center gap-2">
                {user.streak > 0 && (
                  <span className="flex items-center gap-0.5 text-xs text-primary">
                    <Flame className="w-3 h-3" />{user.streak}d
                  </span>
                )}
                {user.badges.length > 0 && (
                  <span className="text-xs text-muted-foreground">{user.badges[0]}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 text-sm" style={{ fontWeight: 600 }}>
              <Zap className="w-4 h-4 text-primary" />
              {user.uni_xp}
            </div>
          </div>
        ))}
      </div>

      {/* XP Guide */}
      <div className="premium-panel p-6">
        <h2 className="text-sm mb-4" style={{ fontWeight: 600 }}>How to Earn XP</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {xpActions.map(a => (
            <div key={a.action} className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 text-sm">
              <span>{a.action}</span>
              <span className="text-primary" style={{ fontWeight: 600 }}>{a.xp}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
