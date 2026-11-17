package gt.com.rototec.mezcla.label

import com.google.zxing.BarcodeFormat
import com.google.zxing.EncodeHintType
import com.google.zxing.oned.Code128Writer

/**
 * Bitmap monocromo listo para el comando TSPL BITMAP.
 * Convención de esta impresora: bit 0 = negro, bit 1 = blanco.
 */
class MonoBitmap(val widthDots: Int, val heightDots: Int, val data: ByteArray) {
  val widthBytes: Int get() = (widthDots + 7) / 8
}

/**
 * Renderiza Code128 a píxeles exactos con ZXing, de modo que la impresora
 * nunca escale el código (barras nítidas en cualquier tamaño de etiqueta).
 */
object Code128Bitmap {

  fun render(data: String, widthDots: Int, heightDots: Int): MonoBitmap {
    require(data.isNotEmpty()) { "El código de barras está vacío" }

    // ZXing escala por múltiplos enteros del módulo y centra dentro de widthDots.
    val hints  = mapOf(EncodeHintType.MARGIN to 0)
    val matrix = Code128Writer().encode(data, BarcodeFormat.CODE_128, widthDots, 1, hints)
    if (matrix.width > widthDots) {
      throw IllegalArgumentException(
        "El código \"$data\" es demasiado largo para el ancho de la etiqueta ($widthDots dots)"
      )
    }
    val offsetX  = (widthDots - matrix.width) / 2
    val rowBytes = (widthDots + 7) / 8

    // Una fila patrón; todas las filas son idénticas en un código 1D.
    val row = ByteArray(rowBytes) { 0xFF.toByte() }
    for (px in 0 until matrix.width) {
      if (matrix.get(px, 0)) {
        val col = px + offsetX
        row[col / 8] = (row[col / 8].toInt() and (0x80 shr (col % 8)).inv()).toByte()
      }
    }

    val bytes = ByteArray(rowBytes * heightDots)
    for (r in 0 until heightDots) System.arraycopy(row, 0, bytes, r * rowBytes, rowBytes)
    return MonoBitmap(widthDots, heightDots, bytes)
  }
}
