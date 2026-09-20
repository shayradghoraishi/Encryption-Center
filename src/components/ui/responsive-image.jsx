import * as React from "react"
import { cn } from "@/lib/utils"
import { useResponsiveImage } from "./use-responsive-image"
import { splitImageProps } from "./image-helpers"

/**
 * Simple responsive image component.
 * Renders a standard <img> with optional wrapper for sizing.
 */
export const ResponsiveImage = React.forwardRef(function ResponsiveImage(props, ref) {
  const { src, alt = "", className, onLoad, fittingType, ...rest } = props
  const { wrapperProps, imageProps } = splitImageProps(rest)
  const { wrapperRef, imgRef, loaded, setLoaded } = useResponsiveImage({ className, onLoad }, ref)

  return (
    <span
      ref={wrapperRef}
      className={cn("inline-block relative", className)}
      {...wrapperProps}
    >
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className={cn("max-w-full h-auto", className)}
        onLoad={(e) => {
          setLoaded(true)
          onLoad?.(e)
        }}
        {...imageProps}
      />
    </span>
  )
})

ResponsiveImage.displayName = "ResponsiveImage"
