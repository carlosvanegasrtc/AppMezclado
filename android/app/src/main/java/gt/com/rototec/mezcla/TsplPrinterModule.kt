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
import com.google.zxing.BarcodeFormat
import com.google.zxing.EncodeHintType
import com.google.zxing.oned.Code128Writer
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

      val codigo  = data.getString("codigo")  ?: ""
      val formula = data.getString("formula") ?: ""
      val pesoKg  = data.getDouble("pesoKg")

      val tspl = buildTspl(codigo, formula, pesoKg)
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
  // 2" × 1" @ 203 DPI = 406 × 203 dots
  // Barcode: ZXing Code128 rendered as raw pixels via TSPL BITMAP — printer never scales it.
  // Layout (dots):
  //   y=2..131  BITMAP barcode 394 px wide, 6 px margin each side → x=6
  //   y=138     TEXT codigo   (font2, 12 dots/char, centrado)
  //   y=162     TEXT formula+peso (font3, 16 dots/char, centrado)
  private fun buildTspl(
    codigo: String, formula: String, pesoKg: Double,
  ): ByteArray {
    val LABEL_W    = 406
    val BAR_W      = 394          // usable barcode pixels (6 px quiet margin each side)
    val BAR_H      = 130          // bar height in dots
    val BAR_X      = (LABEL_W - BAR_W) / 2   // = 6

    // ZXing Code128 → BitMatrix exactly BAR_W wide with zero internal quiet-zone margin
    val hints = mapOf(EncodeHintType.MARGIN to 0)
    val matrix = Code128Writer().encode(codigo, BarcodeFormat.CODE_128, BAR_W, 1, hints)
    val matrixW = matrix.width   // actual rendered width (≤ BAR_W)

    // Center matrix within BAR_W if ZXing returned fewer pixels
    val offsetX = (BAR_W - matrixW) / 2

    // Build raw bitmap: BAR_H rows × ceil(BAR_W/8) bytes each, MSB-first.
    // This printer interprets bit=0 as DARK and bit=1 as LIGHT (inverted convention).
    // Init to 0xFF (all white), then CLEAR bits for black bar pixels.
    val rowBytes = (BAR_W + 7) / 8    // = 50 bytes (400 bits, 6 padding bits on right → stay 1 = white)
    val bitmapData = ByteArray(BAR_H * rowBytes) { 0xFF.toByte() }
    for (row in 0 until BAR_H) {
      for (px in 0 until matrixW) {
        if (matrix.get(px, 0)) {   // dark (black) pixel from ZXing
          val col = px + offsetX
          val byteIdx = row * rowBytes + col / 8
          val bitMask = (0x80 shr (col % 8))
          bitmapData[byteIdx] = (bitmapData[byteIdx].toInt() and bitMask.inv()).toByte()
        }
      }
    }

    // Text centering helpers
    fun cx2(t: String) = maxOf(0, (LABEL_W - t.length * 12) / 2)
    fun cx3(t: String) = maxOf(0, (LABEL_W - t.length * 16) / 2)

    val pesoStr  = String.format(java.util.Locale.US, "%.2f kg", pesoKg)
    val mainLine = "$formula   $pesoStr"

    // Build TSPL command string (header + text commands)
    val sb = StringBuilder()
    fun cmd(s: String) { sb.append(s).append("\r\n") }

    cmd("SIZE 2 inch, 1 inch")
    cmd("GAP 0.12 inch, 0")
    cmd("DIRECTION 0")
    cmd("CLS")
    // BITMAP x,y,width_bytes,height,mode — mode 0 = overwrite
    sb.append("BITMAP $BAR_X,2,$rowBytes,$BAR_H,0,")
    // Inline binary data follows immediately after the comma (no CRLF before data)

    // TEXT lines
    val textCmds = StringBuilder()
    fun tcmd(s: String) { textCmds.append(s).append("\r\n") }
    tcmd("TEXT ${cx2(codigo)},138,\"2\",0,1,1,\"$codigo\"")
    tcmd("TEXT ${cx3(mainLine)},162,\"3\",0,1,1,\"$mainLine\"")
    tcmd("PRINT 1,1")

    // Assemble: header bytes + bitmap binary + CRLF + text commands
    val header    = sb.toString().toByteArray(Charsets.ISO_8859_1)
    val textBytes = textCmds.toString().toByteArray(Charsets.ISO_8859_1)
    val crlf      = "\r\n".toByteArray(Charsets.ISO_8859_1)

    return header + bitmapData + crlf + textBytes
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
