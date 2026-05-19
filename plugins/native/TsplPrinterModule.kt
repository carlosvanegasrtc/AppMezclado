package gt.com.rototec.mezcla

import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothManager
import android.bluetooth.BluetoothSocket
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.util.Log
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.*
import java.io.IOException
import java.io.OutputStream
import java.util.UUID

private const val TAG = "TsplPrinter"
private val SPP_UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB")

class TsplPrinterModule(private val ctx: ReactApplicationContext) :
  ReactContextBaseJavaModule(ctx) {

  override fun getName() = "TsplPrinter"

  private var socket: BluetoothSocket? = null
  private var outputStream: OutputStream? = null
  private var connectedMac: String? = null

  private fun getAdapter(): BluetoothAdapter? {
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      val mgr = ctx.getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager
      mgr?.adapter
    } else {
      @Suppress("DEPRECATION")
      BluetoothAdapter.getDefaultAdapter()
    }
  }

  private fun hasBluetoothConnectPermission(): Boolean {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return true // < Android 12: no runtime perm needed
    return ContextCompat.checkSelfPermission(
      ctx, android.Manifest.permission.BLUETOOTH_CONNECT
    ) == PackageManager.PERMISSION_GRANTED
  }

  // ── getPairedDevices ───────────────────────────────────────────────────
  @ReactMethod
  fun getPairedDevices(promise: Promise) {
    try {
      if (!hasBluetoothConnectPermission()) {
        promise.reject("BT_PERMISSION_DENIED", "Permiso BLUETOOTH_CONNECT no otorgado. Ve a Ajustes → Apps → Mezcla → Permisos → Bluetooth.")
        return
      }
      val adapter = getAdapter()
      if (adapter == null) { promise.resolve(Arguments.createArray()); return }
      if (!adapter.isEnabled) {
        promise.reject("BT_DISABLED", "Bluetooth está apagado. Actívalo en Ajustes.")
        return
      }

      val arr = Arguments.createArray()
      adapter.bondedDevices?.forEach { dev ->
        val map = Arguments.createMap()
        map.putString("name", dev.name ?: dev.address)
        map.putString("mac",  dev.address)
        arr.pushMap(map)
      }
      Log.d(TAG, "Paired devices: ${arr.size()}")
      promise.resolve(arr)
    } catch (e: SecurityException) {
      promise.reject("BT_PERMISSION", "Permiso Bluetooth denegado: ${e.message}")
    } catch (e: Exception) {
      promise.reject("BT_ERROR", e.message)
    }
  }

  // ── connectPrinter ─────────────────────────────────────────────────────
  @ReactMethod
  fun connectPrinter(mac: String, promise: Promise) {
    try {
      if (!hasBluetoothConnectPermission()) {
        promise.reject("BT_PERMISSION_DENIED", "Permiso BLUETOOTH_CONNECT no otorgado.")
        return
      }
      closeSocket()
      val adapter = getAdapter()
        ?: return promise.reject("BT_UNAVAILABLE", "Bluetooth no disponible")
      if (!adapter.isEnabled) {
        return promise.reject("BT_DISABLED", "Bluetooth está apagado.")
      }
      val device = adapter.getRemoteDevice(mac.uppercase())
      socket = connectWithFallback(device)
      outputStream = socket!!.outputStream
      connectedMac = mac.uppercase()
      Log.d(TAG, "Conectado a $mac")
      promise.resolve(true)
    } catch (e: SecurityException) {
      promise.reject("BT_PERMISSION", "Permiso Bluetooth denegado: ${e.message}")
    } catch (e: Exception) {
      closeSocket()
      promise.reject("BT_CONNECT_FAILED", "No se pudo conectar con $mac: ${e.message}")
    }
  }

  // ── disconnectPrinter ──────────────────────────────────────────────────
  @ReactMethod
  fun disconnectPrinter(promise: Promise) {
    try { closeSocket(); promise.resolve(true) }
    catch (e: Exception) { promise.resolve(true) }
  }

  // ── isConnected ────────────────────────────────────────────────────────
  @ReactMethod
  fun isConnected(promise: Promise) {
    promise.resolve(socket?.isConnected == true)
  }

  // ── getConnectedMac ────────────────────────────────────────────────────
  @ReactMethod
  fun getConnectedMac(promise: Promise) {
    promise.resolve(connectedMac)
  }

  // ── printSacoLabel ─────────────────────────────────────────────────────
  @ReactMethod
  fun printSacoLabel(data: ReadableMap, promise: Promise) {
    try {
      val out = outputStream
        ?: return promise.reject("NOT_CONNECTED", "Impresora no conectada")

      val codigo    = data.getString("codigo")    ?: ""
      val formula   = data.getString("formula")   ?: ""
      val pesoKg    = data.getDouble("pesoKg")
      val fechaHora = data.getString("fechaHora") ?: ""

      val tspl = buildTspl(codigo, formula, pesoKg, fechaHora)
      out.write(tspl)
      out.flush()
      Log.d(TAG, "Etiqueta enviada: $codigo (${tspl.size} bytes)")
      promise.resolve(true)
    } catch (e: IOException) {
      closeSocket()
      promise.reject("PRINT_IO_ERROR", "Error de escritura BT: ${e.message}")
    } catch (e: Exception) {
      promise.reject("PRINT_ERROR", e.message)
    }
  }

  // ── TSPL builder ──────────────────────────────────────────────────────
  // 2" × 1" a 203 DPI = 406 × 203 dots
  private fun buildTspl(
    codigo: String, formula: String, pesoKg: Double, fechaHora: String,
  ): ByteArray {
    val LABEL_W = 406
    val NARROW  = 2

    // x centrado para el barcode Code 128: (35 + 11×N) × narrow dots de ancho
    fun barcodeX(nChars: Int): Int {
      val w = (35 + 11 * nChars) * NARROW
      return maxOf(0, (LABEL_W - w) / 2)
    }

    // x centrado para TEXT según font: font2=12 dots/char, font3=16 dots/char
    fun textX(text: String, charW: Int): Int =
      maxOf(0, (LABEL_W - text.length * charW) / 2)

    val pesoStr = String.format("%.2f kg", pesoKg)

    val sb = StringBuilder()
    fun cmd(s: String) { sb.append(s).append("\r\n") }

    cmd("SIZE 2 inch, 1 inch")
    cmd("GAP 0.12 inch, 0")
    cmd("DIRECTION 0")
    cmd("CLS")

    // Barcode centrado — human_readable=1: la impresora imprime el código UNA sola vez,
    // centrado automáticamente bajo las barras. No se agrega TEXT manual para evitar duplicado.
    val bx = barcodeX(codigo.length)
    cmd("BARCODE $bx,4,\"128\",70,1,0,$NARROW,$NARROW,\"$codigo\"")

    // Fórmula (font2=12 dots/char) — y=90 deja margen tras barras+texto human-readable
    cmd("TEXT ${textX(formula, 12)},92,\"2\",0,1,1,\"$formula\"")

    // Peso (font3=16 dots/char, más grande) — y=118
    cmd("TEXT ${textX(pesoStr, 16)},118,\"3\",0,1,1,\"$pesoStr\"")

    // Fecha/hora (font2=12 dots/char) — y=152
    cmd("TEXT ${textX(fechaHora, 12)},152,\"2\",0,1,1,\"$fechaHora\"")

    cmd("PRINT 1,1")

    return sb.toString().toByteArray(Charsets.ISO_8859_1)
  }

  // ── RFCOMM fallback ────────────────────────────────────────────────────
  private fun connectWithFallback(device: BluetoothDevice): BluetoothSocket {
    tryConnect { device.createInsecureRfcommSocketToServiceRecord(SPP_UUID) }?.let { return it }
    tryConnect { device.createRfcommSocketToServiceRecord(SPP_UUID) }?.let { return it }
    tryConnect {
      val m = device.javaClass.getMethod("createInsecureRfcommSocket", Int::class.java)
      m.invoke(device, 1) as BluetoothSocket
    }?.let { return it }
    val m = device.javaClass.getMethod("createRfcommSocket", Int::class.java)
    val s = m.invoke(device, 1) as BluetoothSocket
    s.connect()
    return s
  }

  private fun tryConnect(factory: () -> BluetoothSocket): BluetoothSocket? = try {
    val s = factory(); s.connect(); s
  } catch (_: Exception) { null }

  private fun closeSocket() {
    try { outputStream?.close() } catch (_: Exception) {}
    try { socket?.close() }       catch (_: Exception) {}
    outputStream = null
    socket       = null
    connectedMac = null
  }
}
