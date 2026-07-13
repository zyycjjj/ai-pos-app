package com.aipos.app.printer

import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import net.posprinter.POSConst
import net.posprinter.POSPrinter
import net.posprinter.model.PTable
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import kotlin.math.max

object ReceiptPrintMapper {
  private const val RECEIPT_WIDTH = 32

  fun printTestReceipt(printer: POSPrinter) {
    val now = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.US).format(Date())
    printer.initializePrinter()
      .printText("AI POS Store\n", POSConst.ALIGNMENT_CENTER, POSConst.FNT_BOLD, POSConst.TXT_2WIDTH or POSConst.TXT_2HEIGHT)
      .printText("Built-in Printer Test\n", POSConst.ALIGNMENT_CENTER, POSConst.FNT_DEFAULT, POSConst.TXT_1WIDTH or POSConst.TXT_1HEIGHT)
      .printString("$now\n")
      .printString(separator())
      .printString(row("Espresso", "$3.50"))
      .printString(row("Latte", "$5.00"))
      .printString(separator())
      .printText("TOTAL                $8.50\n", POSConst.ALIGNMENT_LEFT, POSConst.FNT_BOLD, POSConst.TXT_1WIDTH or POSConst.TXT_1HEIGHT)
      .feedLine()
      .printQRCode("ai-pos://printer/test")
      .feedLine(2)
      .cutHalfAndFeed(1)
  }

  fun printPlainText(printer: POSPrinter, text: String) {
    printer.initializePrinter()
      .printString(text.trimEnd() + "\n")
      .feedLine(2)
      .cutHalfAndFeed(1)
  }

  fun printReceipt(printer: POSPrinter, receipt: ReadableMap) {
    val store = receipt.map("store")
    val order = receipt.map("order")
    val totals = receipt.map("totals")
    val footer = receipt.map("footer")
    val items = receipt.array("items")
    val payments = receipt.array("payments")
    val currency = receipt.string("currency", "USD")
    val taskId = System.currentTimeMillis()

    printer.taskStart(taskId)
      .initializePrinter()
      .printText("${store.string("name", "AI POS Store")}\n", POSConst.ALIGNMENT_CENTER, POSConst.FNT_BOLD, POSConst.TXT_2WIDTH or POSConst.TXT_2HEIGHT)
      .printText("${order.string("orderNumber", "TEST")}\n", POSConst.ALIGNMENT_CENTER, POSConst.FNT_DEFAULT, POSConst.TXT_1WIDTH or POSConst.TXT_1HEIGHT)
      .printString(separator())
      .printTable(itemsTable(items))
      .printString(separator())
      .printString(row("Subtotal", money(totals.double("subtotal"), currency)))
      .printString(row("Tax", money(totals.double("tax"), currency)))
      .printString(row("Tip", money(totals.double("tip"), currency)))
      .printString(separator())
      .printText(row("TOTAL", money(totals.double("total"), currency)), POSConst.ALIGNMENT_LEFT, POSConst.FNT_BOLD, POSConst.TXT_1WIDTH or POSConst.TXT_1HEIGHT)
      .printString(paymentsText(payments, currency))
      .feedLine()
      .printText("${footer.string("message", "Thank you")}\n", POSConst.ALIGNMENT_CENTER, POSConst.FNT_DEFAULT, POSConst.TXT_1WIDTH or POSConst.TXT_1HEIGHT)
      .printQRCode(footer.string("qrPayload", "ai-pos://orders/${order.string("id", "")}"))
      .feedLine(2)
      .cutHalfAndFeed(1)
      .taskEnd(taskId)
  }

  private fun itemsTable(items: ReadableArray?): PTable {
    val table = PTable(arrayOf("Item", "Qty", "Total"), arrayOf(18, 4, 10), arrayOf(0, 1, 1))
    if (items == null || items.size() == 0) {
      return table.addRow("Test Item", "1", "$0.00")
    }

    for (index in 0 until items.size()) {
      val item = items.mapAt(index)
      table.addRow(
        item.string("name", "Item").take(28),
        item.int("quantity", 1).toString(),
        money(item.double("lineTotal"), ""),
      )
    }
    return table
  }

  private fun paymentsText(payments: ReadableArray?, currency: String): String {
    if (payments == null || payments.size() == 0) {
      return ""
    }

    val lines = StringBuilder()
    lines.append(separator())
    for (index in 0 until payments.size()) {
      val payment = payments.mapAt(index)
      val method = payment.string("method", "PAY")
      lines.append(row(method, money(payment.double("amount"), currency)))
      val changeDue = payment.nullableDouble("changeDue")
      if (changeDue != null && changeDue > 0) {
        lines.append(row("Change", money(changeDue, currency)))
      }
    }
    return lines.toString()
  }

  private fun separator(): String = "-".repeat(RECEIPT_WIDTH) + "\n"

  private fun row(left: String, right: String): String {
    val trimmedLeft = left.take(RECEIPT_WIDTH - 1)
    val gap = max(1, RECEIPT_WIDTH - trimmedLeft.length - right.length)
    return trimmedLeft + " ".repeat(gap) + right + "\n"
  }

  private fun money(value: Double, currency: String): String {
    val prefix = if (currency.isBlank()) "$" else when (currency.uppercase(Locale.US)) {
      "USD" -> "$"
      else -> "$currency "
    }
    return "%s%.2f".format(Locale.US, prefix, value)
  }

  private fun ReadableMap.map(key: String): ReadableMap {
    return if (hasKey(key) && !isNull(key)) getMap(key) ?: emptyMap() else emptyMap()
  }

  private fun ReadableMap.array(key: String): ReadableArray? {
    return if (hasKey(key) && !isNull(key)) getArray(key) else null
  }

  private fun ReadableMap.string(key: String, fallback: String): String {
    return if (hasKey(key) && !isNull(key)) getString(key) ?: fallback else fallback
  }

  private fun ReadableMap.int(key: String, fallback: Int): Int {
    return if (hasKey(key) && !isNull(key)) getInt(key) else fallback
  }

  private fun ReadableMap.double(key: String): Double {
    return if (hasKey(key) && !isNull(key)) getDouble(key) else 0.0
  }

  private fun ReadableMap.nullableDouble(key: String): Double? {
    return if (hasKey(key) && !isNull(key)) getDouble(key) else null
  }

  private fun emptyMap(): ReadableMap {
    return com.facebook.react.bridge.WritableNativeMap()
  }

  private fun ReadableArray.mapAt(index: Int): ReadableMap {
    return getMap(index) ?: emptyMap()
  }
}
