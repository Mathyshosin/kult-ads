import Link from "next/link";
import Image from "next/image";
import { KultLogoFull, KultLogoIcon } from "@/components/kult-logo";
import { ArrowRight, Check, ChevronDown, Minus } from "lucide-react";

/* ─────────────────────── NAVBAR ─────────────────────── */

function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-black/5">
      <div className="max-w-[1400px] mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" aria-label="Accueil">
          <KultLogoFull />
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <a href="#comment-ca-marche" className="text-[13px] text-black/40 hover:text-black transition-colors font-medium tracking-wide uppercase">
            Fonctionnement
          </a>
          <a href="#tarifs" className="text-[13px] text-black/40 hover:text-black transition-colors font-medium tracking-wide uppercase">
            Tarifs
          </a>
        </div>

        <div className="flex items-center gap-6">
          <Link href="/login" className="hidden sm:inline text-[13px] text-black/50 hover:text-black transition-colors font-medium">
            Connexion
          </Link>
          <Link
            href="/signup"
            className="text-[13px] font-semibold text-white bg-black px-5 py-2 hover:bg-black/80 transition-colors"
          >
            Commencer
          </Link>
        </div>
      </div>
    </nav>
  );
}

/* ─────────────────────── HERO ─────────────────────── */

function Hero() {
  return (
    <section className="pt-32 pb-8 px-6 bg-white">
      <div className="max-w-[1400px] mx-auto">
        {/* Headline — left-aligned, massive */}
        <div className="max-w-4xl">
          <h1 className="text-[clamp(2.5rem,7vw,6rem)] font-black text-black leading-[0.92] tracking-tight">
            Vos concurrents
            <br />
            ont de meilleures
            <br />
            <span className="text-[#FF6B35]">pubs</span> que vous.
          </h1>
          <p className="mt-8 text-lg md:text-xl text-black/40 max-w-lg leading-relaxed font-light">
            Collez votre URL. On analyse votre marque. 30 secondes plus tard, vous avez une pub qui claque. La premi&egrave;re est offerte.
          </p>
          <div className="mt-10 flex items-center gap-6">
            <Link
              href="/signup"
              className="inline-flex items-center gap-3 bg-black text-white font-semibold px-8 py-4 text-base hover:bg-black/80 transition-colors"
            >
              Cr&eacute;er ma premi&egrave;re pub
              <ArrowRight className="w-4 h-4" />
            </Link>
            <span className="text-sm text-black/30 font-mono">Gratuit, sans CB</span>
          </div>
        </div>

        {/* Before / After — side by side, big */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* BEFORE — the template */}
          <div className="relative">
            <div className="absolute -top-3 left-4 bg-black text-white text-[10px] font-bold tracking-widest uppercase px-3 py-1 z-10">
              Avant
            </div>
            <div className="relative aspect-square border border-black/10 overflow-hidden">
              <Image src="/after.png" alt="Template g&eacute;n&eacute;rique" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
            </div>
            <p className="mt-2 text-[11px] text-black/30 font-mono tracking-wide">Template d&apos;inspiration</p>
          </div>

          {/* AFTER — the generated ad */}
          <div className="relative">
            <div className="absolute -top-3 left-4 bg-[#FF6B35] text-white text-[10px] font-bold tracking-widest uppercase px-3 py-1 z-10">
              Apr&egrave;s
            </div>
            <div className="relative aspect-square border border-black/10 overflow-hidden">
              <Image src="/before.png" alt="Publicit&eacute; g&eacute;n&eacute;r&eacute;e par kultads" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
            </div>
            <p className="mt-2 text-[11px] text-black/30 font-mono tracking-wide">Votre publicit&eacute; — 30 secondes</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────── BOLD STAT ─────────────────────── */

function BoldStat() {
  return (
    <section className="py-24 px-6 bg-white border-t border-black/5">
      <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-baseline gap-6 md:gap-16">
        <span className="text-[clamp(4rem,12vw,10rem)] font-black text-black leading-none tracking-tighter font-mono">
          500+
        </span>
        <div className="max-w-md">
          <p className="text-black/40 text-lg leading-relaxed font-light">
            publicit&eacute;s g&eacute;n&eacute;r&eacute;es. Biblioth&egrave;que d&apos;ads gagnantes mise &agrave; jour chaque jour. Pas du stock — du sur-mesure.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────── HOW IT WORKS ─────────────────────── */

function HowItWorks() {
  const steps = [
    {
      num: "01",
      title: "Collez votre URL",
      desc: "On r\u00e9cup\u00e8re votre logo, vos produits, vos couleurs, votre ton. Pas besoin de brief.",
    },
    {
      num: "02",
      title: "Choisissez un style",
      desc: "Parcourez la biblioth\u00e8que d\u2019ads gagnantes ou uploadez votre propre r\u00e9f\u00e9rence.",
    },
    {
      num: "03",
      title: "G\u00e9n\u00e9rez en 1 clic",
      desc: "30 secondes. Votre pub est pr\u00eate. Format carr\u00e9 ou story. Modifiable par prompt.",
    },
  ];

  return (
    <section id="comment-ca-marche" className="py-24 px-6 bg-[#FAFAFA]">
      <div className="max-w-[1400px] mx-auto">
        <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-black/30 mb-12">
          Comment &ccedil;a marche
        </p>

        <div className="space-y-0">
          {steps.map((step, i) => (
            <div key={step.num} className={`flex flex-col md:flex-row items-start gap-6 md:gap-16 py-12 ${i < steps.length - 1 ? "border-b border-black/5" : ""}`}>
              <span className="text-6xl md:text-8xl font-black text-black/[0.04] leading-none font-mono shrink-0 select-none">
                {step.num}
              </span>
              <div className="max-w-lg">
                <h3 className="text-2xl md:text-3xl font-bold text-black mb-3">
                  {step.title}
                </h3>
                <p className="text-black/40 text-base leading-relaxed font-light">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────── WHY KULTADS ─────────────────────── */

function WhyKultads() {
  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-[1400px] mx-auto">
        <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-black/30 mb-6">
          Pourquoi kultads
        </p>
        <h2 className="text-3xl md:text-5xl font-black text-black leading-tight max-w-2xl mb-20">
          Pas juste un g&eacute;n&eacute;rateur d&apos;images.
          <br />
          <span className="text-black/20">Un syst&egrave;me qui comprend votre marque.</span>
        </h2>

        {/* Alternating left/right blocks */}
        <div className="space-y-20">
          {/* Block 1 */}
          <div className="flex flex-col md:flex-row items-start gap-8 md:gap-20">
            <div className="md:w-1/3 shrink-0">
              <span className="text-[#FF6B35] text-sm font-bold font-mono">4 modes</span>
              <h3 className="text-xl font-bold text-black mt-2 mb-3">Cr&eacute;ation flexible</h3>
              <p className="text-black/40 leading-relaxed font-light text-[15px]">
                Auto, Biblioth&egrave;que, Copy-Ads ou Prompt libre. Chaque mode r&eacute;pond &agrave; un workflow diff&eacute;rent. Vous choisissez le niveau de contr&ocirc;le.
              </p>
            </div>
            <div className="md:w-1/3 shrink-0 md:mt-16">
              <span className="text-[#FF6B35] text-sm font-bold font-mono">Carr&eacute; + Story</span>
              <h3 className="text-xl font-bold text-black mt-2 mb-3">Tous les formats</h3>
              <p className="text-black/40 leading-relaxed font-light text-[15px]">
                G&eacute;n&eacute;rez en 1:1 pour le feed ou en 9:16 pour les stories. Convertissez de l&apos;un &agrave; l&apos;autre en un clic.
              </p>
            </div>
            <div className="md:w-1/3 shrink-0">
              <span className="text-[#FF6B35] text-sm font-bold font-mono">&ldquo;Change le fond en rouge&rdquo;</span>
              <h3 className="text-xl font-bold text-black mt-2 mb-3">Modification par prompt</h3>
              <p className="text-black/40 leading-relaxed font-light text-[15px]">
                Pas de Photoshop. &Eacute;crivez ce que vous voulez changer en fran&ccedil;ais. L&apos;IA applique.
              </p>
            </div>
          </div>

          {/* Block 2 — library */}
          <div className="border-t border-black/5 pt-20 flex flex-col md:flex-row items-start gap-8 md:gap-20">
            <div className="md:w-2/5 shrink-0">
              <span className="text-[#FF6B35] text-sm font-bold font-mono">Mise &agrave; jour quotidienne</span>
              <h3 className="text-2xl md:text-3xl font-bold text-black mt-2 mb-4">
                Biblioth&egrave;que d&apos;ads qui marchent vraiment
              </h3>
              <p className="text-black/40 leading-relaxed font-light text-[15px] max-w-sm">
                On analyse les pubs les plus performantes du march&eacute;, chaque jour. Vous piochez dedans pour vous inspirer. Pas du th&eacute;orique, du test&eacute;.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────── BEFORE/AFTER ANIMATED ─────────────────────── */

function BeforeAfterAnimated() {
  return (
    <section className="py-24 px-6 bg-[#FAFAFA]">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-12">
          <div>
            <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-black/30 mb-4">
              Le r&eacute;sultat
            </p>
            <h2 className="text-3xl md:text-4xl font-black text-black">
              Template &rarr; Votre pub
            </h2>
          </div>
          <p className="text-sm text-black/30 font-light max-w-xs">
            L&apos;animation montre la transformation en temps r&eacute;el. M&ecirc;me layout, votre marque.
          </p>
        </div>

        <div className="max-w-xl mx-auto">
          <div className="relative aspect-square overflow-hidden border border-black/10">
            {/* Before (Template) */}
            <div className="absolute inset-0">
              <Image src="/after.png" alt="Template d&apos;inspiration" fill className="object-cover" sizes="600px" />
            </div>

            {/* After (Generated) */}
            <div className="absolute inset-0 hero-after-slide">
              <Image src="/before.png" alt="Publicit&eacute; g&eacute;n&eacute;r&eacute;e" fill className="object-cover" sizes="600px" />
            </div>

            {/* Slider line */}
            <div className="absolute inset-0 flex items-center pointer-events-none hero-slider-line z-20">
              <div className="w-[2px] h-full bg-white/80" />
            </div>

            {/* Labels */}
            <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 z-10">
              Template
            </div>
            <div className="absolute bottom-4 right-4 bg-[#FF6B35]/90 backdrop-blur-sm text-white text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 z-10">
              G&eacute;n&eacute;r&eacute;
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────── DAILY GIFT ─────────────────────── */

function DailyGift() {
  return (
    <section className="py-20 px-6 bg-white border-t border-black/5">
      <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-start gap-10 md:gap-20">
        <div className="shrink-0">
          <span className="text-6xl md:text-8xl font-black text-[#FF6B35] leading-none select-none">
            1/jour
          </span>
        </div>
        <div className="max-w-lg">
          <h3 className="text-2xl font-bold text-black mb-3">
            Un cadeau chaque matin
          </h3>
          <p className="text-black/40 leading-relaxed font-light">
            Les abonn&eacute;s Pro et Agency re&ccedil;oivent automatiquement une pub g&eacute;n&eacute;r&eacute;e chaque jour, adapt&eacute;e &agrave; leur marque. Ouvrez l&apos;app, votre pub vous attend. Pas d&apos;action requise.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────── PRICING ─────────────────────── */

function Pricing() {
  return (
    <section id="tarifs" className="py-24 px-6 bg-[#FAFAFA]">
      <div className="max-w-[1400px] mx-auto">
        <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-black/30 mb-4">
          Tarifs
        </p>
        <h2 className="text-3xl md:text-4xl font-black text-black mb-4">
          Simple. Pas de surprise.
        </h2>
        <p className="text-black/40 font-light mb-16 max-w-md">
          Commencez gratuitement. Passez Pro quand vous &ecirc;tes convaincu.
        </p>

        {/* Pricing — horizontal table-like layout */}
        <div className="border border-black/10 divide-y divide-black/5 bg-white">
          {/* Starter */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-8 md:p-10 gap-6">
            <div className="md:w-1/4">
              <h3 className="text-lg font-bold text-black">Starter</h3>
              <p className="text-sm text-black/30 mt-1">Pour tester</p>
            </div>
            <div className="md:w-1/4">
              <span className="text-4xl font-black text-black font-mono">0&euro;</span>
            </div>
            <ul className="md:w-1/3 space-y-1.5 text-sm text-black/50">
              <li className="flex items-center gap-2"><Minus className="w-3 h-3 text-black/20" /> 1 pub offerte</li>
              <li className="flex items-center gap-2"><Minus className="w-3 h-3 text-black/20" /> Biblioth&egrave;que limit&eacute;e</li>
              <li className="flex items-center gap-2"><Minus className="w-3 h-3 text-black/20" /> Format carr&eacute; uniquement</li>
            </ul>
            <div className="md:w-auto">
              <Link href="/signup" className="inline-block text-sm font-semibold text-black border border-black/20 px-6 py-2.5 hover:bg-black hover:text-white transition-colors">
                Commencer
              </Link>
            </div>
          </div>

          {/* Pro — highlighted */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-8 md:p-10 gap-6 bg-black text-white relative">
            <div className="absolute top-0 right-0 bg-[#FF6B35] text-white text-[10px] font-bold tracking-widest uppercase px-4 py-1.5">
              Populaire
            </div>
            <div className="md:w-1/4">
              <h3 className="text-lg font-bold">Pro</h3>
              <p className="text-sm text-white/40 mt-1">Pour les e-commerces ambitieux</p>
            </div>
            <div className="md:w-1/4">
              <span className="text-4xl font-black font-mono">29&euro;</span>
              <span className="text-white/40 text-sm">/mois</span>
            </div>
            <ul className="md:w-1/3 space-y-1.5 text-sm text-white/60">
              <li className="flex items-center gap-2"><Check className="w-3 h-3 text-[#FF6B35]" /> Cr&eacute;ations illimit&eacute;es</li>
              <li className="flex items-center gap-2"><Check className="w-3 h-3 text-[#FF6B35]" /> Carr&eacute; + Story</li>
              <li className="flex items-center gap-2"><Check className="w-3 h-3 text-[#FF6B35]" /> Modification par prompt</li>
              <li className="flex items-center gap-2"><Check className="w-3 h-3 text-[#FF6B35]" /> 1 pub offerte / jour</li>
              <li className="flex items-center gap-2"><Check className="w-3 h-3 text-[#FF6B35]" /> Biblioth&egrave;que compl&egrave;te</li>
            </ul>
            <div className="md:w-auto">
              <Link href="/signup" className="inline-block text-sm font-semibold text-black bg-white px-6 py-2.5 hover:bg-white/90 transition-colors">
                Essayer gratuitement
              </Link>
            </div>
          </div>

          {/* Agency */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-8 md:p-10 gap-6">
            <div className="md:w-1/4">
              <h3 className="text-lg font-bold text-black">Agency</h3>
              <p className="text-sm text-black/30 mt-1">Multi-marques &amp; agences</p>
            </div>
            <div className="md:w-1/4">
              <span className="text-4xl font-black text-black font-mono">79&euro;</span>
              <span className="text-black/30 text-sm">/mois</span>
            </div>
            <ul className="md:w-1/3 space-y-1.5 text-sm text-black/50">
              <li className="flex items-center gap-2"><Check className="w-3 h-3 text-[#FF6B35]" /> Tout le plan Pro</li>
              <li className="flex items-center gap-2"><Check className="w-3 h-3 text-[#FF6B35]" /> Multi-marques</li>
              <li className="flex items-center gap-2"><Check className="w-3 h-3 text-[#FF6B35]" /> Acc&egrave;s API</li>
              <li className="flex items-center gap-2"><Check className="w-3 h-3 text-[#FF6B35]" /> Support d&eacute;di&eacute;</li>
            </ul>
            <div className="md:w-auto">
              <Link href="/signup" className="inline-block text-sm font-semibold text-black border border-black/20 px-6 py-2.5 hover:bg-black hover:text-white transition-colors">
                Essayer gratuitement
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────── FAQ ─────────────────────── */

function FAQ() {
  const questions = [
    {
      q: "C\u2019est quoi kultads, en une phrase ?",
      a: "Vous collez l\u2019URL de votre site, notre IA analyse votre marque et g\u00e9n\u00e8re une publicit\u00e9 professionnelle en 30 secondes, inspir\u00e9e des meilleures ads du march\u00e9.",
    },
    {
      q: "Quels formats sont disponibles ?",
      a: "Carr\u00e9 (1:1) pour le feed Instagram/Facebook et story (9:16) pour les Reels et stories. Conversion de l\u2019un \u00e0 l\u2019autre en un clic.",
    },
    {
      q: "Je peux modifier une pub apr\u00e8s g\u00e9n\u00e9ration ?",
      a: "Oui. \u00c9crivez ce que vous voulez changer en texte libre (\u00ab change le fond en rouge \u00bb, \u00ab ajoute un badge -30% \u00bb) et l\u2019IA applique.",
    },
    {
      q: "C\u2019est l\u00e9gal ?",
      a: "Les publicit\u00e9s g\u00e9n\u00e9r\u00e9es sont originales et cr\u00e9\u00e9es pour votre marque. Vous en \u00eates propri\u00e9taire et pouvez les utiliser librement.",
    },
    {
      q: "C\u2019est quoi le cadeau quotidien ?",
      a: "Les abonn\u00e9s Pro et Agency re\u00e7oivent chaque jour une pub g\u00e9n\u00e9r\u00e9e automatiquement, adapt\u00e9e \u00e0 leur marque. Sans rien faire.",
    },
    {
      q: "Combien de temps pour g\u00e9n\u00e9rer une pub ?",
      a: "30 secondes en moyenne. Collez votre URL, choisissez un style, c\u2019est pr\u00eat.",
    },
  ];

  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-[1400px] mx-auto">
        <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-black/30 mb-4">
          FAQ
        </p>
        <h2 className="text-3xl md:text-4xl font-black text-black mb-16">
          Les questions qu&apos;on nous pose
        </h2>

        {/* Two-column FAQ — not accordions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-12">
          {questions.map((item) => (
            <div key={item.q} className="border-t border-black/5 pt-6">
              <h3 className="text-base font-bold text-black mb-3">
                {item.q}
              </h3>
              <p className="text-sm text-black/40 leading-relaxed font-light">
                {item.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────── FINAL CTA ─────────────────────── */

function FinalCTA() {
  return (
    <section className="py-32 px-6 bg-black">
      <div className="max-w-[1400px] mx-auto">
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-[0.95] tracking-tight max-w-3xl">
          On va changer &ccedil;a.
        </h2>
        <p className="mt-8 text-lg text-white/30 font-light max-w-md">
          Premi&egrave;re pub offerte. Sans carte bancaire. 30 secondes.
        </p>
        <div className="mt-12">
          <Link
            href="/signup"
            className="inline-flex items-center gap-3 bg-[#FF6B35] text-white font-semibold px-8 py-4 text-base hover:bg-[#FF6B35]/90 transition-colors"
          >
            Cr&eacute;er ma premi&egrave;re pub
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────── FOOTER ─────────────────────── */

function Footer() {
  return (
    <footer className="border-t border-white/10 py-8 px-6 bg-black">
      <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <KultLogoIcon className="w-7 h-7 opacity-50" />
        <div className="flex items-center gap-8 text-[12px] text-white/25">
          <Link href="/cgu" className="hover:text-white/60 transition-colors">
            CGU
          </Link>
          <a href="mailto:contact@kultads.com" className="hover:text-white/60 transition-colors">
            Contact
          </a>
        </div>
        <p className="text-[12px] text-white/20 font-mono">
          &copy; 2026 kultads
        </p>
      </div>
    </footer>
  );
}

/* ─────────────────────── PAGE ─────────────────────── */

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <BoldStat />
        <HowItWorks />
        <WhyKultads />
        <BeforeAfterAnimated />
        <DailyGift />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
