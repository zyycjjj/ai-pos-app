import { MetricCard } from './MetricCard';

type MetricTileProps = {
  label: string;
  value: string;
  tone?: 'default' | 'accent' | 'warm';
};

export function MetricTile({ label, value, tone = 'default' }: MetricTileProps) {
  return <MetricCard label={label} value={value} tone={tone === 'warm' ? 'warning' : tone} />;
}
