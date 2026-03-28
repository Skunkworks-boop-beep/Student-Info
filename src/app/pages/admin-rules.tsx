import { useState } from 'react';
import { Plus, Trash2, Zap, Crosshair } from 'lucide-react';
import { motion } from 'motion/react';
import { adminTactical } from '../admin-tactical-ui';

interface Rule {
  id: string;
  condition: string;
  conditionValue: string;
  action: string;
  enabled: boolean;
}

const INITIAL_RULES: Rule[] = [
  { id: 'r1', condition: 'priority', conditionValue: 'High', action: 'mark_urgent AND notify_admin_instantly', enabled: true },
  { id: 'r2', condition: 'category', conditionValue: 'Safety', action: 'escalate_to_facilities_team', enabled: true },
  { id: 'r3', condition: 'upvotes', conditionValue: '> 20', action: 'auto_review AND boost_priority', enabled: false },
];

export function AdminRulesPage() {
  const [rules, setRules] = useState(INITIAL_RULES);

  const toggleRule = (id: string) => {
    setRules(rules.map(r => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  };

  const deleteRule = (id: string) => {
    setRules(rules.filter(r => r.id !== id));
  };

  return (
    <div className="premium-page max-w-6xl space-y-5">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative overflow-hidden rounded-2xl ${adminTactical.border} shadow-sm`}
      >
        <div className={`pointer-events-none absolute inset-0 ${adminTactical.wash}`} />
        <div className={`pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-[0.45] ${adminTactical.gridBg}`} />
        <div className={`relative ${adminTactical.panelInner} p-4 sm:p-5`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md ${adminTactical.borderSoft} bg-background/60 ${adminTactical.label}`}
              >
                <Crosshair className="w-3 h-3 text-[#5c6b4a] dark:text-[#8faa7a]" />
                Admin ops
              </span>
              <h1 className="text-2xl sm:text-3xl leading-none truncate" style={{ fontWeight: 800 }}>
                Workflow rules
              </h1>
              <span
                className={`text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded-md border ${adminTactical.borderSoft} text-muted-foreground`}
              >
                IF → THEN
              </span>
            </div>
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors text-sm shrink-0"
            >
              <Plus className="w-4 h-4" />
              Add rule
            </button>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Sample IF → THEN rules stored in the page: toggle, delete, or add rows to prototype how routing labels might
            look—nothing is sent to a server in this build.
          </p>
        </div>
      </motion.div>

      <div className="space-y-4">
        {rules.map((rule, i) => (
          <motion.div
            key={rule.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className={`relative overflow-hidden rounded-2xl ${adminTactical.border} shadow-sm ${!rule.enabled ? 'opacity-60' : ''}`}
          >
            <div className={`pointer-events-none absolute inset-0 ${adminTactical.wash}`} />
            <div className={`pointer-events-none absolute inset-0 opacity-20 dark:opacity-35 ${adminTactical.gridBg}`} />
            <div className={`relative ${adminTactical.panelInner} p-4 sm:p-5`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className={`${adminTactical.label} mb-2`}>Rule · {rule.id}</p>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Zap className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-sm" style={{ fontWeight: 600 }}>
                      IF <span className="text-primary">{rule.condition}</span> ={' '}
                      <span className="text-primary">{rule.conditionValue}</span>
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground ml-0 sm:ml-6">
                    THEN <span style={{ fontWeight: 500 }}>{rule.action}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleRule(rule.id)}
                    className={`w-10 h-6 rounded-full transition-colors relative ${rule.enabled ? 'bg-primary' : 'bg-switch-background'}`}
                    aria-pressed={rule.enabled}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${rule.enabled ? 'translate-x-5' : 'translate-x-1'}`}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteRule(rule.id)}
                    className={`p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500 border border-transparent hover:border-red-500/20`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
