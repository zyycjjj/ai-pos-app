import { Pressable, Text, View } from 'react-native';
import type { ReactNode } from 'react';
import { Bluetooth, Monitor, Printer, Usb } from 'lucide-react-native';

import { Screen } from '@/components/Screen';
import { colors } from '@/theme/colors';

export function SettingsScreen() {
  return (
    <Screen>
      <View className="mb-6">
        <Text className="text-3xl font-semibold text-pos-ink">Device settings</Text>
        <Text className="mt-2 text-base text-pos-muted">Terminal, receipt printer, tax, and customer display setup.</Text>
      </View>

      <View className="grid-cols-2 flex-row gap-5">
        <View className="flex-1 gap-5">
          <SettingPanel
            icon={<Printer color={colors.accent} size={22} />}
            label="Built-in printer"
            status="Primary"
            title="Thermal receipt printer"
          >
            <SettingRow label="Paper width" value="80mm ESC/POS" />
            <SettingRow label="Auto print" value="After Mark paid" />
            <SettingRow label="Health" value="Ready for native module" />
            <Pressable className="mt-4 h-11 items-center justify-center rounded-pos bg-pos-accent active:opacity-80">
              <Text className="text-sm font-semibold text-white">Print test page</Text>
            </Pressable>
          </SettingPanel>

          <SettingPanel icon={<Monitor color={colors.accent} size={22} />} label="Second display" status="Ready" title="Customer screen">
            <SettingRow label="Idle view" value="Store welcome" />
            <SettingRow label="Checkout view" value="Cart + total" />
            <SettingRow label="Paid view" value="Order number + thank you" />
          </SettingPanel>
        </View>

        <View className="flex-1 gap-5">
          <SettingPanel icon={<Bluetooth color={colors.muted} size={22} />} label="External printer" status="Optional" title="Bluetooth printer">
            <SettingRow label="Use case" value="Backup receipt printer" />
            <SettingRow label="Connection" value="Not paired" />
            <SettingRow label="SDK path" value="POSConnect Bluetooth" />
          </SettingPanel>

          <SettingPanel icon={<Usb color={colors.muted} size={22} />} label="External printer" status="Optional" title="USB / Ethernet printer">
            <SettingRow label="USB" value="Pending device test" />
            <SettingRow label="Ethernet" value="IP + port later" />
            <SettingRow label="Serial" value="Supported by SDK" />
          </SettingPanel>
        </View>
      </View>
    </Screen>
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
    <View className="rounded-pos border border-pos-line bg-pos-surface p-5">
      <View className="flex-row items-start justify-between">
        <View className="flex-row items-center gap-3">
          <View className="h-11 w-11 items-center justify-center rounded-pos bg-pos-background">{icon}</View>
          <View>
            <Text className="text-sm text-pos-muted">{label}</Text>
            <Text className="mt-1 text-xl font-semibold text-pos-ink">{title}</Text>
          </View>
        </View>
        <View className="rounded-pos bg-pos-background px-3 py-1">
          <Text className="text-xs font-semibold text-pos-accent">{status}</Text>
        </View>
      </View>
      <View className="mt-5 gap-3">{children}</View>
    </View>
  );
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-sm text-pos-muted">{label}</Text>
      <Text className="text-sm font-semibold text-pos-ink">{value}</Text>
    </View>
  );
}
