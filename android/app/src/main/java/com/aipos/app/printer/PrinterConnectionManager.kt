package com.aipos.app.printer

import android.content.Context
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import net.posprinter.IDeviceConnection
import net.posprinter.POSConnect
import net.posprinter.POSConst
import net.posprinter.POSPrinter

data class PrinterConnectionResult(
  val connected: Boolean,
  val type: String,
  val address: String,
  val message: String,
)

class PrinterConnectionManager(private val context: Context) {
  @Volatile
  private var connection: IDeviceConnection? = null
  private var connectionType: String = "none"
  private var connectionAddress: String = ""

  init {
    POSConnect.init(context.applicationContext)
  }

  fun getPrinter(): POSPrinter? {
    val current = connection
    return if (current?.isConnect == true) POSPrinter(current) else null
  }

  fun isConnected(): Boolean = connection?.isConnect == true

  fun connectBuiltin(): PrinterConnectionResult {
    if (isConnected()) {
      return PrinterConnectionResult(true, connectionType, connectionAddress, "Already connected.")
    }

    val usbResult = connectFirstUsb()
    if (usbResult.connected) {
      return usbResult
    }

    return connectFirstSerial()
  }

  fun connectUsb(pathName: String): PrinterConnectionResult {
    return connect(POSConnect.DEVICE_TYPE_USB, pathName, "usb")
  }

  fun connectBluetooth(macAddress: String): PrinterConnectionResult {
    return connect(POSConnect.DEVICE_TYPE_BLUETOOTH, macAddress, "bluetooth")
  }

  fun connectEthernet(ipAddress: String): PrinterConnectionResult {
    return connect(POSConnect.DEVICE_TYPE_ETHERNET, ipAddress, "ethernet")
  }

  fun connectSerial(port: String, baudRate: String): PrinterConnectionResult {
    return connect(POSConnect.DEVICE_TYPE_SERIAL, "$port,$baudRate", "serial")
  }

  fun disconnect(): PrinterConnectionResult {
    connection?.close()
    connection = null
    connectionType = "none"
    connectionAddress = ""
    return PrinterConnectionResult(false, "none", "", "Disconnected.")
  }

  fun connectionInfoMap(): WritableMap {
    return Arguments.createMap().apply {
      putBoolean("connected", isConnected())
      putString("type", connectionType)
      putString("address", connectionAddress)
    }
  }

  fun availableUsbDevices(): List<String> {
    return try {
      POSConnect.getUsbDevices(context)
    } catch (_: Exception) {
      emptyList()
    }
  }

  fun serialPorts(): List<String> {
    return serialCandidates()
  }

  private fun connectFirstUsb(): PrinterConnectionResult {
    for (path in availableUsbDevices()) {
      val result = connectUsb(path)
      if (result.connected) {
        return result
      }
    }
    return PrinterConnectionResult(false, "usb", "", "No available USB printer connected.")
  }

  private fun connectFirstSerial(): PrinterConnectionResult {
    val baudRates = listOf("115200", "9600", "38400", "57600", "19200")
    for (port in serialCandidates()) {
      for (baudRate in baudRates) {
        val result = connectSerial(port, baudRate)
        if (result.connected) {
          return result
        }
      }
    }
    return PrinterConnectionResult(false, "builtin", "", "No built-in printer found over USB or serial.")
  }

  private fun serialCandidates(): List<String> {
    val detected = try {
      POSConnect.getSerialPort()
    } catch (_: Exception) {
      emptyList()
    }
    val fallback = listOf(
      "/dev/ttyS0",
      "/dev/ttyS1",
      "/dev/ttyS2",
      "/dev/ttyS3",
      "/dev/ttyMT0",
      "/dev/ttyMT1",
      "/dev/ttyUSB0",
    )
    return (detected + fallback).distinct()
  }

  private fun connect(deviceType: Int, connectInfo: String, type: String): PrinterConnectionResult {
    if (connectInfo.isBlank()) {
      return PrinterConnectionResult(false, type, connectInfo, "Connection address is empty.")
    }

    connection?.close()
    val nextConnection = POSConnect.createDevice(deviceType)
    var callbackMessage = ""
    val connected = try {
      nextConnection.connectSync(connectInfo) { code, _, msg ->
        callbackMessage = msg ?: statusMessage(code)
      }
    } catch (error: Exception) {
      callbackMessage = error.message ?: "Connection failed."
      false
    }

    return if (connected && nextConnection.isConnect) {
      connection = nextConnection
      connectionType = type
      connectionAddress = connectInfo
      PrinterConnectionResult(true, type, connectInfo, "Connected.")
    } else {
      nextConnection.close()
      PrinterConnectionResult(false, type, connectInfo, callbackMessage.ifBlank { "Connection failed." })
    }
  }

  companion object {
    fun connectionResultMap(result: PrinterConnectionResult): WritableMap {
      return Arguments.createMap().apply {
        putBoolean("connected", result.connected)
        putString("type", result.type)
        putString("address", result.address)
        putString("message", result.message)
      }
    }

    fun statusMap(status: Int): WritableMap {
      return Arguments.createMap().apply {
        putInt("raw", status)
        putBoolean("ready", status == 0)
        putString("message", statusMessage(status))
        putBoolean("connectError", status == POSConst.CONNECT_ERROR)
        putBoolean("readTimeout", status == POSConst.READ_TIMEOUT)
        putBoolean("printing", status > 0 && status and 0b00000001 > 0)
        putBoolean("coverOpen", status > 0 && status and 0b00000010 > 0)
        putBoolean("outOfPaper", status > 0 && status and 0b00000100 > 0)
        putBoolean("paperNearEnd", status > 0 && status and 0b00001000 > 0)
        putBoolean("cashDrawerOpen", status > 0 && status and 0b00010000 > 0)
        putBoolean("otherError", status > 0 && status and 0b00100000 > 0)
        putBoolean("cutterError", status > 0 && status and 0b01000000 > 0)
        putBoolean("overheated", status > 0 && status and 0b10000000 > 0)
      }
    }

    private fun statusMessage(status: Int): String {
      if (status == 0) {
        return "Ready"
      }
      if (status == POSConst.CONNECT_ERROR) {
        return "Connection error"
      }
      if (status == POSConst.READ_TIMEOUT) {
        return "Read timeout"
      }

      val messages = mutableListOf<String>()
      if (status and 0b00000001 > 0) messages.add("Printing")
      if (status and 0b00000010 > 0) messages.add("Cover open")
      if (status and 0b00000100 > 0) messages.add("Out of paper")
      if (status and 0b00001000 > 0) messages.add("Paper near end")
      if (status and 0b00010000 > 0) messages.add("Cash drawer open")
      if (status and 0b00100000 > 0) messages.add("Other error")
      if (status and 0b01000000 > 0) messages.add("Cutter error")
      if (status and 0b10000000 > 0) messages.add("Print head overheating")
      return messages.ifEmpty { listOf("Unknown status") }.joinToString(", ")
    }
  }
}
