import { useState, useRef, useEffect, ReactNode } from 'react'

interface LazySectionProps {
  children: ReactNode
  className?: string
  threshold?: number
  rootMargin?: string
  fallback?: ReactNode
  delay?: number
}

export const LazySection: React.FC<LazySectionProps> = ({
  children,
  className = '',
  threshold = 0.1,
  rootMargin = '50px',
  fallback = null,
  delay = 0
}) => {
  const [, setIsInView] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const currentRef = sectionRef.current
    if (!currentRef) return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting) {
          setIsInView(true)
          
          // 延迟渲染
          const timer = setTimeout(() => {
            setShouldRender(true)
          }, delay)

          return () => clearTimeout(timer)
        }
      },
      {
        threshold,
        rootMargin
      }
    )

    observer.observe(currentRef)

    return () => {
      observer.disconnect()
    }
  }, [threshold, rootMargin, delay])

  return (
    <div ref={sectionRef} className={className}>
      {shouldRender ? children : fallback}
    </div>
  )
}

export default LazySection