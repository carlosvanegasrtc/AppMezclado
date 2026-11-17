package gt.com.rototec.mezcla.label

/**
 * Fuentes internas TSPL a 203 DPI (ancho × alto de celda en dots, incluye espaciado).
 */
enum class TsplFont(val code: String, val charW: Int, val charH: Int) {
  F1("1", 8, 12),
  F2("2", 12, 20),
  F3("3", 16, 24),
  F4("4", 24, 32),
  F5("5", 32, 48),
}

/** Fuente + multiplicadores X/Y (TSPL admite 1..10). */
data class TextStyle(val font: TsplFont, val xMul: Int = 1, val yMul: Int = 1) {
  init {
    require(xMul in 1..10 && yMul in 1..10) { "Multiplicador TSPL fuera de rango (1..10)" }
  }

  val height: Int get() = font.charH * yMul
  fun widthOf(text: String): Int = text.length * font.charW * xMul
  fun fits(text: String, maxWidth: Int): Boolean = widthOf(text) <= maxWidth

  companion object {
    /**
     * Devuelve el primer estilo (de mayor a menor) en el que [text] cabe en [maxWidth].
     * Si ninguno cabe, devuelve el último (el más pequeño).
     */
    fun bestFit(text: String, maxWidth: Int, candidates: List<TextStyle>): TextStyle {
      require(candidates.isNotEmpty()) { "Se requiere al menos un estilo candidato" }
      return candidates.firstOrNull { it.fits(text, maxWidth) } ?: candidates.last()
    }
  }
}
