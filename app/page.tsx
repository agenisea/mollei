import Image from 'next/image'

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <main className="flex flex-col items-center gap-6 text-center px-4">
        <Image
          src="/logo.png"
          alt="Mollei — emotionally intelligent AI companion"
          width={180}
          height={180}
          priority
          className="rounded-3xl"
        />
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-50">
            Mollei<sup className="text-xs font-normal align-super ml-0.5 text-zinc-400">™</sup>
          </h1>
          <p className="max-w-xs text-base text-zinc-400">
            Emotionally Intelligent AI Companion
          </p>
        </div>
      </main>
    </div>
  );
}
