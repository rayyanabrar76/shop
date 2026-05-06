import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'

function base(content: string) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f4f4f5;color:#09090b}.wrap{max-width:560px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e4e4e7}.header{background:#000;padding:24px 32px}.header h1{color:#fff;font-size:18px;font-weight:700;letter-spacing:-0.5px}.body{padding:32px}.footer{padding:16px 32px;background:#f4f4f5;text-align:center;font-size:11px;color:#a1a1aa}h2{font-size:20px;font-weight:800;margin-bottom:8px;color:#09090b}p{font-size:14px;line-height:1.6;color:#3f3f46;margin-bottom:12px}.btn{display:inline-block;background:#000;color:#fff;padding:12px 24px;border-radius:10px;font-size:14px;font-weight:700;text-decoration:none;margin:8px 0}.table{width:100%;border-collapse:collapse;margin:16px 0}.table th{text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#a1a1aa;padding:8px 0;border-bottom:1px solid #f4f4f5}.table td{padding:10px 0;font-size:13px;border-bottom:1px solid #f4f4f5;color:#09090b}.total{font-weight:800;font-size:16px}.divider{border:none;border-top:1px solid #f4f4f5;margin:20px 0}.label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#a1a1aa;margin-bottom:4px}</style></head><body><div class="wrap"><div class="header"><h1>ShopFlow</h1></div><div class="body">${content}</div><div class="footer">Powered by ShopFlow · You received this because you made a purchase or created an account.</div></div></body></html>`
}

export async function sendOrderConfirmation({
  to, storeName, orderId, items, subtotal, discountAmount, shippingAmount, taxAmount, total,
  customerName, address, city, country, paymentMethod,
}: {
  to: string
  storeName: string
  orderId: string
  items: { title: string; quantity: number; price: number }[]
  subtotal: number
  discountAmount?: number
  shippingAmount?: number
  taxAmount?: number
  total: number
  customerName: string
  address: string
  city: string
  country?: string
  paymentMethod: string
}) {
  const itemRows = items.map(i =>
    `<tr><td>${i.title} <span style="color:#a1a1aa">×${i.quantity}</span></td><td style="text-align:right">$${((i.price * i.quantity) / 100).toFixed(2)}</td></tr>`
  ).join('')

  const extras = [
    discountAmount && discountAmount > 0 ? `<tr><td style="color:#10b981">Discount</td><td style="text-align:right;color:#10b981">-$${(discountAmount / 100).toFixed(2)}</td></tr>` : '',
    shippingAmount !== undefined ? `<tr><td>Shipping</td><td style="text-align:right">${shippingAmount === 0 ? 'Free' : `$${(shippingAmount / 100).toFixed(2)}`}</td></tr>` : '',
    taxAmount && taxAmount > 0 ? `<tr><td>Tax</td><td style="text-align:right">$${(taxAmount / 100).toFixed(2)}</td></tr>` : '',
  ].join('')

  const html = base(`
    <h2>Order Confirmed!</h2>
    <p>Hi ${customerName}, thank you for your order from <strong>${storeName}</strong>. We've received your order and it's being processed.</p>
    <hr class="divider">
    <div class="label">Order #${orderId.slice(-8).toUpperCase()}</div>
    <table class="table">
      <thead><tr><th>Item</th><th style="text-align:right">Price</th></tr></thead>
      <tbody>
        ${itemRows}
        ${extras}
        <tr><td class="total">Total</td><td class="total" style="text-align:right">$${(total / 100).toFixed(2)}</td></tr>
      </tbody>
    </table>
    <hr class="divider">
    <div class="label">Shipping To</div>
    <p style="margin-top:6px">${customerName}<br>${address}<br>${city}${country ? `, ${country}` : ''}</p>
    <hr class="divider">
    <p><span class="label">Payment</span><br><span style="margin-top:4px;display:block">${paymentMethod === 'cod' ? 'Cash on Delivery' : 'Card Payment'}</span></p>
  `)

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Order confirmed – ${storeName}`,
    html,
  })
}

export async function sendNewOrderAlert({
  to, storeName, orderId, customerName, customerEmail, total, itemCount,
}: {
  to: string
  storeName: string
  orderId: string
  customerName: string
  customerEmail: string
  total: number
  itemCount: number
}) {
  const html = base(`
    <h2>New Order 🎉</h2>
    <p>You have a new order on <strong>${storeName}</strong>.</p>
    <hr class="divider">
    <table class="table">
      <tbody>
        <tr><td class="label">Order ID</td><td>#${orderId.slice(-8).toUpperCase()}</td></tr>
        <tr><td class="label">Customer</td><td>${customerName} (${customerEmail})</td></tr>
        <tr><td class="label">Items</td><td>${itemCount} item${itemCount !== 1 ? 's' : ''}</td></tr>
        <tr><td class="label">Total</td><td class="total">$${(total / 100).toFixed(2)}</td></tr>
      </tbody>
    </table>
  `)

  await resend.emails.send({
    from: FROM,
    to,
    subject: `New order $${(total / 100).toFixed(2)} – ${storeName}`,
    html,
  })
}

export async function sendWelcomeEmail({
  to, storeName, customerName, subdomain,
}: {
  to: string
  storeName: string
  customerName?: string | null
  subdomain: string
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const html = base(`
    <h2>Welcome${customerName ? `, ${customerName}` : ''}!</h2>
    <p>You've created an account at <strong>${storeName}</strong>. You can now track your orders and manage your profile.</p>
    <a class="btn" href="${appUrl}/store/${subdomain}/account">View My Account</a>
  `)

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Welcome to ${storeName}`,
    html,
  })
}

export async function sendPasswordReset({
  to, storeName, subdomain, token,
}: {
  to: string
  storeName: string
  subdomain: string
  token: string
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const resetUrl = `${appUrl}/store/${subdomain}/forgot-password?token=${token}`

  const html = base(`
    <h2>Reset Your Password</h2>
    <p>We received a request to reset your password for your <strong>${storeName}</strong> account. Click the button below to set a new password. This link expires in 1 hour.</p>
    <a class="btn" href="${resetUrl}">Reset Password</a>
    <hr class="divider">
    <p style="font-size:12px;color:#a1a1aa">If you didn't request this, you can safely ignore this email.</p>
  `)

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Reset your password – ${storeName}`,
    html,
  })
}
