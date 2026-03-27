import { CampusMapPage } from './campus-map';

export function AdminHeatmapPage() {
  return (
    <div className="premium-page">
      <div>
        <h1 className="text-3xl" style={{ fontWeight: 700 }}>Campus Heatmap</h1>
        <p className="text-sm text-muted-foreground mt-1">Facility pressure overview for operations and escalation decisions</p>
      </div>
      <CampusMapPage showHeader={false} />
    </div>
  );
}
