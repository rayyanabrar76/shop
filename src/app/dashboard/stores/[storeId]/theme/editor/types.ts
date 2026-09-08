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
  carouselOnMobile: boolean
  bannerText: string
  showBanner: boolean
  logoUrl: string
  logoWidth: number
  logoHeight: number
  headerLayout: string
  menuPosition: string
  headerWidth: string
  headerHeight: string
  headerSticky: boolean
  headerBorderWidth: number
  headerBgColor: string
  headerTextColor: string
  utilityStyle: string
  headerTransparent: boolean
  headerInverseLogoUrl: string
  headerTransparentText: string
  footerText: string
  seoTitle: string
  seoDescription: string
  faviconUrl: string
  sectionOrder: string
  footerNewsletter: boolean
  footerNewsletterHeading: string
  footerNewsletterText: string
  footerShowLinks: boolean
  footerLogoUrl: string
  footerLogoWidth: number
  footerLogoHeight: number
  instagramHandle: string
  twitterHandle: string
  facebookUrl: string
  cardShadow: string
  dividerStyle: string
  shopAllLabel: string
  featuredLabel: string
  featuredLabelLevel: string
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
  cartBtnBgColor: string
  cartBtnTextColor: string
  cartBtnDisplay: string
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

/**
 * Field labels. Smaller and lighter than they were: 11px bold uppercase with
 * `tracking-widest` is a lot of emphasis for a caption, and with one on every
 * field the panel read as a stack of shouting rather than a form. 10px
 * semibold on a tighter track still separates label from value.
 */
export const labelCls =
  'text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-500 mb-1.5 block'
/**
 * Text inputs. The focus state used to be a slightly greyer border, which is
 * nearly invisible against the unfocused one — you could not tell which field
 * you were in. It now takes a near-black border plus a soft ring.
 */
export const inputCls =
  'w-full rounded-lg border border-(--admin-border) px-3 py-2 text-[13px] outline-none ' +
  'shadow-[0_1px_2px_rgba(9,9,11,0.03)] transition-[border-color,box-shadow] ' +
  'focus:border-(--admin-field-border-focus) focus:ring-2 focus:ring-zinc-900/5 dark:focus:ring-white/10 ' +
  'placeholder:text-zinc-300 dark:placeholder:text-zinc-600 ' +
  'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50'
export const sectionLabelCls = 'text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-3 flex items-center gap-1.5'

export const EDITOR_COLOR = '#18181b'