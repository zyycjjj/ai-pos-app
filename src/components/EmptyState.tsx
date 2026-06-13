import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { tokens } from '@/theme';

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <View
      style={{
        minHeight: 180,
        alignItems: 'center',
        justifyContent: 'center',
        padding: tokens.spacing['2xl'],
      }}
    >
      <Text style={[tokens.typography.sectionTitle, { color: tokens.colors.ink, textAlign: 'center' }]}>{title}</Text>
      {description ? (
        <Text style={[tokens.typography.body, { color: tokens.colors.muted, marginTop: tokens.spacing.sm, maxWidth: 420, textAlign: 'center' }]}>
          {description}
        </Text>
      ) : null}
      {action ? <View style={{ marginTop: tokens.spacing.xl }}>{action}</View> : null}
    </View>
  );
}

