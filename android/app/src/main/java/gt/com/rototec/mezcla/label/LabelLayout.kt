package gt.com.rototec.mezcla.label

/**
 * Estrategia de diseño de etiqueta (patrón Strategy).
 * Cada tamaño define su propia distribución; agregar un tamaño nuevo
 * es crear otra implementación y registrarla en [LabelLayoutFactory]
 * (abierto a extensión, cerrado a modificación).
 */
interface LabelLayout {
  val size: LabelSize
  fun render(content: LabelContent): ByteArray
}

/** Fábrica / registro de layouts por tamaño. */
object LabelLayoutFactory {
  private val layouts: Map<LabelSize, LabelLayout> = listOf(
    Label2x1Layout(),
    Label4x2Layout(),
    Label4x6Layout(),
  ).associateBy { it.size }

  fun forSize(size: LabelSize): LabelLayout =
    layouts[size] ?: error("No hay layout registrado para ${size.id}")

  fun forId(id: String?): LabelLayout = forSize(LabelSize.fromId(id))
}
