import { useState } from 'react';
import { Plus, Trash2, Zap } from 'lucide-react';

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
    setRules(rules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const deleteRule = (id: string) => {
    setRules(rules.filter(r => r.id !== id));
  };

  return (
    <div className="premium-page max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl" style={{ fontWeight: 700 }}>Workflow Rules</h1>
          <p className="text-sm text-muted-foreground mt-1">IF-THEN automation rules</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors text-sm">
          <Plus className="w-4 h-4" />
          Add Rule
        </button>
      </div>

      <div className="space-y-3">
        {rules.map(rule => (
          <div key={rule.id} className={`premium-panel p-5 transition-opacity ${!rule.enabled ? 'opacity-60' : ''}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-primary" />
                  <span className="text-sm" style={{ fontWeight: 600 }}>
                    IF <span className="text-primary">{rule.condition} = {rule.conditionValue}</span>
                  </span>
                </div>
                <p className="text-sm text-muted-foreground ml-6">
                  THEN <span style={{ fontWeight: 500 }}>{rule.action}</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleRule(rule.id)}
                  className={`w-10 h-6 rounded-full transition-colors relative ${rule.enabled ? 'bg-primary' : 'bg-switch-background'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${rule.enabled ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
                <button onClick={() => deleteRule(rule.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
