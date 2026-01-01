import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Mollei™ - Emotionally Intelligent AI Companion'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0c1a24',
          backgroundImage:
            'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(77, 166, 217, 0.30) 0%, transparent 55%), radial-gradient(circle at 20% 80%, rgba(77, 166, 217, 0.22) 0%, transparent 45%), radial-gradient(circle at 80% 60%, rgba(77, 166, 217, 0.18) 0%, transparent 40%)',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
        }}
      >
        {/* Subtle grid pattern overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* Content container */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: -40,
          }}
        >
          {/* Glowing orb behind brand */}
          <div
            style={{
              position: 'absolute',
              width: 400,
              height: 400,
              borderRadius: '50%',
              background:
                'radial-gradient(circle, rgba(77, 166, 217, 0.15) 0%, transparent 70%)',
              filter: 'blur(40px)',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -60%)',
            }}
          />

          {/* Brand Name */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              fontSize: 140,
              fontWeight: 700,
              color: '#ffffff',
              letterSpacing: '-0.03em',
              textShadow: '0 4px 30px rgba(77, 166, 217, 0.3)',
            }}
          >
            <span>Mollei</span>
            <span
              style={{
                fontSize: 32,
                marginLeft: -2,
                marginTop: 28,
                opacity: 0.7,
              }}
            >
              {'\u2122'}
            </span>
          </div>

          {/* Primary Tagline */}
          <div
            style={{
              fontSize: 42,
              fontWeight: 500,
              color: '#ffffff',
              letterSpacing: '-0.01em',
              textAlign: 'center',
              marginTop: 8,
              opacity: 0.95,
            }}
          >
            Emotionally Intelligent AI Companion
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
