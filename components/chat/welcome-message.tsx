'use client'

import Image from 'next/image'

export function WelcomeMessage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="flex max-w-md flex-col items-center text-center">
        <Image
          src="/logo.png"
          alt="Mollei"
          width={80}
          height={80}
          className="mb-6 rounded-2xl"
          priority
        />

        <h1 className="mb-2 text-2xl font-semibold tracking-tight text-foreground">
          Welcome to Mollei
        </h1>

        <p className="mb-6 text-base leading-relaxed text-muted-foreground">
          I&apos;m an AI companion designed to listen and support you. Share
          what&apos;s on your mind — I&apos;m here to help you feel understood.
        </p>

        <div className="space-y-2 text-sm text-muted-foreground">
          <p className="flex items-center justify-center gap-2">
            <span aria-hidden="true" className="text-primary">
              ✦
            </span>
            <span>Your conversations are private</span>
          </p>
          <p className="flex items-center justify-center gap-2">
            <span aria-hidden="true" className="text-primary">
              ✦
            </span>
            <span>I remember our past conversations</span>
          </p>
          <p className="flex items-center justify-center gap-2">
            <span aria-hidden="true" className="text-primary">
              ✦
            </span>
            <span>I&apos;m AI, not a replacement for professional help</span>
          </p>
        </div>
      </div>
    </div>
  )
}
