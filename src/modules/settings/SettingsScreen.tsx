import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useState, type ReactNode } from 'react';
import { Bluetooth, Monitor, Printer, Usb } from 'lucide-react-native';

import { Screen } from '@/components/Screen';
import { useI18n } from '@/i18n/useI18n';
import type { SupportedLocale } from '@/i18n';
import { printerModule } from '@/native/printer/PrinterModule';
import { useCreateLanPrinter, usePosPrinters, useTestPosPrinter } from '@/services/businessApi';
import { useAuthStore } from '@/stores/authStore';
import type { StoreRole } from '@/stores/authStore';
import { tokens } from '@/theme';

export function SettingsScreen() {
  const { locale, setLocale, t } = useI18n();
  const { activeStoreId, clearSession, role, stores, user } = useAuthStore();
  const activeStore = stores.find((store) => store.storeId === activeStoreId);
  const roleLabel = role ? t(getRoleLabelKey(role)) : '';
  const [printerState, setPrinterState] = useState<'idle' | 'printing' | 'sent' | 'failed'>('idle');
  const [printerMessage, setPrinterMessage] = useState(t('settings.printer.testReady'));
  const [lanHost, setLanHost] = useState('');
  const [lanPort, setLanPort] = useState('9100');
  const [lanMessage, setLanMessage] = useState('Ready to add a LAN printer.');
  const printersQuery = usePosPrinters();
  const createLanPrinter = useCreateLanPrinter();
  const testPosPrinter = useTestPosPrinter();
  const lanPrinters = (printersQuery.data ?? []).filter((printer) => printer.connectionType === 'LAN');
  const selectedLanPrinter = lanPrinters[0];

  const printTestPage = async () => {
    setPrinterState('printing');
    setPrinterMessage(t('settings.printer.testPrinting'));
    try {
      const result = await printerModule.printTestReceipt();
      setPrinterState('sent');
      setPrinterMessage(t('settings.printer.testSuccess').replace('{connection}', result.connection.type || 'printer'));
    } catch (error) {
      setPrinterState('failed');
      setPrinterMessage(error instanceof Error ? error.message : t('settings.printer.testFailed'));
    }
  };

  const saveLanPrinter = async () => {
    const host = lanHost.trim();
    const port = Number(lanPort);
    if (!host || !Number.isInteger(port) || port < 1 || port > 65535) {
      setLanMessage('Enter a valid printer IP and port.');
      return;
    }
    try {
      const printer = await createLanPrinter.mutateAsync({
        name: `LAN Printer ${host}`,
        code: `LAN-${host.replace(/[^0-9A-Za-z]/g, '-')}`.slice(0, 24),
        host,
        port,
      });
      setLanMessage(`Saved ${printer.name}.`);
    } catch (error) {
      setLanMessage(error instanceof Error ? error.message : 'LAN printer save failed.');
    }
  };

  const testLanPrinter = async () => {
    if (!selectedLanPrinter) {
      setLanMessage('Save a LAN printer before test print.');
      return;
    }
    try {
      const job = await testPosPrinter.mutateAsync(selectedLanPrinter.id);
      setLanMessage(job.status === 'FAILED' && job.lastError ? job.lastError : `Test print job ${job.status}.`);
    } catch (error) {
      setLanMessage(error instanceof Error ? error.message : 'LAN test print failed.');
    }
  };

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>柜台终端</Text>
          <Text style={styles.screenTitle}>Device settings</Text>
          <Text style={styles.screenDescription}>Terminal, receipt printer, tax, and customer display setup.</Text>
        </View>

        <View style={styles.languagePanel}>
          <View style={styles.languagePanelContent}>
            <View style={styles.languageText}>
              <Text style={styles.languageTitle}>{t('settings.language.title')}</Text>
              <Text style={styles.languageDescription}>{t('settings.language.description')}</Text>
            </View>
            <View style={styles.languageActions}>
              <LanguageButton label={t('settings.language.english')} locale="en" selected={locale === 'en'} onPress={setLocale} />
              <LanguageButton
                label={t('settings.language.chineseSimplified')}
                locale="zh-CN"
                selected={locale === 'zh-CN'}
                onPress={setLocale}
              />
            </View>
          </View>
        </View>

        <View style={styles.languagePanel}>
          <View style={styles.languagePanelContent}>
            <View style={styles.languageText}>
              <Text style={styles.languageTitle}>{user?.name ?? user?.email}</Text>
              <Text style={styles.languageDescription}>
                {activeStore?.storeName ?? t('auth.store.current')} · {roleLabel}
              </Text>
            </View>
            <Pressable style={styles.logoutButton} onPress={clearSession}>
              <Text style={styles.logoutButtonText}>{t('auth.logout')}</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.panelGrid}>
          <View style={styles.panelColumn}>
            <SettingPanel
              icon={<Printer color={tokens.colors.accent} size={22} />}
              label="Built-in printer"
              status="Primary"
              title="Thermal receipt printer"
            >
              <SettingRow label="Paper width" value="80mm ESC/POS" />
              <SettingRow label="Auto print" value="After Mark paid" />
              <SettingRow label="Health" value={printerState === 'failed' ? t('settings.printer.needsAttention') : t('settings.printer.ready')} />
              <Text style={[styles.printerMessage, printerState === 'failed' ? styles.printerMessageError : null]}>{printerMessage}</Text>
              <Pressable
                disabled={printerState === 'printing'}
                onPress={printTestPage}
                style={({ pressed }) => [styles.testButton, pressed ? styles.pressed : null, printerState === 'printing' ? styles.testButtonDisabled : null]}
              >
                <Text style={styles.testButtonText}>{printerState === 'printing' ? t('settings.printer.printing') : t('settings.printer.printTestPage')}</Text>
              </Pressable>
            </SettingPanel>

            <SettingPanel icon={<Monitor color={tokens.colors.accent} size={22} />} label="Second display" status="Ready" title="Customer screen">
              <SettingRow label="Idle view" value="Store welcome" />
              <SettingRow label="Checkout view" value="Cart + total" />
              <SettingRow label="Paid view" value="Order number + thank you" />
            </SettingPanel>
          </View>

          <View style={styles.panelColumn}>
            <SettingPanel icon={<Bluetooth color={tokens.colors.muted} size={22} />} label="External printer" status="Optional" title="Bluetooth printer">
              <SettingRow label="Use case" value="Backup receipt printer" />
              <SettingRow label="Connection" value="Not paired" />
              <SettingRow label="SDK path" value="POSConnect Bluetooth" />
            </SettingPanel>

            <SettingPanel icon={<Usb color={tokens.colors.muted} size={22} />} label="LAN printer" status={selectedLanPrinter ? 'Configured' : 'Setup'} title="IP / port test print">
              <SettingRow label="Current" value={selectedLanPrinter?.address ?? 'Not configured'} />
              <TextInput
                autoCapitalize="none"
                keyboardType="numbers-and-punctuation"
                placeholder="Printer IP"
                placeholderTextColor={tokens.colors.subtle}
                style={styles.input}
                value={lanHost}
                onChangeText={setLanHost}
              />
              <TextInput
                keyboardType="number-pad"
                placeholder="Port"
                placeholderTextColor={tokens.colors.subtle}
                style={styles.input}
                value={lanPort}
                onChangeText={setLanPort}
              />
              <Text style={[styles.printerMessage, lanMessage.includes('failed') || lanMessage.includes('valid') ? styles.printerMessageError : null]}>{lanMessage}</Text>
              <View style={styles.buttonRow}>
                <Pressable
                  disabled={createLanPrinter.isPending}
                  onPress={saveLanPrinter}
                  style={({ pressed }) => [styles.testButton, styles.flexButton, pressed ? styles.pressed : null, createLanPrinter.isPending ? styles.testButtonDisabled : null]}
                >
                  <Text style={styles.testButtonText}>{createLanPrinter.isPending ? 'Saving...' : 'Save LAN printer'}</Text>
                </Pressable>
                <Pressable
                  disabled={testPosPrinter.isPending}
                  onPress={testLanPrinter}
                  style={({ pressed }) => [styles.testButtonSecondary, styles.flexButton, pressed ? styles.pressed : null, testPosPrinter.isPending ? styles.testButtonDisabled : null]}
                >
                  <Text style={styles.testButtonSecondaryText}>{testPosPrinter.isPending ? 'Testing...' : 'Test print'}</Text>
                </Pressable>
              </View>
            </SettingPanel>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

