'use client'

interface SectionDividerProps {
  style: string
  primaryColor: string
}

export default function SectionDivider({ style, primaryColor }: SectionDividerProps) {
  if (style === 'none' || !style) return null

  if (style === 'solid') {
    return (
      <div className="w-full px-4 md:px-8 max-w-7xl mx-auto">
        <div className="h-px w-full" style={{ backgroundColor: 'var(--store-divider, rgba(0,0,0,0.08))' }} />
      </div>
    )
  }

  if (style === 'dotted') {
    return (
      <div className="w-full px-4 md:px-8 max-w-7xl mx-auto">
        <div className="h-px w-full border-t-2 border-dashed" style={{ borderColor: 'var(--store-divider, rgba(0,0,0,0.10))' }} />
      </div>
    )
  }

  if (style === 'animated') {
    return (
      <>
        <style>{`
          @keyframes shimmer {
            0%   { background-position: -200% center; }
            100% { background-position: 200% center; }
          }
          .divider-animated {
            background: linear-gradient(
              90deg,
              transparent 0%,
              ${primaryColor}44 25%,
              ${primaryColor} 50%,
              ${primaryColor}44 75%,
              transparent 100%
            );
            background-size: 200% auto;
            animation: shimmer 2.5s linear infinite;
          }
        `}</style>
        <div className="w-full px-4 md:px-8 max-w-7xl mx-auto">
          <div className="divider-animated h-0.5 w-full rounded-full" />
        </div>
      </>
    )
  }

  if (style === 'wave') {
    return (
      <>
        <style>{`
          @keyframes wave-move {
            0%   { background-position-x: 0px; }
            100% { background-position-x: 40px; }
          }
          .divider-wave {
            background-image: repeating-linear-gradient(
              90deg,
              ${primaryColor} 0px,
              ${primaryColor} 4px,
              transparent 4px,
              transparent 8px
            );
            animation: wave-move 0.8s linear infinite;
          }
        `}</style>
        <div className="w-full px-4 md:px-8 max-w-7xl mx-auto">
          <div className="divider-wave h-0.5 w-full" />
        </div>
      </>
    )
  }

  return null
}