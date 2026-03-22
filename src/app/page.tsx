import Link from "next/link";
import Image from "next/image";
import { KultLogoFull, KultLogoIcon } from "@/components/kult-logo";
import { ArrowRight, Check, Zap, Layers, MessageSquare, RefreshCw } from "lucide-react";

/* ─────────────────────── NAVBAR ─────────────────────── */

function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#faf8f5]/80 backdrop-blur-xl border-b border-[#1a1a2e]/5">
      <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" aria-label="Accueil">
          <KultLogoFull />
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <a href="#comment-ca-marche" className="text-[13px] text-[#1a1a2e]/40 hover:text-[#1a1a2e] transition-colors font-medium tracking-wide uppercase">
            Fonctionnement
          </a>
          <a href="#tarifs" className="text-[13px] text-[#1a1a2e]/40 hover:text-[#1a1a2e] transition-colors font-medium tracking-wide uppercase">
            Tarifs
          </a>
        </div>

        <div className="flex items-center gap-5">
          <Link href="/login" className="hidden sm:inline text-[13px] text-[#1a1a2e]/50 hover:text-[#1a1a2e] transition-colors font-medium">
            Connexion
          </Link>
          <Link
            href="/signup"
            className="text-[13px] font-semibold text-white bg-[#1a1a2e] px-5 py-2.5 rounded-full hover:bg-[#1a1a2e]/85 transition-all hover:shadow-lg hover:shadow-[#1a1a2e]/10"
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
    <section className="pt-36 pb-24 px-6 bg-[#faf8f5] overflow-hidden">
      <div className="max-w-[1400px] mx-auto">
        {/* Headline — centered, massive */}
        <div className="text-center max-w-4xl mx-auto">
          <p className="text-[13px] font-mono text-[#f97316] tracking-widest uppercase mb-6">
            Ads intelligence pour e-commerce
          </p>
          <h1 className="text-[clamp(2.5rem,7vw,5.5rem)] font-black text-[#1a1a2e] leading-[0.92] tracking-tight">
            Vos concurrents ont
            <br />
            de meilleures{" "}
            <span className="relative inline-block">
              <span className="relative z-10">pubs</span>
              <span className="absolute bottom-1 left-0 right-0 h-[0.3em] bg-[#f97316]/20 -z-0 rounded-full" />
            </span>{" "}
            que vous.
          </h1>
          <p className="mt-8 text-lg md:text-xl text-[#1a1a2e]/40 max-w-lg mx-auto leading-relaxed font-light">
            Collez votre URL. On analyse votre marque. 30 secondes plus tard, vous avez une pub qui claque.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-3 bg-[#f97316] text-white font-semibold px-8 py-4 text-base rounded-full hover:bg-[#ea580c] transition-all hover:shadow-xl hover:shadow-[#f97316]/20 hover:-translate-y-0.5"
            >
              Cr&eacute;er ma premi&egrave;re pub
              <ArrowRight className="w-4 h-4" />
            </Link>
            <span className="text-sm text-[#1a1a2e]/30 font-mono">Gratuit, sans CB</span>
          </div>
        </div>

        {/* Before / After — creative overlapping layout */}
        <div className="mt-24 flex justify-center">
          <div className="relative w-full max-w-3xl">
            {/* BEFORE — the template (slightly behind, rotated) */}
            <div className="relative w-[55%] z-10">
              <div className="absolute -top-3 left-4 bg-[#1a1a2e] text-white text-[10px] font-bold tracking-widest uppercase px-3 py-1 z-20 rounded-full">
                Avant
              </div>
              <div className="relative aspect-square rounded-2xl overflow-hidden shadow-2xl shadow-[#1a1a2e]/10 border border-[#1a1a2e]/5 -rotate-2 hover:rotate-0 transition-transform duration-500">
                <Image src="/after.png" alt="Template g&eacute;n&eacute;rique" fill className="object-cover" sizes="(max-width: 768px) 80vw, 400px" />
              </div>
              <p className="mt-3 text-[11px] text-[#1a1a2e]/25 font-mono tracking-wide pl-2">Template d&apos;inspiration</p>
            </div>

            {/* AFTER — the generated ad (overlapping, in front) */}
            <div className="absolute top-8 right-0 w-[55%] z-20">
              <div className="absolute -top-3 right-4 bg-[#f97316] text-white text-[10px] font-bold tracking-widest uppercase px-3 py-1 z-20 rounded-full">
                Apr&egrave;s
              </div>
              <div className="relative aspect-square rounded-2xl overflow-hidden shadow-2xl shadow-[#f97316]/15 border-2 border-[#f97316]/20 rotate-2 hover:rotate-0 transition-transform duration-500">
                <Image src="/before.png" alt="Publicit&eacute; g&eacute;n&eacute;r&eacute;e par kultads" fill className="object-cover" sizes="(max-width: 768px) 80vw, 400px" />
              </div>
              <p className="mt-3 text-[11px] text-[#1a1a2e]/25 font-mono tracking-wide text-right pr-2">Votre pub — 30 secondes</p>
            </div>

            {/* Decorative element — the connecting arrow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
              <div className="w-14 h-14 rounded-full bg-white shadow-xl shadow-[#1a1a2e]/10 flex items-center justify-center">
                <ArrowRight className="w-5 h-5 text-[#f97316]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────── MARQUEE ─────────────────────── */

function Marquee() {
  const text = "CR\u00c9EZ \u2022 PUBLIEZ \u2022 CONVERTISSEZ \u2022 ";
  return (
    <section className="bg-[#1a1a2e] py-5 overflow-hidden select-none">
      <div className="marquee-track flex whitespace-nowrap">
        {Array.from({ length: 8 }).map((_, i) => (
          <span key={i} className="text-[clamp(1rem,2vw,1.25rem)] font-black tracking-[0.15em] uppercase text-white/15 mx-1">
            {text}
          </span>
        ))}
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
    <section id="comment-ca-marche" className="py-28 px-6 bg-[#faf8f5]">
      <div className="max-w-[1400px] mx-auto">
        <p className="text-[11px] font-mono text-[#f97316] tracking-[0.2em] uppercase mb-4">
          Comment &ccedil;a marche
        </p>
        <h2 className="text-3xl md:text-5xl font-black text-[#1a1a2e] leading-tight mb-20 max-w-xl">
          Trois &eacute;tapes.
          <br />
          <span className="text-[#1a1a2e]/20">Z&eacute;ro friction.</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-0">
          {steps.map((step, i) => (
            <div
              key={step.num}
              className={`relative group ${i === 1 ? "md:mt-12" : i === 2 ? "md:mt-24" : ""}`}
            >
              {/* Connector line between steps (desktop only) */}
              {i < 2 && (
                <div className="hidden md:block absolute top-24 -right-3 w-6 h-px bg-[#1a1a2e]/10" />
              )}
              <div className="p-8 md:p-10 rounded-3xl bg-white border border-[#1a1a2e]/5 hover:border-[#f97316]/20 transition-all hover:shadow-xl hover:shadow-[#f97316]/5 hover:-translate-y-1 duration-300">
                <span className="text-7xl font-black text-[#f97316]/10 leading-none font-mono block mb-6 select-none group-hover:text-[#f97316]/20 transition-colors">
                  {step.num}
                </span>
                <h3 className="text-xl font-bold text-[#1a1a2e] mb-3">
                  {step.title}
                </h3>
                <p className="text-[#1a1a2e]/40 text-[15px] leading-relaxed font-light">
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

/* ─────────────────────── FEATURES ─────────────────────── */

function FeatureCard({ icon: Icon, label, title, desc, className }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  title: string;
  desc: string;
  className?: string;
}) {
  return (
    <div className={`p-10 rounded-3xl bg-[#faf8f5] border border-[#1a1a2e]/5 group hover:border-[#f97316]/20 transition-all duration-300 ${className ?? ""}`}>
      <Icon className="w-6 h-6 text-[#f97316] mb-6" />
      <span className="text-[13px] font-mono text-[#f97316] tracking-wide">{label}</span>
      <h3 className="text-2xl font-bold text-[#1a1a2e] mt-2 mb-4">{title}</h3>
      <p className="text-[#1a1a2e]/40 leading-relaxed font-light text-[15px] max-w-md">{desc}</p>
    </div>
  );
}

function Features() {
  return (
    <section className="py-28 px-6 bg-white">
      <div className="max-w-[1400px] mx-auto">
        <p className="text-[11px] font-mono text-[#f97316] tracking-[0.2em] uppercase mb-4">
          Pourquoi kultads
        </p>
        <h2 className="text-3xl md:text-5xl font-black text-[#1a1a2e] leading-tight max-w-2xl mb-20">
          Pas juste un g&eacute;n&eacute;rateur.
          <br />
          <span className="text-[#1a1a2e]/20">Un syst&egrave;me qui comprend votre marque.</span>
        </h2>

        {/* Asymmetric 2-column layout — first row big+small, second row small+big */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <FeatureCard
              icon={Zap}
              label="4 modes"
              title="Cr&eacute;ation flexible"
              desc="Auto, Biblioth&egrave;que, Copy-Ads ou Prompt libre. Chaque mode r&eacute;pond &agrave; un workflow diff&eacute;rent."
              className="md:col-span-3"
            />
            <FeatureCard
              icon={Layers}
              label="Carr&eacute; + Story"
              title="Tous les formats"
              desc="G&eacute;n&eacute;rez en 1:1 pour le feed ou en 9:16 pour les stories. Convertissez en un clic."
              className="md:col-span-2"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <FeatureCard
              icon={MessageSquare}
              label="&laquo; Change le fond en rouge &raquo;"
              title="Modification par prompt"
              desc="Pas de Photoshop. &Eacute;crivez ce que vous voulez changer. L&apos;IA applique en fran&ccedil;ais."
              className="md:col-span-2"
            />
            <FeatureCard
              icon={RefreshCw}
              label="Mise &agrave; jour quotidienne"
              title="Biblioth&egrave;que d&apos;ads gagnantes"
              desc="On analyse les pubs les plus performantes du march&eacute;, chaque jour. Du test&eacute;, pas du th&eacute;orique."
              className="md:col-span-3"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────── BEFORE/AFTER ANIMATED ─────────────────────── */

function BeforeAfterAnimated() {
  return (
    <section className="py-28 px-6 bg-[#faf8f5]">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-16">
          <div>
            <p className="text-[11px] font-mono text-[#f97316] tracking-[0.2em] uppercase mb-4">
              Le r&eacute;sultat
            </p>
            <h2 className="text-3xl md:text-5xl font-black text-[#1a1a2e]">
              Template &rarr; Votre pub
            </h2>
          </div>
          <p className="text-sm text-[#1a1a2e]/30 font-light max-w-xs">
            M&ecirc;me layout, votre marque. La transformation en temps r&eacute;el.
          </p>
        </div>

        <div className="max-w-xl mx-auto">
          <div className="relative aspect-square overflow-hidden rounded-3xl shadow-2xl shadow-[#1a1a2e]/10 border border-[#1a1a2e]/5">
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
            <div className="absolute bottom-4 left-4 bg-[#1a1a2e]/70 backdrop-blur-sm text-white text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 z-10 rounded-full">
              Template
            </div>
            <div className="absolute bottom-4 right-4 bg-[#f97316]/90 backdrop-blur-sm text-white text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 z-10 rounded-full">
              G&eacute;n&eacute;r&eacute;
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────── DAILY GIFT + STAT ─────────────────────── */

function DailyGiftAndStat() {
  return (
    <section className="py-28 px-6 bg-white overflow-hidden">
      <div className="max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Daily Gift */}
          <div className="p-12 rounded-3xl bg-[#1a1a2e] text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#f97316]/10 rounded-full blur-3xl" />
            <span className="text-7xl md:text-8xl font-black text-[#f97316] leading-none font-mono block mb-8 select-none">
              1/jour
            </span>
            <h3 className="text-2xl font-bold mb-4">
              Un cadeau chaque matin
            </h3>
            <p className="text-white/40 leading-relaxed font-light max-w-sm">
              Les abonn&eacute;s Pro et Agency re&ccedil;oivent automatiquement une pub g&eacute;n&eacute;r&eacute;e chaque jour, adapt&eacute;e &agrave; leur marque. Ouvrez l&apos;app, votre pub vous attend.
            </p>
          </div>

          {/* Big Stat */}
          <div className="p-12 rounded-3xl bg-[#faf8f5] border border-[#1a1a2e]/5 flex flex-col justify-between">
            <div>
              <p className="text-[11px] font-mono text-[#f97316] tracking-[0.2em] uppercase mb-4">
                En chiffres
              </p>
              <span className="text-8xl md:text-9xl font-black text-[#1a1a2e] leading-none tracking-tighter font-mono block">
                500+
              </span>
            </div>
            <p className="text-[#1a1a2e]/40 text-lg leading-relaxed font-light mt-8 max-w-sm">
              publicit&eacute;s g&eacute;n&eacute;r&eacute;es. Biblioth&egrave;que d&apos;ads gagnantes mise &agrave; jour chaque jour.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────── TESTIMONIAL ─────────────────────── */

function Testimonial() {
  return (
    <section className="py-28 px-6 bg-[#faf8f5]">
      <div className="max-w-[1400px] mx-auto text-center">
        <p className="text-[11px] font-mono text-[#f97316] tracking-[0.2em] uppercase mb-12">
          T&eacute;moignage
        </p>
        <blockquote className="text-2xl md:text-4xl lg:text-5xl font-black text-[#1a1a2e] leading-tight max-w-4xl mx-auto tracking-tight">
          &laquo;&nbsp;On faisait nos pubs sur Canva en 2h. Maintenant c&apos;est 30 secondes et le r&eacute;sultat est meilleur.&nbsp;&raquo;
        </blockquote>
        <div className="mt-10 flex items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#1a1a2e]/10 flex items-center justify-center text-sm font-bold text-[#1a1a2e]/40">
            L
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-[#1a1a2e]">Lucas M.</p>
            <p className="text-[12px] text-[#1a1a2e]/30 font-mono">Fondateur, e-commerce mode</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────── PRICING ─────────────────────── */

function Pricing() {
  return (
    <section id="tarifs" className="py-28 px-6 bg-white">
      <div className="max-w-[1400px] mx-auto">
        <p className="text-[11px] font-mono text-[#f97316] tracking-[0.2em] uppercase mb-4">
          Tarifs
        </p>
        <h2 className="text-3xl md:text-5xl font-black text-[#1a1a2e] mb-4">
          Simple. Pas de surprise.
        </h2>
        <p className="text-[#1a1a2e]/40 font-light mb-16 max-w-md">
          Commencez gratuitement. Passez Pro quand vous &ecirc;tes convaincu.
        </p>

        {/* Pricing — horizontal rows */}
        <div className="space-y-4">
          {/* Starter */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-8 md:p-10 gap-6 rounded-2xl border border-[#1a1a2e]/5 bg-[#faf8f5] hover:border-[#1a1a2e]/10 transition-colors">
            <div className="md:w-1/4">
              <h3 className="text-lg font-bold text-[#1a1a2e]">Starter</h3>
              <p className="text-sm text-[#1a1a2e]/30 mt-1">Pour tester</p>
            </div>
            <div className="md:w-1/4">
              <span className="text-5xl font-black text-[#1a1a2e] font-mono">0&euro;</span>
            </div>
            <ul className="md:w-1/3 space-y-1.5 text-sm text-[#1a1a2e]/45">
              <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-[#1a1a2e]/15" /> 1 pub offerte</li>
              <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-[#1a1a2e]/15" /> Biblioth&egrave;que limit&eacute;e</li>
              <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-[#1a1a2e]/15" /> Format carr&eacute; uniquement</li>
            </ul>
            <div className="md:w-auto">
              <Link href="/signup" className="inline-block text-sm font-semibold text-[#1a1a2e] border border-[#1a1a2e]/15 px-6 py-2.5 rounded-full hover:bg-[#1a1a2e] hover:text-white transition-all">
                Commencer
              </Link>
            </div>
          </div>

          {/* Pro — highlighted */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-8 md:p-10 gap-6 rounded-2xl bg-[#1a1a2e] text-white relative overflow-hidden hover:shadow-2xl hover:shadow-[#1a1a2e]/20 transition-all">
            <div className="absolute top-0 right-0 w-60 h-60 bg-[#f97316]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -top-px right-8 bg-[#f97316] text-white text-[10px] font-bold tracking-widest uppercase px-4 py-1.5 rounded-b-lg">
              Populaire
            </div>
            <div className="md:w-1/4">
              <h3 className="text-lg font-bold">Pro</h3>
              <p className="text-sm text-white/35 mt-1">Pour les e-commerces ambitieux</p>
            </div>
            <div className="md:w-1/4">
              <span className="text-5xl font-black font-mono">29&euro;</span>
              <span className="text-white/35 text-sm">/mois</span>
            </div>
            <ul className="md:w-1/3 space-y-1.5 text-sm text-white/50">
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#f97316]" /> Cr&eacute;ations illimit&eacute;es</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#f97316]" /> Carr&eacute; + Story</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#f97316]" /> Modification par prompt</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#f97316]" /> 1 pub offerte / jour</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#f97316]" /> Biblioth&egrave;que compl&egrave;te</li>
            </ul>
            <div className="md:w-auto">
              <Link href="/signup" className="inline-block text-sm font-semibold text-[#1a1a2e] bg-white px-6 py-2.5 rounded-full hover:bg-[#f97316] hover:text-white transition-all">
                Essayer gratuitement
              </Link>
            </div>
          </div>

          {/* Agency */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-8 md:p-10 gap-6 rounded-2xl border border-[#1a1a2e]/5 bg-[#faf8f5] hover:border-[#1a1a2e]/10 transition-colors">
            <div className="md:w-1/4">
              <h3 className="text-lg font-bold text-[#1a1a2e]">Agency</h3>
              <p className="text-sm text-[#1a1a2e]/30 mt-1">Multi-marques &amp; agences</p>
            </div>
            <div className="md:w-1/4">
              <span className="text-5xl font-black text-[#1a1a2e] font-mono">79&euro;</span>
              <span className="text-[#1a1a2e]/30 text-sm">/mois</span>
            </div>
            <ul className="md:w-1/3 space-y-1.5 text-sm text-[#1a1a2e]/45">
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#f97316]" /> Tout le plan Pro</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#f97316]" /> Multi-marques</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#f97316]" /> Acc&egrave;s API</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#f97316]" /> Support d&eacute;di&eacute;</li>
            </ul>
            <div className="md:w-auto">
              <Link href="/signup" className="inline-block text-sm font-semibold text-[#1a1a2e] border border-[#1a1a2e]/15 px-6 py-2.5 rounded-full hover:bg-[#1a1a2e] hover:text-white transition-all">
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
    <section className="py-28 px-6 bg-[#faf8f5]">
      <div className="max-w-[900px] mx-auto">
        <p className="text-[11px] font-mono text-[#f97316] tracking-[0.2em] uppercase mb-4">
          FAQ
        </p>
        <h2 className="text-3xl md:text-5xl font-black text-[#1a1a2e] mb-16">
          Les questions qu&apos;on nous pose
        </h2>

        <div className="space-y-3">
          {questions.map((item) => (
            <details key={item.q} className="group rounded-2xl bg-white border border-[#1a1a2e]/5 overflow-hidden hover:border-[#f97316]/15 transition-colors">
              <summary className="cursor-pointer flex items-center justify-between p-6 text-base font-semibold text-[#1a1a2e] list-none [&::-webkit-details-marker]:hidden">
                {item.q}
                <span className="ml-4 text-[#1a1a2e]/20 group-open:rotate-180 transition-transform duration-300 shrink-0">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </span>
              </summary>
              <div className="px-6 pb-6 text-sm text-[#1a1a2e]/40 leading-relaxed font-light">
                {item.a}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────── FINAL CTA ─────────────────────── */

function FinalCTA() {
  return (
    <section className="py-32 px-6 bg-[#1a1a2e] relative overflow-hidden">
      {/* Warm glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#f97316]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="max-w-[1400px] mx-auto text-center relative z-10">
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-[0.95] tracking-tight max-w-3xl mx-auto">
          On va changer &ccedil;a.
        </h2>
        <p className="mt-8 text-lg text-white/30 font-light max-w-md mx-auto">
          Premi&egrave;re pub offerte. Sans carte bancaire. 30 secondes.
        </p>
        <div className="mt-12">
          <Link
            href="/signup"
            className="inline-flex items-center gap-3 bg-[#f97316] text-white font-semibold px-10 py-4 text-base rounded-full hover:bg-[#ea580c] transition-all hover:shadow-xl hover:shadow-[#f97316]/30 hover:-translate-y-0.5"
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
    <footer className="border-t border-white/5 py-8 px-6 bg-[#1a1a2e]">
      <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <KultLogoIcon className="w-7 h-7 opacity-40" />
        <div className="flex items-center gap-8 text-[12px] text-white/20">
          <Link href="/cgu" className="hover:text-white/50 transition-colors">
            CGU
          </Link>
          <a href="mailto:contact@kultads.com" className="hover:text-white/50 transition-colors">
            Contact
          </a>
        </div>
        <p className="text-[12px] text-white/15 font-mono">
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
        <Marquee />
        <HowItWorks />
        <Features />
        <BeforeAfterAnimated />
        <DailyGiftAndStat />
        <Testimonial />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
