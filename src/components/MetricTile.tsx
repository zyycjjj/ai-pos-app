import { Text, View } from 'react-native';

type MetricTileProps = {
  label: string;
  value: string;
  tone?: 'default' | 'accent' | 'warm';
};

const toneClass = {
  default: 'border-pos-line bg-pos-surface',
  accent: 'border-pos-accent bg-white',
  warm: 'border-pos-warm bg-white',
};

export function MetricTile({ label, value, tone = 'default' }: MetricTileProps) {
  return (
    <View className={`min-w-44 rounded-pos border px-5 py-4 ${toneClass[tone]}`}>
      <Text className="text-sm font-medium text-pos-muted">{label}</Text>
      <Text className="mt-2 text-2xl font-semibold text-pos-ink">{value}</Text>
    </View>
  );
}
