import Link from "next/link";
import { LoopadLogoFull } from "@/components/adly-logo";

export default function CGUPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-5 py-4">
        <Link href="/">
          <LoopadLogoFull />
        </Link>
      </nav>
      <div className="max-w-3xl mx-auto px-5 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Conditions Generales d&apos;Utilisation</h1>
        <p className="text-sm text-gray-400 mb-10">Derniere mise a jour : 21 mars 2026</p>

        <div className="space-y-8 text-gray-700 text-[15px] leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Objet</h2>
            <p>Les presentes Conditions Generales d&apos;Utilisation (CGU) regissent l&apos;utilisation de la plateforme Klonr., accessible a l&apos;adresse klonr.io. En utilisant le service, vous acceptez les presentes conditions dans leur integralite.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Description du service</h2>
            <p>Klonr. est un outil de generation de publicites assistee par intelligence artificielle. Le service permet aux utilisateurs de creer des visuels publicitaires adaptes a leur marque en s&apos;inspirant de modeles de reference.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Bibliotheque d&apos;inspiration</h2>
            <p>La plateforme met a disposition une bibliotheque de visuels publicitaires utilises exclusivement a titre d&apos;inspiration creative. Ces visuels servent de reference stylistique pour la generation de nouvelles publicites et ne sont ni reproduits ni redistribues.</p>
            <p className="mt-2">Chaque publicite generee par Klonr. est une <strong>creation originale</strong> adaptee a la marque de l&apos;utilisateur. Les modeles de reference sont utilises uniquement pour guider le style, la composition et l&apos;approche marketing — jamais pour copier le contenu, les produits ou les elements de marque d&apos;origine.</p>
            <p className="mt-2">Les utilisateurs peuvent egalement soumettre leurs propres visuels de reference pour generer des publicites inspirees de ces derniers.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Propriete intellectuelle</h2>
            <p>Les publicites generees par Klonr. appartiennent a l&apos;utilisateur qui les a creees. L&apos;utilisateur est responsable de l&apos;utilisation qu&apos;il fait des contenus generes, notamment en matiere de conformite avec les regles publicitaires des plateformes (Meta, Google, TikTok, etc.).</p>
            <p className="mt-2">Les marques, logos et contenus presents dans la bibliotheque d&apos;inspiration restent la propriete de leurs detenteurs respectifs. Klonr. ne revendique aucun droit sur ces contenus.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Compte utilisateur</h2>
            <p>L&apos;acces au service necessite la creation d&apos;un compte. L&apos;utilisateur est responsable de la confidentialite de ses identifiants et de toute activite effectuee sous son compte.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Donnees personnelles</h2>
            <p>Klonr. collecte et traite les donnees personnelles necessaires au fonctionnement du service (adresse email, informations de marque, images uploadees). Ces donnees ne sont ni vendues ni partagees avec des tiers a des fins commerciales.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Limitation de responsabilite</h2>
            <p>Les publicites generees par l&apos;IA peuvent contenir des imperfections. Klonr. ne garantit pas que les contenus generes seront exempts d&apos;erreurs. L&apos;utilisateur est invite a verifier et adapter les publicites avant toute diffusion.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Modification des CGU</h2>
            <p>Klonr. se reserve le droit de modifier les presentes CGU a tout moment. Les utilisateurs seront informes de toute modification substantielle.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Mentions legales</h2>
            <p><strong>Editeur :</strong> Kult.</p>
            <p className="mt-1"><strong>Adresse :</strong> 212 Rue de Solferino, 59800 Lille, France</p>
            <p className="mt-1"><strong>SIRET :</strong> 99447700800019</p>
            <p className="mt-1"><strong>Email :</strong> <a href="mailto:contact@kult-agency.com" className="text-blue-500 hover:underline">contact@kult-agency.com</a></p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Contact</h2>
            <p>Pour toute question relative aux presentes CGU, vous pouvez nous contacter a l&apos;adresse : <a href="mailto:contact@kult-agency.com" className="text-blue-500 hover:underline">contact@kult-agency.com</a></p>
          </section>
        </div>
      </div>
    </div>
  );
}
