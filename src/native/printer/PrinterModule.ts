import { NativeModules, Platform } from 'react-native';

import type { ReceiptPayload } from '@/services/businessApi';

export type PrinterConnectionType = 'builtin' | 'usb' | 'bluetooth' | 'ethernet' | 'serial' | 'none';

export type PrinterConnectionResult = {
  connected: boolean;
  type: PrinterConnectionType;
  address: string;
  message: string;
};

export type PrinterConnectionInfo = {
  connected: boolean;
  type: PrinterConnectionType;
  address: string;
};

export type PrinterStatus = {
  raw: number;
  ready: boolean;
  message: string;
  connectError: boolean;
  readTimeout: boolean;
  printing: boolean;
  coverOpen: boolean;
  outOfPaper: boolean;
  paperNearEnd: boolean;
  cashDrawerOpen: boolean;
  otherError: boolean;
  cutterError: boolean;
  overheated: boolean;
};

export type PrintResult = {
  sent: boolean;
  connection: PrinterConnectionInfo;
};

type NativePrinterModule = {
  connectBuiltin(): Promise<PrinterConnectionResult>;
  connectUsb(pathName: string): Promise<PrinterConnectionResult>;
  connectBluetooth(macAddress: string): Promise<PrinterConnectionResult>;
  connectEthernet(ipAddress: string): Promise<PrinterConnectionResult>;
  connectSerial(port: string, baudRate: string): Promise<PrinterConnectionResult>;
  disconnect(): Promise<PrinterConnectionResult>;
  getConnectionInfo(): Promise<PrinterConnectionInfo>;
  getAvailableUsbDevices(): Promise<string[]>;
  getSerialPorts(): Promise<string[]>;
  getStatus(): Promise<PrinterStatus>;
  printText(text: string): Promise<PrintResult>;
  printTestReceipt(): Promise<PrintResult>;
  printReceipt(receipt: ReceiptPayload): Promise<PrintResult>;
};

const nativePrinter = NativeModules.PrinterModule as NativePrinterModule | undefined;

function requirePrinterModule(): NativePrinterModule {
  if (Platform.OS !== 'android' || !nativePrinter) {
    throw new Error('Printer module is only available in the Android development build.');
  }
  return nativePrinter;
}

export const printerModule = {
  connectBuiltin() {
    return requirePrinterModule().connectBuiltin();
  },
  connectUsb(pathName: string) {
    return requirePrinterModule().connectUsb(pathName);
  },
  connectBluetooth(macAddress: string) {
    return requirePrinterModule().connectBluetooth(macAddress);
  },
  connectEthernet(ipAddress: string) {
    return requirePrinterModule().connectEthernet(ipAddress);
  },
  connectSerial(port: string, baudRate: string) {
    return requirePrinterModule().connectSerial(port, baudRate);
  },
  disconnect() {
    return requirePrinterModule().disconnect();
  },
  getConnectionInfo() {
    return requirePrinterModule().getConnectionInfo();
  },
  getAvailableUsbDevices() {
    return requirePrinterModule().getAvailableUsbDevices();
  },
  getSerialPorts() {
    return requirePrinterModule().getSerialPorts();
  },
  getStatus() {
    return requirePrinterModule().getStatus();
  },
  printText(text: string) {
    return requirePrinterModule().printText(text);
  },
  printTestReceipt() {
    return requirePrinterModule().printTestReceipt();
  },
  printReceipt(receipt: ReceiptPayload) {
    return requirePrinterModule().printReceipt(receipt);
  },
};
