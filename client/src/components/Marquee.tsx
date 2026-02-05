import { motion } from "framer-motion";

interface MarqueeProps {
  items: string[];
  speed?: number;
}

export function Marquee({ items, speed = 10 }: MarqueeProps) {
  // Triple the items to ensure seamless loop
  const content = [...items, ...items, ...items];
  
  return (
    <div className="w-full bg-muted overflow-hidden py-3 border-y-2 border-black whitespace-nowrap">
      <div className="inline-block animate-marquee">
        {content.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-2 mx-8 text-black font-bold font-mono uppercase tracking-widest text-sm">
            {item} 
            <span className="bg-white text-black text-[10px] px-1 py-0.5 border border-black shadow-[2px_2px_0px_0px_#000]">
              50% Me Too
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
