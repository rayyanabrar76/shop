export interface Template {
  id: string
  name: string
  description: string
  emoji: string
  theme: {
    primaryColor: string
    backgroundColor: string
    footerColor: string
    accentColor: string
    textColor: string
    font: string
    headingFont: string
    borderRadius: string
    buttonStyle: string
    layout: string
    bannerText: string
    showBanner: boolean
    footerText: string
  }
}

export const templates: Template[] = [
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean, white, and distraction-free',
    emoji: '⬜',
    theme: {
      primaryColor: '#18181b',
      backgroundColor: '#ffffff',
      footerColor: '#f4f4f5',
      accentColor: '#18181b',
      textColor: '#09090b',
      font: 'sans',
      headingFont: 'sans',
      borderRadius: '0.5rem',
      buttonStyle: 'solid',
      layout: 'grid',
      bannerText: 'Free shipping on orders over $50',
      showBanner: false,
      footerText: '© 2025 All rights reserved.',
    },
  },
  {
    id: 'luxury',
    name: 'Luxury',
    description: 'Elegant gold tones for premium brands',
    emoji: '✨',
    theme: {
      primaryColor: '#b8860b',
      backgroundColor: '#0f0f0f',
      footerColor: '#1a1a1a',
      accentColor: '#d4af37',
      textColor: '#f5f0e8',
      font: 'serif',
      headingFont: 'serif',
      borderRadius: '0.25rem',
      buttonStyle: 'outline',
      layout: 'grid',
      bannerText: 'Exclusive collection, limited availability',
      showBanner: true,
      footerText: 'Crafted with excellence.',
    },
  },
  {
    id: 'vibrant',
    name: 'Vibrant',
    description: 'Bold colors for lifestyle brands',
    emoji: '🌈',
    theme: {
      primaryColor: '#7c3aed',
      backgroundColor: '#fafafa',
      footerColor: '#f3e8ff',
      accentColor: '#4f46e5',
      textColor: '#1e1b4b',
      font: 'sans',
      headingFont: 'sans',
      borderRadius: '1.5rem',
      buttonStyle: 'solid',
      layout: 'grid',
      bannerText: '🎉 New arrivals just dropped!',
      showBanner: true,
      footerText: 'Made with love.',
    },
  },
  {
    id: 'natural',
    name: 'Natural',
    description: 'Earthy tones for organic brands',
    emoji: '🌿',
    theme: {
      primaryColor: '#4a7c59',
      backgroundColor: '#faf8f5',
      footerColor: '#e8e0d5',
      accentColor: '#2d5a3d',
      textColor: '#2c2416',
      font: 'serif',
      headingFont: 'serif',
      borderRadius: '0.75rem',
      buttonStyle: 'solid',
      layout: 'grid',
      bannerText: '🌱 Sustainably made, ethically sourced',
      showBanner: true,
      footerText: 'Good for you, good for the planet.',
    },
  },
  {
    id: 'bold',
    name: 'Bold',
    description: 'High contrast for streetwear brands',
    emoji: '🔥',
    theme: {
      primaryColor: '#ef4444',
      backgroundColor: '#09090b',
      footerColor: '#18181b',
      accentColor: '#ffffff',
      textColor: '#ffffff',
      font: 'sans',
      headingFont: 'sans',
      borderRadius: '0px',
      buttonStyle: 'solid',
      layout: 'grid',
      bannerText: '🔥 Limited drops, grab yours now',
      showBanner: true,
      footerText: 'No limits.',
    },
  },
  {
    id: 'soft',
    name: 'Soft',
    description: 'Pastel tones for beauty and lifestyle',
    emoji: '🌸',
    theme: {
      primaryColor: '#ec4899',
      backgroundColor: '#fff5f7',
      footerColor: '#fce7f3',
      accentColor: '#be185d',
      textColor: '#4a1942',
      font: 'sans',
      headingFont: 'serif',
      borderRadius: '1.5rem',
      buttonStyle: 'solid',
      layout: 'grid',
      bannerText: '🌸 Self care starts here',
      showBanner: true,
      footerText: 'Beauty for everyone.',
    },
  },
]