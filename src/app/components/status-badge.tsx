import { Clock, Eye, Settings, CheckCircle, AlertTriangle } from 'lucide-react';
import { STATUS_COLORS, PRIORITY_COLORS, type Status } from '../data/mock-data';

const STATUS_ICONS: Record<Status, React.ReactNode> = {
  Pending: <Clock className="w-3.5 h-3.5" />,
  Reviewed: <Eye className="w-3.5 h-3.5" />,
  Processing: <Settings className="w-3.5 h-3.5" />,
  Resolved: <CheckCircle className="w-3.5 h-3.5" />,
};

export function StatusBadge({ status }: { status: Status }) {
  const c = STATUS_COLORS[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${c.bg} ${c.text}`}>
      {STATUS_ICONS[status]}
      <span className="text-xs">{status}</span>
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const isHigh = priority === 'High';
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs ${PRIORITY_COLORS[priority]}`}>
      {isHigh && <AlertTriangle className="w-3 h-3" />}
      {priority}
    </span>
  );
}
