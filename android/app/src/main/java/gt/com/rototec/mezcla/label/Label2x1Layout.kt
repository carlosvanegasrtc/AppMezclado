package gt.com.rototec.mezcla.label

/**
 * Etiqueta 2" × 1" → 406 × 203 dots.
 *
 *   y=2..131   Código de barras 394 px (6 px de margen a cada lado)
 *   y=138      Código (font2, 20 alto → 158)
 *   y=162      "FÓRMULA   dd/MM/yyyy HH:mm" (font3, 24 alto → 186)
 *              · si no cabe en font3 (≤25 chars) → font2 (≤33 chars)
 *              · si tampoco → fórmula en y=162 (font3) y fecha/hora en y=188 (font1 → 200)
 */
class Label2x1Layout : LabelLayout {
  override val size = LabelSize.SIZE_2X1

  override fun render(content: LabelContent): ByteArray {
    val b = TsplCommandBuilder(size).setup()
    val w = b.labelWidth

    b.bitmapCentered(BAR_Y, Code128Bitmap.render(content.codigo, w - 2 * BAR_MARGIN, BAR_H))
    b.textCentered(CODE_Y, TextStyle.bestFit(content.codigo, w, CODE_STYLES), content.codigo)

    val line = "${content.formula}   ${content.fechaHora}"
    when {
      F3.fits(line, w) -> b.textCentered(LINE_Y, F3, line)
      F2.fits(line, w) -> b.textCentered(LINE_Y + 2, F2, line)
      else -> {
        b.textCentered(LINE_Y, TextStyle.bestFit(content.formula, w, listOf(F3, F2, F1)), content.formula)
        b.textCentered(FOOT_Y, F1, content.fechaHora)
      }
    }
    return b.print().build()
  }

  private companion object {
    const val BAR_MARGIN = 6
    const val BAR_Y = 2
    const val BAR_H = 130
    const val CODE_Y = 138
    const val LINE_Y = 162
    const val FOOT_Y = 188

    val F1 = TextStyle(TsplFont.F1)
    val F2 = TextStyle(TsplFont.F2)
    val F3 = TextStyle(TsplFont.F3)
    val CODE_STYLES = listOf(F2, F1)
  }
}
