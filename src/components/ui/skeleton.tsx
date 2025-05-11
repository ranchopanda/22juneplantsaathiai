import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

// Card skeleton with shimmer effect
function CardSkeleton() {
  return (
    <div className="skeleton-card shimmer-effect">
      <div className="skeleton-image" />
      <div className="skeleton-content">
        <div className="skeleton-title" />
        <div className="skeleton-text w-full" />
        <div className="skeleton-text w-3/4" />
        <div className="skeleton-text w-1/2" />
        <div className="skeleton-button" />
      </div>
    </div>
  )
}

// Text shimmer loading
function TextSkeleton({ lines = 3, className = "" }: { lines?: number, className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          className={`h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'} shimmer-effect`} 
        />
      ))}
    </div>
  )
}

// Avatar or image placeholder
function ImageSkeleton({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "h-10 w-10",
    md: "h-16 w-16",
    lg: "h-24 w-24",
  }
  
  return (
    <Skeleton
      className={`${sizeClasses[size]} rounded-full shimmer-effect`}
    />
  )
}

export { Skeleton, CardSkeleton, TextSkeleton, ImageSkeleton }
