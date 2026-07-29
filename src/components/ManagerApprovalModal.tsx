import { useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { Surface } from '@/components/Surface';
import { tokens } from '@/theme';

export type ManagerApprovalPayload = {
  managerUserId: string;
  pin: string;
  reason: string;
};

type Props = {
  visible: boolean;
  title: string;
  message: string;
  loading?: boolean;
  onCancel: () => void;
  onSubmit: (approval: ManagerApprovalPayload) => void;
};

export function ManagerApprovalModal({ loading, message, onCancel, onSubmit, title, visible }: Props) {
  const [managerUserId, setManagerUserId] = useState('');
  const [pin, setPin] = useState('');
  const [reason, setReason] = useState('');
  const ready = managerUserId.trim().length > 0 && pin.trim().length >= 4 && reason.trim().length > 0;

  const submit = () => {
    if (!ready) return;
    onSubmit({ managerUserId: managerUserId.trim(), pin: pin.trim(), reason: reason.trim() });
    setPin('');
  };

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <Surface shadow="modal" style={styles.modal}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <TextInput style={styles.input} placeholder="Manager user ID" placeholderTextColor={tokens.colors.subtle} value={managerUserId} onChangeText={setManagerUserId} autoCapitalize="none" />
          <TextInput style={styles.input} placeholder="PIN" placeholderTextColor={tokens.colors.subtle} value={pin} onChangeText={setPin} keyboardType="number-pad" secureTextEntry />
          <TextInput style={[styles.input, styles.reason]} placeholder="Approval reason" placeholderTextColor={tokens.colors.subtle} value={reason} onChangeText={setReason} multiline />
          <View style={styles.actions}>
            <AppButton variant="secondary" onPress={onCancel}>
              Cancel
            </AppButton>
            <AppButton disabled={!ready || loading} loading={loading} onPress={submit}>
              Approve
            </AppButton>
          </View>
        </Surface>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.42)',
    padding: tokens.spacing.xl,
  },
  modal: {
    width: '100%',
    maxWidth: 420,
    gap: tokens.spacing.md,
  },
  title: {
    ...tokens.typography.sectionTitle,
    color: tokens.colors.ink,
  },
  message: {
    ...tokens.typography.body,
    color: tokens.colors.muted,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: tokens.colors.line,
    borderRadius: tokens.radius.md,
    paddingHorizontal: tokens.spacing.md,
    color: tokens.colors.ink,
    backgroundColor: tokens.colors.surface,
  },
  reason: {
    minHeight: 84,
    paddingTop: tokens.spacing.sm,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: tokens.spacing.sm,
  },
});
