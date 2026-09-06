import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white pt-16 pb-8">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
          <Link href="/" className="text-2xl font-black tracking-tighter text-gray-900">
            Shopflow<span className="text-violet-600">.</span>
          </Link>
          <div className="flex gap-8 text-sm font-medium text-gray-500">
            <Link href="/terms" className="hover:text-gray-900 transition">Terms</Link>
            <Link href="/privacy" className="hover:text-gray-900 transition">Privacy</Link>
            <a href="mailto:hello@shopflow.app" className="hover:text-gray-900 transition">Contact</a>
          </div>
        </div>
        <div className="text-center text-gray-400 text-sm">
          © {new Date().getFullYear()} Shopflow. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
