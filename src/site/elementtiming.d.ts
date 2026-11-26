// Element Timing attribute (used on the posters, read by the boot script in components/Scripts.tsx).
import 'react'
declare module 'react' {
  interface ImgHTMLAttributes<T> {
    elementtiming?: string
  }
}
