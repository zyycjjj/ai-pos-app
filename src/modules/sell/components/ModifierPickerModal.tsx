import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { X } from 'lucide-react-native';

import { AppButton } from '@/components/AppButton';
import { Surface } from '@/components/Surface';
import { useCurrency } from '@/hooks/useCurrency';
import { useI18n } from '@/i18n/useI18n';
import { tokens } from '@/theme';
import type { ProductModifierGroup, SelectedModifier } from '@/types/modifiers';

import type { ProductDto } from '../../products/products.service';
import { IconButton } from './SellPrimitives';
import { getModifierTotal, getSelectedModifiers, isModifierSelectionComplete } from '../sell.helpers';
import type { ModifierSelections } from '../sell.types';

type Props = {
  product: ProductDto | null;
  visible: boolean;
  includeNote?: boolean;
  onClose: () => void;
  onConfirm: (input: { product: ProductDto; modifiers: SelectedModifier[]; unitPrice: number; note?: string }) => void;
};

export function ModifierPickerModal({ product, visible, includeNote, onClose, onConfirm }: Props) {
  const { t } = useI18n();
  const money = useCurrency();
  const [selections, setSelections] = useState<ModifierSelections>({});
  const [note, setNote] = useState('');
  const [validationVisible, setValidationVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      setSelections({});
      setNote('');
      setValidationVisible(false);
    }
  }, [visible, product?.id]);

  if (!product) return null;

  const total = getModifierTotal(product, selections);
  const complete = isModifierSelectionComplete(product.modifierGroups, selections);

  const toggleOption = (group: ProductModifierGroup, optionId: string) => {
    setValidationVisible(false);
    setSelections((current) => {
      const selected = current[group.id] ?? [];
      if (group.multiSelect) {
        const exists = selected.includes(optionId);
        return { ...current, [group.id]: exists ? selected.filter((id) => id !== optionId) : [...selected, optionId] };
      }
      return { ...current, [group.id]: selected.includes(optionId) ? [] : [optionId] };
    });
  };

  const confirm = () => {
    if (!complete) {
      setValidationVisible(true);
      return;
    }
    onConfirm({
      product,
      modifiers: getSelectedModifiers(product.modifierGroups, selections),
      unitPrice: total,
      note: note.trim() || undefined,
    });
  };

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Surface shadow="modal" style={styles.modal}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{product.name}</Text>
              <Text style={styles.subtitle}>{money(Number(product.price))}</Text>
            </View>
            <IconButton label={t('sell.payment.close')} onPress={onClose}>
              <X color={tokens.colors.ink} size={18} />
            </IconButton>
          </View>

          <ScrollView contentContainerStyle={styles.groups} showsVerticalScrollIndicator={false}>
            {product.modifierGroups.map((group) => (
              <View key={group.id} style={styles.group}>
                <View style={styles.groupHeader}>
                  <Text style={styles.groupTitle}>{group.name}</Text>
                  <Text style={styles.requirement}>{group.required ? t('modifier.required') : t('modifier.optional')}</Text>
                </View>
                <View style={styles.options}>
                  {group.options.map((option) => {
                    const selected = (selections[group.id] ?? []).includes(option.id);
                    const disabled = option.status === 'SOLD_OUT' || option.status === 'INACTIVE';
                    return (
                      <Pressable
                        key={option.id}
                        disabled={disabled}
                        onPress={() => toggleOption(group, option.id)}
                        style={[styles.option, selected && styles.optionSelected, disabled && styles.optionDisabled]}
                      >
                        <Text style={[styles.optionText, selected && styles.optionTextSelected, disabled && styles.optionTextDisabled]}>
                          {option.name}
                          {option.priceDelta > 0 ? ` +${money(option.priceDelta)}` : ''}
                        </Text>
                        {disabled ? <Text style={styles.soldOutText}>{t('modifier.unavailable')}</Text> : null}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
            {includeNote ? (
              <View style={styles.group}>
                <Text style={styles.groupTitle}>{t('tables.itemNote')}</Text>
                <TextInput value={note} onChangeText={setNote} placeholder={t('tables.itemNotePlaceholder')} style={styles.noteInput} />
              </View>
            ) : null}
            {validationVisible ? <Text style={styles.validation}>{t('modifier.validation.required')}</Text> : null}
          </ScrollView>

          <View style={styles.footer}>
            <View>
              <Text style={styles.requirement}>{t('modifier.total')}</Text>
              <Text style={styles.total}>{money(total)}</Text>
            </View>
            <AppButton onPress={confirm}>{t('modifier.addToOrder')}</AppButton>
          </View>
        </Surface>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.32)',
    flex: 1,
    justifyContent: 'center',
    padding: tokens.spacing.xl,
  },
  modal: {
    gap: tokens.spacing.lg,
    maxHeight: '86%',
    maxWidth: 560,
    width: '100%',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    ...tokens.typography.sectionTitle,
    color: tokens.colors.ink,
  },
  subtitle: {
    ...tokens.typography.body,
    color: tokens.colors.muted,
  },
  groups: {
    gap: tokens.spacing.md,
  },
  group: {
    gap: tokens.spacing.sm,
  },
  groupHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  groupTitle: {
    ...tokens.typography.label,
    color: tokens.colors.ink,
  },
  requirement: {
    ...tokens.typography.caption,
    color: tokens.colors.muted,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.sm,
  },
  option: {
    borderColor: tokens.colors.lineStrong,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
  },
  optionSelected: {
    backgroundColor: tokens.colors.surfaceMuted,
    borderColor: tokens.colors.accent,
  },
  optionDisabled: {
    opacity: 0.45,
  },
  optionText: {
    ...tokens.typography.body,
    color: tokens.colors.ink,
  },
  optionTextSelected: {
    color: tokens.colors.accent,
  },
  optionTextDisabled: {
    color: tokens.colors.muted,
  },
  soldOutText: {
    ...tokens.typography.caption,
    color: tokens.colors.danger,
  },
  noteInput: {
    ...tokens.typography.body,
    borderColor: tokens.colors.lineStrong,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    color: tokens.colors.ink,
    minHeight: 44,
    paddingHorizontal: tokens.spacing.md,
  },
  validation: {
    ...tokens.typography.body,
    color: tokens.colors.danger,
  },
  footer: {
    alignItems: 'center',
    borderTopColor: tokens.colors.line,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: tokens.spacing.md,
  },
  total: {
    ...tokens.typography.numeric,
    color: tokens.colors.ink,
  },
});
