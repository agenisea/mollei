'use client'

import * as React from 'react'
import Image from 'next/image'
import { User } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface AvatarProps {
  src?: string | null
  alt?: string
  fallback?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'h-6 w-6 text-xs',
  md: 'h-8 w-8 text-sm',
  lg: 'h-10 w-10 text-base',
} as const

const imageSizes = {
  sm: 24,
  md: 32,
  lg: 40,
} as const

export function Avatar({
  src,
  alt = '',
  fallback,
  size = 'md',
  className,
}: AvatarProps) {
  const [hasError, setHasError] = React.useState(false)

  const showImage = src && !hasError
  const initials = fallback?.slice(0, 2).toUpperCase()

  return (
    <div
      className={cn(
        'relative flex shrink-0 items-center justify-center overflow-hidden rounded-full',
        'bg-muted text-muted-foreground',
        sizeClasses[size],
        className
      )}
    >
      {showImage ? (
        <Image
          src={src}
          alt={alt}
          width={imageSizes[size]}
          height={imageSizes[size]}
          className="aspect-square h-full w-full object-cover"
          onError={() => setHasError(true)}
        />
      ) : initials ? (
        <span className="font-medium">{initials}</span>
      ) : (
        <User className="h-1/2 w-1/2" aria-hidden="true" />
      )}
    </div>
  )
}

interface MolleiAvatarProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function MolleiAvatar({ size = 'md', className }: MolleiAvatarProps) {
  return (
    <Avatar
      src="/logo.png"
      alt="Mollei"
      size={size}
      className={cn('bg-background', className)}
    />
  )
}

interface UserAvatarProps {
  name?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function UserAvatar({ name, size = 'md', className }: UserAvatarProps) {
  return (
    <Avatar
      fallback={name || 'U'}
      size={size}
      className={cn('bg-primary/10 text-primary', className)}
    />
  )
}
