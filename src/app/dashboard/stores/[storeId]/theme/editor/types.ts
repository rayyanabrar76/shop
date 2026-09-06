export interface NavLink {
  label: string
  href: string
}

export interface ThemeState {
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
  logoUrl: string
  logoWidth: number
  footerText: string
  instagramHandle: string
  twitterHandle: string
  facebookUrl: string
  cardShadow: string
  dividerStyle: string
  shopAllLabel: string
  featuredLabel: string
  productsPageHeading: string
  productGridBg: string
  productImageRadius: string
  productGridButtonColor: string
  productGridTextColor: string
  productGridFont: string
  customCss: string
  customHead: string
  // Product title block
  productTitleWidth: string
  productTitleAlign: string
  productTitlePreset: string
  productTitleBg: string
  productTitlePaddingTop: number
  productTitlePaddingBottom: number
  productTitlePaddingLeft: number
  productTitlePaddingRight: number
  // Product price block
  productPricePreset: string
  productPriceWidth: string
  productPriceAlign: string
  productPriceTextColor: string
  productPricePaddingTop: number
  productPricePaddingBottom: number
  productPricePaddingLeft: number
  productPricePaddingRight: number
  // Cart button block
  cartBtnLabel: string
  cartBtnShowIcon: boolean
  cartBtnWidth: string
  cartBtnFontSize: number
  cartBtnPaddingTop: number
  cartBtnPaddingBottom: number
  cartBtnPaddingLeft: number
  cartBtnPaddingRight: number
  // Navigation
  navLinks: NavLink[]
  navFontSize: number
  navCase: string
  navDividers: boolean
  // Dark mode
  darkMode: boolean
  showDarkToggle: boolean
  // Category filter / products page
  catBackLabel: string
  catFilterRadius: string
  catFilterFontSize: number
  catFilterFont: string
  catFilterCase: string
  catFilterActiveBg: string
  catFilterActiveText: string
  catFilterInactiveBg: string
  catFilterInactiveText: string
  catFilterPaddingX: number
  catFilterPaddingY: number
  catBackFont: string
  catFilterFontWeight: string
}

export const labelCls = 'text-[11px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1 block'
export const inputCls = 'w-full rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-all bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50'
export const sectionLabelCls = 'text-[11px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-3 flex items-center gap-1.5'

export const EDITOR_COLOR = '#18181b'