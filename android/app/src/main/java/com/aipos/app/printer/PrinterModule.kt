package com.aipos.app.printer

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap

class PrinterModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
  private val manager = PrinterConnectionManager(reactContext)

  override fun getName(): String = "PrinterModule"

  @ReactMethod
  fun connectBuiltin(promise: Promise) {
    runAsync(promise) {
      PrinterConnectionManager.connectionResultMap(manager.connectBuiltin())
    }
  }

  @ReactMethod
  fun connectUsb(pathName: String, promise: Promise) {
    runAsync(promise) {
      PrinterConnectionManager.connectionResultMap(manager.connectUsb(pathName))
    }
  }

  @ReactMethod
  fun connectBluetooth(macAddress: String, promise: Promise) {
    runAsync(promise) {
      PrinterConnectionManager.connectionResultMap(manager.connectBluetooth(macAddress))
    }
  }

  @ReactMethod
  fun connectEthernet(ipAddress: String, promise: Promise) {
    runAsync(promise) {
      PrinterConnectionManager.connectionResultMap(manager.connectEthernet(ipAddress))
    }
  }

  @ReactMethod
  fun connectSerial(port: String, baudRate: String, promise: Promise) {
    runAsync(promise) {
      PrinterConnectionManager.connectionResultMap(manager.connectSerial(port, baudRate))
    }
  }

  @ReactMethod
  fun disconnect(promise: Promise) {
    runAsync(promise) {
      PrinterConnectionManager.connectionResultMap(manager.disconnect())
    }
  }

  @ReactMethod
  fun getConnectionInfo(promise: Promise) {
    promise.resolve(manager.connectionInfoMap())
  }

  @ReactMethod
  fun getAvailableUsbDevices(promise: Promise) {
    val result = Arguments.createArray()
    manager.availableUsbDevices().forEach { result.pushString(it) }
    promise.resolve(result)
  }

  @ReactMethod
  fun getSerialPorts(promise: Promise) {
    val result = Arguments.createArray()
    manager.serialPorts().forEach { result.pushString(it) }
    promise.resolve(result)
  }

  @ReactMethod
  fun getStatus(promise: Promise) {
    val printer = manager.getPrinter()
    if (printer == null) {
      promise.reject("PRINTER_NOT_CONNECTED", "Printer is not connected.")
      return
    }

    try {
      printer.printerStatusII { status ->
        promise.resolve(PrinterConnectionManager.statusMap(status))
      }
    } catch (error: Exception) {
      promise.reject("PRINTER_STATUS_FAILED", error.message, error)
    }
  }

  @ReactMethod
  fun printText(text: String, promise: Promise) {
    runPrint(promise) { printer ->
      ReceiptPrintMapper.printPlainText(printer, text)
    }
  }

  @ReactMethod
  fun printTestReceipt(promise: Promise) {
    runPrint(promise) { printer ->
      ReceiptPrintMapper.printTestReceipt(printer)
    }
  }

  @ReactMethod
  fun printReceipt(receipt: ReadableMap, promise: Promise) {
    runPrint(promise) { printer ->
      ReceiptPrintMapper.printReceipt(printer, receipt)
    }
  }

  private fun runPrint(promise: Promise, block: (net.posprinter.POSPrinter) -> Unit) {
    runAsync(promise) {
      // The native boundary owns vendor SDK connection recovery; JS only submits validated receipt payloads and receives a normalized result.
      if (!manager.isConnected()) {
        val result = manager.connectBuiltin()
        if (!result.connected) {
          throw IllegalStateException(result.message)
        }
      }
      val printer = manager.getPrinter() ?: throw IllegalStateException("Printer is not connected.")
      block(printer)
      Arguments.createMap().apply {
        putBoolean("sent", true)
        putMap("connection", manager.connectionInfoMap())
      }
    }
  }

  private fun runAsync(promise: Promise, block: () -> Any) {
    Thread {
      try {
        promise.resolve(block())
      } catch (error: Exception) {
        promise.reject("PRINTER_ERROR", error.message ?: "Printer operation failed.", error)
      }
    }.start()
  }
}
