import { Store, Box, ShoppingCart, Zap, BarChart3, ShieldCheck } from 'lucide-react';

const features = [
  { icon: Store, title: 'Custom Storefront', desc: 'Get a beautiful, high-converting store up and running in minutes.' },
  { icon: Box, title: 'Inventory Sync', desc: 'Manage products, variants, and stock levels seamlessly from one hub.' },
  { icon: ShoppingCart, title: 'Optimized Checkout', desc: 'Frictionless built-in cart designed to maximize your conversion rates.' },
  { icon: Zap, title: 'Lightning Fast', desc: 'Built on edge infrastructure to ensure your store loads instantly.' },
  { icon: BarChart3, title: 'Deep Analytics', desc: 'Understand your customers with real-time sales and traffic data.' },
  { icon: ShieldCheck, title: 'Secure Payments', desc: 'Enterprise-grade security supporting all major payment gateways.' },
];

export default function Features() {
  return (
    <section id="features" className="py-32 bg-[#fdfdfc] border-t border-[#f5f5f2]">
      <div className="max-w-6xl mx-auto px-6">
        
        {/* Header - Minimalist & Centered */}
        <div className="text-center max-w-2xl mx-auto mb-20">
          <h2 className="text-3xl md:text-5xl font-semibold text-[#212121] mb-6 tracking-tight">
            Infrastructure for <br />
            <span className="text-[#6b6b6b]">modern commerce.</span>
          </h2>
          <p className="text-[15px] md:text-[17px] text-[#6b6b6b] leading-relaxed font-medium">
            Shopflow handles the underlying complexity of global trade, 
            allowing you to focus entirely on your craft.
          </p>
        </div>
        
        {/* Bento-ish Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <div 
              key={i} 
              className="group p-8 bg-white border border-[#e8e8e3] rounded-4xl hover:bg-[#f9f9f7] transition-all duration-500 ease-out shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
            >
              {/* Icon - Carbon & Stone Style */}
              <div className="w-10 h-10 bg-[#f3f3ee] border border-[#e8e8e3] text-[#212121] rounded-xl flex items-center justify-center mb-8 group-hover:bg-[#212121] group-hover:text-white transition-all duration-300">
                <f.icon className="w-5 h-5 stroke-[1.5]" />
              </div>

              {/* Text - Smaller & High Density */}
              <h3 className="text-[15px] font-bold text-[#212121] mb-3 tracking-tight">
                {f.title}
              </h3>
              <p className="text-[14px] text-[#6b6b6b] leading-relaxed font-medium">
                {f.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Subtle Footer Note */}
        <div className="mt-16 text-center">
          <p className="text-[12px] font-bold text-[#a1a1a1] uppercase tracking-[0.2em]">
            Trusted by 50,000+ creators worldwide
          </p>
        </div>
      </div>
    </section>
  );
}