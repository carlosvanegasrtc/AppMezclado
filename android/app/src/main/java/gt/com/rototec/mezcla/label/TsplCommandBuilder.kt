package gt.com.rototec.mezcla.label

import java.io.ByteArrayOutputStream

/**
 * Builder fluido de comandos TSPL. Encapsula la sintaxis y el ensamblado
 * binario (BITMAP lleva datos crudos en línea), para que los layouts solo
 * describan *qué* va y *dónde*.
 */
class TsplCommandBuilder(private val size: LabelSize) {

  private val out = ByteArrayOutputStream()

  val labelWidth: Int  get() = size.widthDots
  val labelHeight: Int get() = size.heightDots

  fun setup(): TsplCommandBuilder = apply {
    cmd("SIZE ${size.widthIn} inch, ${size.heightIn} inch")
    cmd("GAP ${size.gapIn} inch, 0")
    cmd("DIRECTION 0")
    cmd("CLS")
  }

  /** Dibuja un bitmap en (x, y). Modo 0 = sobrescribir. */
  fun bitmap(x: Int, y: Int, bmp: MonoBitmap): TsplCommandBuilder = apply {
    raw("BITMAP $x,$y,${bmp.widthBytes},${bmp.heightDots},0,")
    out.write(bmp.data)
    raw(CRLF)
  }

  /** Bitmap centrado horizontalmente en la etiqueta. */
  fun bitmapCentered(y: Int, bmp: MonoBitmap): TsplCommandBuilder =
    bitmap(maxOf(0, (labelWidth - bmp.widthDots) / 2), y, bmp)

  fun text(x: Int, y: Int, style: TextStyle, text: String): TsplCommandBuilder = apply {
    cmd("TEXT $x,$y,\"${style.font.code}\",0,${style.xMul},${style.yMul},\"${sanitize(text)}\"")
  }

  /** Texto centrado horizontalmente. */
  fun textCentered(y: Int, style: TextStyle, text: String): TsplCommandBuilder =
    text(maxOf(0, (labelWidth - style.widthOf(text)) / 2), y, style, text)

  /**
   * Texto centrado dentro de una franja vertical [slotTop, slotTop + slotHeight),
   * usando el estilo más grande de [candidates] que quepa en [maxWidth].
   */
  fun fittedText(
    slotTop: Int, slotHeight: Int, maxWidth: Int,
    candidates: List<TextStyle>, text: String,
  ): TsplCommandBuilder {
    val style = TextStyle.bestFit(text, maxWidth, candidates)
    val y = slotTop + maxOf(0, (slotHeight - style.height) / 2)
    return textCentered(y, style, text)
  }

  /** Rectángulo sólido (líneas separadoras). */
  fun bar(x: Int, y: Int, width: Int, height: Int): TsplCommandBuilder = apply {
    cmd("BAR $x,$y,$width,$height")
  }

  fun print(copies: Int = 1): TsplCommandBuilder = apply { cmd("PRINT $copies,1") }

  fun build(): ByteArray = out.toByteArray()

  private fun cmd(s: String) = raw(s + CRLF)
  private fun raw(s: String) = out.write(s.toByteArray(Charsets.ISO_8859_1))

  /** Las comillas dobles y saltos de línea romperían el comando TEXT. */
  private fun sanitize(t: String) = t.replace('"', '\'').replace("\r", " ").replace("\n", " ")

  private companion object { const val CRLF = "\r\n" }
}
