package com.aipos.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

class BootCompletedReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val action = intent.action
    if (action != Intent.ACTION_BOOT_COMPLETED && action != Intent.ACTION_LOCKED_BOOT_COMPLETED) {
      return
    }

    // POS terminals are expected to return to the cashier workflow after reboot; failures are logged only and never block Android boot.
    Log.i(TAG, "Received $action; attempting to launch AI-POS.")

    try {
      val launchIntent = Intent(context, MainActivity::class.java).apply {
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
        addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP)
        putExtra("launchSource", "boot_completed")
      }
      context.startActivity(launchIntent)
      Log.i(TAG, "MainActivity launch requested after $action.")
    } catch (error: Exception) {
      Log.e(TAG, "MainActivity launch failed after $action.", error)
    }
  }

  companion object {
    private const val TAG = "AI-POS BootReceiver"
  }
}
