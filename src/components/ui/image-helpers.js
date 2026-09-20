// Simple image helpers (no external media platform dependency)

export const DEFAULT_TRANSFORM_WIDTH = 1024
export const IMAGE_LOAD_MODE = {
  OPTIMIZED: "optimized",
  ORIGINAL: "original",
  FALLBACK: "fallback",
}

export function splitImageProps(props) {
  const wrapperProps = {}
  const imageProps = {}
  for (const [key, value] of Object.entries(props)) {
    if (key.startsWith("data-")) wrapperProps[key] = value
    else imageProps[key] = value
  }
  return { wrapperProps, imageProps }
}

export function getImagePreviewClassName(className, currentClassName, baselineClassName) {
  const sourceClasses = new Set((className || "").split(/\s+/).filter(Boolean))
  const baselineClasses = new Set((baselineClassName || "").split(/\s+/).filter(Boolean))
  return (currentClassName || "")
    .split(/\s+/)
    .filter(
      (token) =>
        !["inline-block", "relative"].includes(token) ||
        !baselineClasses.has(token) ||
        sourceClasses.has(token)
    )
    .join(" ")
}

/** No external media platform — always return null so images render as plain <img>. */
export function parseWixMediaUrl(_src) {
  return null
}

export function getOriginalImageUrl(src) {
  return src
}

export function nextImageLoadMode(mode) {
  if (mode === IMAGE_LOAD_MODE.OPTIMIZED) return IMAGE_LOAD_MODE.ORIGINAL
  if (mode === IMAGE_LOAD_MODE.ORIGINAL) return IMAGE_LOAD_MODE.FALLBACK
  return IMAGE_LOAD_MODE.FALLBACK
}

export function buildTransformUrl() {
  return null
}
