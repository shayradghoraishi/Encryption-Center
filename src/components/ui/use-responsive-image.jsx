import * as React from "react"
import { useSize } from "../../hooks/use-size"
import { cn } from "../../lib/utils"
import { DEFAULT_TRANSFORM_WIDTH, getImagePreviewClassName } from "./image-helpers"

export function useResponsiveImage({ className, onLoad }, parentRef) {
  const wrapperRef = React.useRef(null)
  const imgRef = React.useRef(null)
  const size = useSize(wrapperRef)
  const [loaded, setLoaded] = React.useState(false)

  React.useImperativeHandle(parentRef, () => imgRef.current)

  return {
    wrapperRef,
    imgRef,
    size,
    loaded,
    setLoaded,
    options: size && {
      width: size.width || DEFAULT_TRANSFORM_WIDTH,
      height: size.height || undefined,
    },
  }
}
