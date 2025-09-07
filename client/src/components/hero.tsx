import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

export function Hero() {
  return (
    <header id="about" className="relative pt-40 pb-32 bg-gradient-to-b from-white to-[hsl(var(--muted)/0.15)] dark:from-neutral-900 dark:to-neutral-950">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16,0.84,0.44,1] }}
          className="max-w-3xl"
        >
          <h1 className="font-bold tracking-tight text-[clamp(2.5rem,5vw,3.25rem)] text-neutral-900 dark:text-white mb-6">
            Ming Ma <span className="text-amber-600">PhD Candidate</span>
          </h1>
          <p className="text-lg leading-relaxed text-neutral-700 dark:text-neutral-300 max-w-prose">
            Researching <span className="font-medium text-amber-600">authoritarian governance</span>, <span className="font-medium text-amber-600">AI adoption</span>, and <span className="font-medium text-amber-600">political communication</span>. Combining computational methods, media analysis, and institutional perspectives.
          </p>
          <div className="flex flex-wrap gap-2 mt-6">
            {['Authoritarian Politics','AI & Governance','Media Narratives','Computational Methods'].map(tag => (
              <span key={tag} className="inline-flex items-center px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 text-xs font-medium tracking-wide">
                {tag}
              </span>
            ))}
          </div>
          <div className="flex gap-4 mt-10">
            <Button onClick={() => window.open('/maming_cv.pdf','_blank')} size="lg">Download CV</Button>
            <Button variant="outline" size="lg" onClick={() => document.querySelector('#publications')?.scrollIntoView({ behavior:'smooth'})}>
              Publications
            </Button>
          </div>
        </motion.div>
      </div>
    </header>
  );
}
