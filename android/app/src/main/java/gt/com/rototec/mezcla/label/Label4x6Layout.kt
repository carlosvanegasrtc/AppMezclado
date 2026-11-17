package gt.com.rototec.mezcla.label

/**
 * Etiqueta 4" × 6" (vertical) → 812 × 1218 dots. Margen lateral 24 → ancho útil 764.
 *
 *   y=48..527    Código de barras 764 × 480
 *   y=544..607   Código        (font4 ×2 = 48×64; reduce a font5/font4/font3)
 *   y=640        ─ separador ─
 *   y=676..699   "FORMULA"     (font3)
 *   y=712..855   Fórmula       (font5 ×3 = 96×144; reduce a ×2, font4 ×2, …)
 *   y=888        ─ separador ─
 *   y=924..947   "FECHA Y HORA DE IMPRESION" (font3)
 *   y=964..1027  Fecha  dd/MM/yyyy (font4 ×2 → 480 dots)
 *   y=1044..1107 Hora   HH:mm      (font4 ×2 → 240 dots)
 *   y=1108..1217 margen inferior (110)
 *
 * Los rótulos usan solo ASCII: las fuentes internas TSPL no garantizan acentos.
 */
class Label4x6Layout : LabelLayout {
  override val size = LabelSize.SIZE_4X6

  override fun render(content: LabelContent): ByteArray {
    val b = TsplCommandBuilder(size).setup()
    val usable = b.labelWidth - 2 * MARGIN

    b.bitmapCentered(BAR_Y, Code128Bitmap.render(content.codigo, usable, BAR_H))
    b.fittedText(CODE_Y, 64, usable, CODE_STYLES, content.codigo)

    b.bar(MARGIN, SEP1_Y, usable, SEP_H)
    b.fittedText(FORMULA_CAPTION_Y, 24, usable, CAPTION_STYLES, "FORMULA")
    b.fittedText(FORMULA_Y, 144, usable, FORMULA_STYLES, content.formula)

    b.bar(MARGIN, SEP2_Y, usable, SEP_H)
    b.fittedText(FECHA_CAPTION_Y, 24, usable, CAPTION_STYLES, "FECHA Y HORA DE IMPRESION")
    b.fittedText(FECHA_Y, 64, usable, FECHA_STYLES, content.fecha)
    b.fittedText(HORA_Y,  64, usable, FECHA_STYLES, content.hora)

    return b.print().build()
  }

  private companion object {
    const val MARGIN            = 24
    const val BAR_Y             = 48
    const val BAR_H             = 480
    const val CODE_Y            = 544
    const val SEP1_Y            = 640
    const val FORMULA_CAPTION_Y = 676
    const val FORMULA_Y         = 712
    const val SEP2_Y            = 888
    const val FECHA_CAPTION_Y   = 924
    const val FECHA_Y           = 964
    const val HORA_Y            = 1044
    const val SEP_H             = 4

    val CAPTION_STYLES = listOf(TextStyle(TsplFont.F3), TextStyle(TsplFont.F2))
    val CODE_STYLES = listOf(
      TextStyle(TsplFont.F4, 2, 2), TextStyle(TsplFont.F5), TextStyle(TsplFont.F4), TextStyle(TsplFont.F3),
    )
    val FORMULA_STYLES = listOf(
      TextStyle(TsplFont.F5, 3, 3), TextStyle(TsplFont.F5, 2, 2), TextStyle(TsplFont.F4, 2, 2),
      TextStyle(TsplFont.F5), TextStyle(TsplFont.F4), TextStyle(TsplFont.F3),
    )
    val FECHA_STYLES = listOf(TextStyle(TsplFont.F4, 2, 2), TextStyle(TsplFont.F5), TextStyle(TsplFont.F4))
  }
}
