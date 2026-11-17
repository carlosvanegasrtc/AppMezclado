package gt.com.rototec.mezcla.label

import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Datos que se imprimen en la etiqueta del super saco.
 * Es independiente del tamaño: cada [LabelLayout] decide cómo acomodarlos.
 */
data class LabelContent(
  val codigo: String,
  val formula: String,
  val impresoEn: Date = Date(),
) {
  /** Fecha de impresión, p. ej. "17/11/2026". */
  val fecha: String get() = format("dd/MM/yyyy")

  /** Hora de impresión en formato 24 h, p. ej. "14:35". */
  val hora: String get() = format("HH:mm")

  /** Fecha y hora en una sola cadena, p. ej. "17/11/2026 14:35". */
  val fechaHora: String get() = "$fecha $hora"

  private fun format(pattern: String) = SimpleDateFormat(pattern, Locale.US).format(impresoEn)
}
