import * as React from "react"
import { ResponsiveImage } from "./responsive-image"
import { cn } from "@/lib/utils"

/**
 * Simple Image component. Renders a standard img via ResponsiveImage.
 */
const Image = React.forwardRef(function Image({ src, alt = "", className, ...props }, ref) {
  if (!src) return null
  return (
    <ResponsiveImage
      ref={ref}
      src={src}
      alt={alt}
      className={cn(className)}
      {...props}
    />
  )
})

Image.displayName = "Image"

export { Image }
export default Image
