import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useMobile } from "@/hooks/use-mobile"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

interface EnhancedCarouselProps {
  children: React.ReactNode
  className?: string
  autoSlide?: boolean
  slideInterval?: number
  showIndicators?: boolean
  showNavigation?: boolean
  mobileItemsPerView?: number
  tabletItemsPerView?: number
  desktopItemsPerView?: number
  spacing?: 'sm' | 'md' | 'lg'
  title?: string
  description?: string
}

export const EnhancedCarousel: React.FC<EnhancedCarouselProps> = ({
  children,
  className,
  autoSlide = false,
  slideInterval = 5000,
  showIndicators = true,
  showNavigation = true,
  mobileItemsPerView = 1,
  tabletItemsPerView = 2,
  desktopItemsPerView = 3,
  spacing = 'md',
  title,
  description
}) => {
  const { isMobile, isTablet, isDesktop } = useMobile()
  const [currentSlide, setCurrentSlide] = React.useState(0)
  const childrenArray = React.Children.toArray(children)
  const totalSlides = childrenArray.length

  // Determine items per view based on device
  const itemsPerView = isMobile ? mobileItemsPerView : 
                     isTablet ? tabletItemsPerView : 
                     desktopItemsPerView

  const spacingClasses = {
    sm: 'gap-2',
    md: 'gap-4', 
    lg: 'gap-6'
  }

  // Auto-slide functionality
  React.useEffect(() => {
    if (!autoSlide) return

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % Math.ceil(totalSlides / itemsPerView))
    }, slideInterval)

    return () => clearInterval(interval)
  }, [autoSlide, slideInterval, totalSlides, itemsPerView])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % Math.ceil(totalSlides / itemsPerView))
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => 
      prev === 0 ? Math.ceil(totalSlides / itemsPerView) - 1 : prev - 1
    )
  }

  return (
    <div className={cn("w-full", className)}>
      {/* Header */}
      {(title || description) && (
        <div className="mb-6">
          {title && (
            <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
          )}
          {description && (
            <p className="text-sm text-slate-600">{description}</p>
          )}
        </div>
      )}

      {/* Enhanced Carousel */}
      <Carousel
        opts={{
          align: "start",
          slidesToScroll: itemsPerView,
        }}
        className="w-full"
      >
        <CarouselContent className={cn("-ml-2 md:-ml-4", spacingClasses[spacing])}>
          {childrenArray.map((child, index) => (
            <CarouselItem 
              key={index} 
              className={cn(
                "pl-2 md:pl-4",
                // Responsive basis classes
                isMobile ? "basis-full" : 
                isTablet ? "basis-1/2" : 
                "basis-1/3"
              )}
            >
              {child}
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Custom Navigation */}
        {showNavigation && (
          <>
            <CarouselPrevious 
              className={cn(
                "left-4 top-1/2 -translate-y-1/2",
                "bg-white/90 hover:bg-white shadow-lg border border-slate-200",
                "transition-all duration-200 hover:scale-105"
              )} 
            />
            <CarouselNext 
              className={cn(
                "right-4 top-1/2 -translate-y-1/2",
                "bg-white/90 hover:bg-white shadow-lg border border-slate-200",
                "transition-all duration-200 hover:scale-105"
              )} 
            />
          </>
        )}
      </Carousel>

      {/* Indicators */}
      {showIndicators && Math.ceil(totalSlides / itemsPerView) > 1 && (
        <div className="flex justify-center mt-4 space-x-2">
          {Array.from({ length: Math.ceil(totalSlides / itemsPerView) }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-200",
                currentSlide === index 
                  ? "bg-blue-600 w-6" 
                  : "bg-slate-300 hover:bg-slate-400"
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Data display carousel for stats/metrics
interface DataCarouselProps {
  data: Array<{
    id: string | number
    title: string
    value: string | number
    subtitle?: string
    icon?: React.ReactNode
    color?: string
    onClick?: () => void
  }>
  className?: string
  title?: string
}

export const DataCarousel: React.FC<DataCarouselProps> = ({
  data,
  className,
  title
}) => {
  return (
    <EnhancedCarousel
      title={title}
      className={className}
      mobileItemsPerView={1}
      tabletItemsPerView={2}
      desktopItemsPerView={3}
      spacing="md"
    >
      {data.map((item) => (
        <div
          key={item.id}
          className={cn(
            "bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200",
            item.onClick && "cursor-pointer hover:border-blue-300",
            "h-full flex flex-col justify-between"
          )}
          onClick={item.onClick}
          style={{ borderLeftColor: item.color }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">{item.title}</span>
            {item.icon && <div className="text-slate-500">{item.icon}</div>}
          </div>
          
          <div className="text-2xl font-bold text-slate-900 mb-1">{item.value}</div>
          
          {item.subtitle && (
            <div className="text-sm text-slate-600">{item.subtitle}</div>
          )}
        </div>
      ))}
    </EnhancedCarousel>
  )
}

export default EnhancedCarousel 