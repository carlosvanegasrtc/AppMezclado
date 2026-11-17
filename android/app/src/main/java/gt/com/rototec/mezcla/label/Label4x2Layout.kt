package gt.com.rototec.mezcla.label

/**
 * Etiqueta 4" × 2" → 812 × 406 dots. Margen lateral 16 → ancho útil 780.
 *
 *   y=16..235   Código de barras 780 × 220
 *   y=244..275  Código       (font4 24×32; reduce a font3/font2 si no cabe)
 *   y=286..333  Fórmula      (font5 32×48; reduce a font4/3/2)
 *   y=346..377  Fecha y hora (font4 24×32 → "dd/MM/yyyy HH:mm" = 384 dots)
 *   y=378..405  margen inferior (28)
 */
class Label4x2Layout : LabelLayout {
  override val size = LabelSize.SIZE_4X2

  override fun render(content: LabelContent): ByteArray {
    val b = TsplCommandBuilder(size).setup()
    val usable = b.labelWidth - 2 * MARGIN

    b.bitmapCentered(BAR_Y, Code128Bitmap.render(content.codigo, usable, BAR_H))
    b.fittedText(CODE_Y,    32, usable, CODE_STYLES,    content.codigo)
    b.fittedText(FORMULA_Y, 48, usable, FORMULA_STYLES, content.formula)
    b.fittedText(FECHA_Y,   32, usable, FECHA_STYLES,   content.fechaHora)

    return b.print().build()
  }

  private companion object {
    const val MARGIN    = 16
    const val BAR_Y     = 16
    const val BAR_H     = 220
    const val CODE_Y    = 244
    const val FORMULA_Y = 286
    const val FECHA_Y   = 346

    val CODE_STYLES    = listOf(TextStyle(TsplFont.F4), TextStyle(TsplFont.F3), TextStyle(TsplFont.F2))
    val FORMULA_STYLES = listOf(TextStyle(TsplFont.F5), TextStyle(TsplFont.F4), TextStyle(TsplFont.F3), TextStyle(TsplFont.F2))
    val FECHA_STYLES   = listOf(TextStyle(TsplFont.F4), TextStyle(TsplFont.F3))
  }
}
