import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { loadStoreEntitlements } from '@/lib/entitlements'
import { sanitizeCustomCss, sanitizeCustomHead } from '@/lib/sanitize'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  const { storeId } = await params
  const theme = await prisma.storeTheme.findUnique({ where: { storeId } })
  return NextResponse.json(theme)
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { storeId } = await params
  const body = await req.json()

  const ent = await loadStoreEntitlements(storeId, userId)
  if (!ent) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const store = await prisma.store.findUnique({ where: { id: storeId } })
  if (!store) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Sanitize + plan-gate custom code
  const allowCustomCode = ent.plan.limits.customCodeAllowed
  const customCss  = body.customCss !== undefined
    ? (allowCustomCode ? sanitizeCustomCss(body.customCss) : '')
    : undefined
  const customHead = body.customHead !== undefined
    ? (allowCustomCode ? sanitizeCustomHead(body.customHead) : '')
    : undefined

  const data = {
    primaryColor:    body.primaryColor    ?? undefined,
    backgroundColor: body.backgroundColor ?? undefined,
    footerColor:     body.footerColor     ?? undefined,
    accentColor:     body.accentColor     ?? undefined,
    textColor:       body.textColor       ?? undefined,
    font:            body.font            ?? undefined,
    headingFont:     body.headingFont     ?? undefined,
    bannerText:      body.bannerText      ?? undefined,
    showBanner:      body.showBanner      ?? undefined,
    logoUrl:         body.logoUrl         ?? undefined,
    seoTitle:        body.seoTitle        ?? undefined,
    seoDescription:  body.seoDescription  ?? undefined,
    faviconUrl:      body.faviconUrl      ?? undefined,
    sectionOrder:    body.sectionOrder    ?? undefined,
    footerNewsletter:        body.footerNewsletter        ?? undefined,
    footerNewsletterHeading: body.footerNewsletterHeading ?? undefined,
    footerNewsletterText:    body.footerNewsletterText    ?? undefined,
    footerShowLinks:         body.footerShowLinks         ?? undefined,
    logoWidth:       body.logoWidth       ?? undefined,
    logoHeight:      body.logoHeight      ?? undefined,
    headerLayout:    body.headerLayout    ?? undefined,
    menuPosition: body.menuPosition ?? undefined,
    headerWidth: body.headerWidth ?? undefined,
    headerHeight: body.headerHeight ?? undefined,
    headerSticky: body.headerSticky ?? undefined,
    headerBorderWidth: body.headerBorderWidth ?? undefined,
    headerBgColor: body.headerBgColor ?? undefined,
    headerTextColor: body.headerTextColor ?? undefined,
    utilityStyle: body.utilityStyle ?? undefined,
    headerTransparent: body.headerTransparent ?? undefined,
    headerInverseLogoUrl: body.headerInverseLogoUrl ?? undefined,
    headerTransparentText: body.headerTransparentText ?? undefined,
    layout:          body.layout          ?? undefined,
    carouselOnMobile: body.carouselOnMobile ?? undefined,
    borderRadius:    body.borderRadius    ?? undefined,
    buttonStyle:     body.buttonStyle     ?? undefined,
    footerText:      body.footerText      ?? undefined,
    footerLogoUrl:   body.footerLogoUrl   ?? undefined,
    footerLogoWidth: body.footerLogoWidth ?? undefined,
    footerLogoHeight: body.footerLogoHeight ?? undefined,
    instagramHandle: body.instagramHandle ?? undefined,
    twitterHandle:   body.twitterHandle   ?? undefined,
    facebookUrl:     body.facebookUrl     ?? undefined,
    heroSlides:      body.heroSlides      ?? undefined,
    cardShadow:      body.cardShadow      ?? undefined,
    dividerStyle:    body.dividerStyle    ?? undefined,
    shopAllLabel:    body.shopAllLabel    ?? undefined,
    featuredLabel:   body.featuredLabel   ?? undefined,
    featuredLabelLevel: body.featuredLabelLevel ?? undefined,
    productGridBg:          body.productGridBg          ?? undefined,
    productImageRadius:     body.productImageRadius     ?? undefined,
    productGridButtonColor: body.productGridButtonColor ?? undefined,
    productGridTextColor:   body.productGridTextColor   ?? undefined,
    productGridFont:        body.productGridFont        ?? undefined,
    customCss,
    customHead,
    navLinks:    body.navLinks    ?? undefined,
    navFontSize: body.navFontSize ?? undefined,
    navCase:     body.navCase     ?? undefined,
    navDividers: body.navDividers ?? undefined,
    // Product title block
    productsPageHeading:      body.productsPageHeading      ?? undefined,
    productTitleWidth:        body.productTitleWidth        ?? undefined,
    productTitleMaxWidth:     body.productTitleMaxWidth     ?? undefined,
    productTitleAlign:        body.productTitleAlign        ?? undefined,
    productTitlePreset:       body.productTitlePreset       ?? undefined,
    productTitleBg:           body.productTitleBg           ?? undefined,
    productTitlePaddingTop:    body.productTitlePaddingTop    ?? undefined,
    productTitlePaddingBottom: body.productTitlePaddingBottom ?? undefined,
    productTitlePaddingLeft:   body.productTitlePaddingLeft   ?? undefined,
    productTitlePaddingRight:  body.productTitlePaddingRight  ?? undefined,
    // Product price block
    productPricePreset:       body.productPricePreset       ?? undefined,
    productPriceWidth:        body.productPriceWidth        ?? undefined,
    productPriceAlign:        body.productPriceAlign        ?? undefined,
    productPriceTextColor:    body.productPriceTextColor    ?? undefined,
    productPricePaddingTop:    body.productPricePaddingTop    ?? undefined,
    productPricePaddingBottom: body.productPricePaddingBottom ?? undefined,
    productPricePaddingLeft:   body.productPricePaddingLeft   ?? undefined,
    productPricePaddingRight:  body.productPricePaddingRight  ?? undefined,
    productPriceHidden:        body.productPriceHidden        ?? undefined,
    cartBtnRadius:             body.cartBtnRadius             ?? undefined,
    // Cart button block
    cartBtnLabel:         body.cartBtnLabel         ?? undefined,
    cartBtnBgColor:       body.cartBtnBgColor       ?? undefined,
    cartBtnTextColor:     body.cartBtnTextColor     ?? undefined,
    cartBtnDisplay:       body.cartBtnDisplay       ?? undefined,
    cartBtnShowIcon:      body.cartBtnShowIcon      ?? undefined,
    cartBtnWidth:         body.cartBtnWidth         ?? undefined,
    cartBtnFontSize:      body.cartBtnFontSize      ?? undefined,
    cartBtnPaddingTop:    body.cartBtnPaddingTop    ?? undefined,
    cartBtnPaddingBottom: body.cartBtnPaddingBottom ?? undefined,
    cartBtnPaddingLeft:   body.cartBtnPaddingLeft   ?? undefined,
    cartBtnPaddingRight:  body.cartBtnPaddingRight  ?? undefined,
    // Category filter
    catBackLabel:          body.catBackLabel          ?? undefined,
    catFilterRadius:       body.catFilterRadius       ?? undefined,
    catFilterFontSize:     body.catFilterFontSize     ?? undefined,
    catFilterFont:         body.catFilterFont         ?? undefined,
    catFilterCase:         body.catFilterCase         ?? undefined,
    catFilterActiveBg:     body.catFilterActiveBg     ?? undefined,
    catFilterActiveText:   body.catFilterActiveText   ?? undefined,
    catFilterInactiveBg:   body.catFilterInactiveBg   ?? undefined,
    catFilterInactiveText: body.catFilterInactiveText ?? undefined,
    catFilterPaddingX:     body.catFilterPaddingX     ?? undefined,
    catFilterPaddingY:     body.catFilterPaddingY     ?? undefined,
    catBackFont:           body.catBackFont           ?? undefined,
    catFilterFontWeight:   body.catFilterFontWeight   ?? undefined,
  }

  const theme = await prisma.storeTheme.upsert({
    where: { storeId },
    create: { storeId, ...data },
    update: data,
  })

  // Revalidate the entire storefront so saves reflect immediately
  revalidatePath(`/store/${store.subdomain}`, 'layout')

  return NextResponse.json(theme)
}