function getRoleLabelKey(role: StoreRole) {
  const keyByRole = {
    OWNER: 'auth.role.owner',
    MANAGER: 'auth.role.manager',
    CASHIER: 'auth.role.cashier',
    KITCHEN: 'auth.role.kitchen',
    WAITER: 'auth.role.waiter',
    STAFF: 'auth.role.staff',
  } as const;
  return keyByRole[role];
}

function LanguageButton({
  label,
  locale,
  selected,
  onPress,
}: {
  label: string;
  locale: SupportedLocale;
  selected: boolean;
  onPress: (locale: SupportedLocale) => void;
}) {
  return (
    <Pressable
      style={[styles.languageButton, selected ? styles.languageButtonSelected : null]}
      onPress={() => onPress(locale)}
    >
      <Text style={[styles.languageButtonText, selected ? styles.languageButtonTextSelected : null]}>{label}</Text>
    </Pressable>
  );
}

function SettingPanel({
  children,
  icon,
  label,
  status,
  title,
}: {
  children: ReactNode;
  icon: ReactNode;
  label: string;
  status: string;
  title: string;
}) {
  return (
    <View style={styles.settingPanel}>
      <View style={styles.settingHeader}>
        <View style={styles.settingIdentity}>
          <View style={styles.iconBox}>{icon}</View>
          <View style={styles.settingTitleBlock}>
            <Text style={styles.panelLabel}>{label}</Text>
            <Text style={styles.panelTitle}>{title}</Text>
          </View>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{status}</Text>
        </View>
      </View>
      <View style={styles.panelBody}>{children}</View>
    </View>
  );
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.settingRow}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: tokens.navigation.contentPadding,
    paddingVertical: tokens.spacing.xl,
  },
  header: {
    marginBottom: tokens.spacing.xl,
  },
  eyebrow: {
    color: tokens.colors.accent,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  screenTitle: {
    color: tokens.colors.ink,
    fontSize: 34,
    fontWeight: '800',
    lineHeight: 40,
    marginTop: 4,
  },
  screenDescription: {
    color: tokens.colors.muted,
    fontSize: 16,
    lineHeight: 22,
    marginTop: 8,
  },
  languagePanel: {
    marginBottom: 20,
    borderWidth: 1,
    borderColor: tokens.colors.line,
    borderRadius: 12,
    backgroundColor: tokens.colors.surface,
    padding: 20,
    ...tokens.shadow.soft,
  },
  languagePanelContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 20,
  },
  languageText: {
    flex: 1,
  },
  languageTitle: {
    color: tokens.colors.ink,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
  },
  languageDescription: {
    color: tokens.colors.muted,
    fontSize: 14,
    lineHeight: 18,
    marginTop: 4,
  },
  languageActions: {
    flexDirection: 'row',
    gap: 12,
  },
  languageButton: {
    minWidth: 112,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: tokens.colors.line,
    borderRadius: 8,
    backgroundColor: tokens.colors.surface,
    paddingHorizontal: 16,
  },
  languageButtonSelected: {
    borderColor: tokens.colors.accent,
    backgroundColor: tokens.colors.background,
  },
  languageButtonText: {
    color: tokens.colors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  languageButtonTextSelected: {
    color: tokens.colors.accent,
  },
  logoutButton: {
    minWidth: 112,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: tokens.colors.lineStrong,
    borderRadius: 8,
    backgroundColor: tokens.colors.surface,
    paddingHorizontal: 16,
  },
  logoutButtonText: {
    color: tokens.colors.ink,
    fontSize: 14,
    fontWeight: '800',
  },
  panelGrid: {
    flexDirection: 'row',
    gap: tokens.spacing.xl,
  },
  panelColumn: {
    flex: 1,
    gap: tokens.spacing.xl,
  },
  settingPanel: {
    minHeight: 188,
    borderWidth: 1,
    borderColor: tokens.colors.line,
    borderRadius: tokens.radius.lg,
    backgroundColor: tokens.colors.surface,
    padding: tokens.spacing.xl,
    ...tokens.shadow.soft,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: tokens.spacing.lg,
  },
  settingIdentity: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.md,
  },
  iconBox: {
    width: 44,
    height: 44,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.background,
  },
  settingTitleBlock: {
    flex: 1,
  },
  panelLabel: {
    color: tokens.colors.muted,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
  },
  panelTitle: {
    color: tokens.colors.ink,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '800',
    marginTop: 4,
  },
  statusBadge: {
    minHeight: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.background,
    paddingHorizontal: tokens.spacing.md,
  },
  statusText: {
    color: tokens.colors.accent,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
  },
  panelBody: {
    gap: tokens.spacing.md,
    marginTop: tokens.spacing.xl,
  },
  settingRow: {
    minHeight: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacing.lg,
  },
  rowLabel: {
    color: tokens.colors.muted,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
  },
  rowValue: {
    flexShrink: 1,
    color: tokens.colors.ink,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
    textAlign: 'right',
  },
  testButton: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.accent,
    marginTop: tokens.spacing.sm,
  },
  testButtonSecondary: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.colors.lineStrong,
    backgroundColor: tokens.colors.surface,
    marginTop: tokens.spacing.sm,
  },
  testButtonDisabled: {
    opacity: 0.72,
  },
  testButtonText: {
    color: tokens.colors.inverse,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
  },
  testButtonSecondaryText: {
    color: tokens.colors.ink,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
  },
  flexButton: {
    flex: 1,
  },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: tokens.colors.lineStrong,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.surfaceElevated,
    color: tokens.colors.ink,
    paddingHorizontal: tokens.spacing.md,
    fontSize: 14,
    fontWeight: '700',
  },
  printerMessage: {
    color: tokens.colors.muted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  printerMessageError: {
    color: tokens.colors.danger,
  },
  pressed: {
    opacity: 0.82,
  },
});
