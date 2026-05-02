import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Zap, Crosshair, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { adminTactical } from '../admin-tactical-ui';
import { useAuth } from '../components/auth-context';
import { getSupabaseClient } from '../../lib/supabase';
import {
  deleteWorkflowRule,
  fetchWorkflowRules,
  insertWorkflowRule,
  updateWorkflowRule,
  type WorkflowRuleRow,
} from '../api/supabase-api';

interface DemoRule {
  id: string;
  condition: string;
  conditionValue: string;
  action: string;
  enabled: boolean;
}

const INITIAL_DEMO_RULES: DemoRule[] = [
  {
    id: 'r1',
    condition: 'priority',
    conditionValue: 'High',
    action: 'mark_urgent AND notify_admin_instantly',
    enabled: true,
  },
  {
    id: 'r2',
    condition: 'category',
    conditionValue: 'Safety',
    action: 'escalate_to_facilities_team',
    enabled: true,
  },
  {
    id: 'r3',
    condition: 'upvotes',
    conditionValue: '> 20',
    action: 'auto_review AND boost_priority',
    enabled: false,
  },
];

export function AdminRulesPage() {
  const { backendMode, isAdmin } = useAuth();
  const supabase = getSupabaseClient();
  const cloud = backendMode === 'supabase';

  const [demoRules, setDemoRules] = useState(INITIAL_DEMO_RULES);
  const [rows, setRows] = useState<WorkflowRuleRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [newRow, setNewRow] = useState({
    condition_field: '',
    condition_value: '',
    action: '',
    enabled: true,
    sort_order: 0,
  });

  const reload = useCallback(async () => {
    if (!cloud || !supabase || !isAdmin) {
      setRows([]);
      setError('');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const list = await fetchWorkflowRules(supabase);
      setRows(list);
    } catch (e) {
      setRows([]);
      setError(e instanceof Error ? e.message : 'Could not load workflow rules.');
    } finally {
      setLoading(false);
    }
  }, [cloud, supabase, isAdmin]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const toggleDemo = (id: string) => {
    setDemoRules(demoRules.map(r => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  };

  const deleteDemo = (id: string) => {
    setDemoRules(demoRules.filter(r => r.id !== id));
  };

  const toggleCloud = async (id: string, enabled: boolean) => {
    if (!supabase) return;
    try {
      await updateWorkflowRule(supabase, id, { enabled: !enabled });
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed.');
    }
  };

  const deleteCloud = async (id: string) => {
    if (!supabase) return;
    try {
      await deleteWorkflowRule(supabase, id);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed.');
    }
  };

  const addCloud = async () => {
    if (!supabase) return;
    const condition_field = newRow.condition_field.trim();
    const condition_value = newRow.condition_value.trim();
    const action = newRow.action.trim();
    if (!condition_field || !condition_value || !action) {
      setError('Fill condition field, value, and action.');
      return;
    }
    setError('');
    try {
      await insertWorkflowRule(supabase, {
        condition_field,
        condition_value,
        action,
        enabled: newRow.enabled,
        sort_order: newRow.sort_order,
      });
      setNewRow({
        condition_field: '',
        condition_value: '',
        action: '',
        enabled: true,
        sort_order: rows.length,
      });
      setAdding(false);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Insert failed.');
    }
  };

  if (cloud && !isAdmin) {
    return (
      <div className="premium-page max-w-6xl">
        <p className="text-sm text-muted-foreground">Admin access required for workflow rules.</p>
      </div>
    );
  }

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
            {!cloud ? (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-border text-sm text-muted-foreground shrink-0">
                <Plus className="w-4 h-4" />
                Live DB in Supabase mode
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setAdding(a => !a);
                  setError('');
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors text-sm shrink-0"
              >
                <Plus className="w-4 h-4" />
                Add rule
              </button>
            )}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {cloud
              ? 'Rules persist in table public.workflow_rules (admin-only RLS). Use them for ops labels, runbooks, or future automation — interpretation is your policy layer.'
              : 'Demo IF → THEN rows stay in the browser only. Connect VITE_SUPABASE_* and use an admin account to edit live rules.'}
          </p>
          {error && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
        </div>
      </motion.div>

      {cloud && adding && (
        <div className={`rounded-2xl ${adminTactical.borderSoft} ${adminTactical.panelInner} p-4 space-y-3`}>
          <p className={adminTactical.label}>New rule</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <input
              value={newRow.condition_field}
              onChange={e => setNewRow({ ...newRow, condition_field: e.target.value })}
              placeholder="Condition field (e.g. priority)"
              className="px-3 py-2 rounded-xl border border-border bg-background text-sm"
            />
            <input
              value={newRow.condition_value}
              onChange={e => setNewRow({ ...newRow, condition_value: e.target.value })}
              placeholder="Value (e.g. High)"
              className="px-3 py-2 rounded-xl border border-border bg-background text-sm"
            />
          </div>
          <textarea
            value={newRow.action}
            onChange={e => setNewRow({ ...newRow, action: e.target.value })}
            placeholder="Action label (e.g. mark_urgent AND notify_admin_instantly)"
            rows={2}
            className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm resize-none"
          />
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={newRow.enabled}
                onChange={e => setNewRow({ ...newRow, enabled: e.target.checked })}
              />
              Enabled
            </label>
            <label className="flex items-center gap-2 text-sm">
              Sort order
              <input
                type="number"
                value={newRow.sort_order}
                onChange={e => setNewRow({ ...newRow, sort_order: Number(e.target.value) || 0 })}
                className="w-20 px-2 py-1 rounded-lg border border-border bg-background text-sm"
              />
            </label>
            <button
              type="button"
              onClick={() => void addCloud()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm hover:bg-primary/90"
            >
              Save to database
            </button>
          </div>
        </div>
      )}

      {cloud && loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading rules…
        </div>
      )}

      <div className="space-y-4">
        {cloud
          ? rows.map((rule, i) => (
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
                      <p className={`${adminTactical.label} mb-2`}>Rule · {rule.id.slice(0, 8)}…</p>
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Zap className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-sm" style={{ fontWeight: 600 }}>
                          IF <span className="text-primary">{rule.condition_field}</span> ={' '}
                          <span className="text-primary">{rule.condition_value}</span>
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground ml-0 sm:ml-6">
                        THEN <span style={{ fontWeight: 500 }}>{rule.action}</span>
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-2 font-mono">
                        sort {rule.sort_order}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => void toggleCloud(rule.id, rule.enabled)}
                        className={`w-10 h-6 rounded-full transition-colors relative ${rule.enabled ? 'bg-primary' : 'bg-switch-background'}`}
                        aria-pressed={rule.enabled}
                      >
                        <div
                          className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${rule.enabled ? 'translate-x-5' : 'translate-x-1'}`}
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteCloud(rule.id)}
                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500 border border-transparent hover:border-red-500/20"
                        aria-label="Delete rule"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          : demoRules.map((rule, i) => (
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
                        onClick={() => toggleDemo(rule.id)}
                        className={`w-10 h-6 rounded-full transition-colors relative ${rule.enabled ? 'bg-primary' : 'bg-switch-background'}`}
                        aria-pressed={rule.enabled}
                      >
                        <div
                          className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${rule.enabled ? 'translate-x-5' : 'translate-x-1'}`}
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteDemo(rule.id)}
                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500 border border-transparent hover:border-red-500/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
      </div>

      {cloud && !loading && rows.length === 0 && !error && (
        <p className="text-sm text-muted-foreground text-center py-6">No workflow rules yet. Add one above.</p>
      )}
    </div>
  );
}
