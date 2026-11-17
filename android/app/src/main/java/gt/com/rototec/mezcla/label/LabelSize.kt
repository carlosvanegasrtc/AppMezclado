package gt.com.rototec.mezcla.label

/**
 * Tamaños de etiqueta soportados. El [id] debe coincidir con el catálogo
 * de JS (src/config/labelSizes.ts).
 *
 * Resolución de la impresora: 203 DPI → 1 pulgada = 203 dots.
 */
enum class LabelSize(
  val id: String,
  val widthIn: Int,
  val heightIn: Int,
  val gapIn: Double = 0.12,
) {
  SIZE_2X1("2x1", 2, 1),
  SIZE_4X2("4x2", 4, 2),
  SIZE_4X6("4x6", 4, 6);

  val widthDots: Int  get() = widthIn  * DPI
  val heightDots: Int get() = heightIn * DPI

  companion object {
    const val DPI = 203
    val DEFAULT = SIZE_2X1

    fun fromId(id: String?): LabelSize =
      values().firstOrNull { it.id.equals(id, ignoreCase = true) } ?: DEFAULT
  }
}
