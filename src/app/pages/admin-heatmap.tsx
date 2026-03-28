import { motion } from 'motion/react';
import { Crosshair } from 'lucide-react';
import { CampusMapPage } from './campus-map';
import { adminTactical } from '../admin-tactical-ui';

export function AdminHeatmapPage() {
  return (
    <div className="premium-page space-y-5">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative overflow-hidden rounded-2xl ${adminTactical.border} shadow-sm`}
      >
        <div className={`pointer-events-none absolute inset-0 ${adminTactical.wash}`} />
        <div className={`pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-[0.45] ${adminTactical.gridBg}`} />
        <div className={`relative ${adminTactical.panelInner} p-4 sm:p-5`}>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md ${adminTactical.borderSoft} bg-background/60 ${adminTactical.label}`}
            >
              <Crosshair className="w-3 h-3 text-[#5c6b4a] dark:text-[#8faa7a]" />
              Admin ops
            </span>
            <h1 className="text-2xl sm:text-3xl leading-none truncate" style={{ fontWeight: 800 }}>
              Campus heatmap
            </h1>
            <span
              className={`text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded-md border ${adminTactical.borderSoft} text-muted-foreground`}
            >
              Sample data
            </span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
            Same campus map as the student view, with full grid access for admins: tactical heat by zone from sample
            facility issues, building list, and tooltips.
          </p>
        </div>
      </motion.div>

      <div className={`relative overflow-hidden rounded-2xl ${adminTactical.border} shadow-sm min-h-[420px]`}>
        <div className={`pointer-events-none absolute inset-0 ${adminTactical.wash}`} />
        <div className={`pointer-events-none absolute inset-0 opacity-15 dark:opacity-30 ${adminTactical.gridBg}`} />
        <div className={`relative ${adminTactical.panelInner} p-2 sm:p-4`}>
          <CampusMapPage showHeader={false} />
        </div>
      </div>
    </div>
  );
}
