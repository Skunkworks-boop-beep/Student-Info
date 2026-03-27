import { Clock, Eye, Settings, CheckCircle } from 'lucide-react';
import { STATUS_COLORS, type Status } from '../data/mock-data';

const STEPS: { status: Status; icon: React.ReactNode; label: string }[] = [
  { status: 'Pending', icon: <Clock className="w-5 h-5" />, label: 'Pending' },
  { status: 'Reviewed', icon: <Eye className="w-5 h-5" />, label: 'Reviewed' },
  { status: 'Processing', icon: <Settings className="w-5 h-5" />, label: 'Processing' },
  { status: 'Resolved', icon: <CheckCircle className="w-5 h-5" />, label: 'Resolved' },
];

const ORDER: Status[] = ['Pending', 'Reviewed', 'Processing', 'Resolved'];

export function StatusStepper({ currentStatus }: { currentStatus: Status }) {
  const currentIdx = ORDER.indexOf(currentStatus);

  return (
    <div className="flex items-center w-full">
      {STEPS.map((step, i) => {
        const isActive = i <= currentIdx;
        const c = STATUS_COLORS[step.status];
        return (
          <div key={step.status} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  isActive ? `${c.bg} ${c.text}` : 'bg-muted text-muted-foreground'
                }`}
              >
                {step.icon}
              </div>
              <span className={`text-xs whitespace-nowrap ${isActive ? c.text : 'text-muted-foreground'}`}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 mt-[-1.25rem] ${
                  i < currentIdx ? 'bg-primary' : 'bg-muted'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
