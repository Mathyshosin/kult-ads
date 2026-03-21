"use client";

import { useState, useEffect, useCallback } from "react";

const FUN_FACTS = [
  "Dropbox a augmenté ses inscriptions de 60% grâce à un simple programme de parrainage offrant 500 Mo gratuits.",
  "Airbnb a hacké Craigslist pour publier automatiquement ses annonces et voler du trafic à la plateforme.",
  "Hotmail a ajouté \"PS: I love you. Get your free email at Hotmail\" en bas de chaque email. Résultat : 12 millions d'users en 18 mois.",
  "Le bouton \"Share\" de Facebook génère plus de 10 milliards d'impressions par jour sur des sites tiers.",
  "Instagram a été lancé un lundi et avait 25 000 utilisateurs le premier jour, sans aucune pub.",
  "Le rouge dans un CTA peut augmenter les conversions de 21% par rapport au vert, selon une étude HubSpot.",
  "Les emails envoyés le mardi à 10h ont le meilleur taux d'ouverture selon 14 études marketing.",
  "Amazon génère 35% de son chiffre d'affaires grâce à son moteur de recommandation \"Les clients ont aussi acheté\".",
  "Le fondateur de Spanx a envoyé son produit à Oprah sans autorisation. Oprah l'a nommé \"Favori de l'Année\".",
  "Dollar Shave Club a dépensé 4 500$ pour sa vidéo virale. Résultat : 12 000 commandes en 48h.",
  "PayPal donnait littéralement 10$ à chaque nouvel inscrit. Coût d'acquisition : 60M$. Valorisation : 1,5 milliard.",
  "Les landing pages avec une seule CTA convertissent 266% mieux que celles avec plusieurs options.",
  "Spotify crée 30 millions de playlists personnalisées chaque lundi. C'est la fonctionnalité qui retient le plus d'abonnés.",
  "Nike a dépensé 0$ en pub TV pour le lancement de Nike+. Tout était du marketing produit intégré.",
  "Le taux de conversion moyen d'un e-commerce est de 2,86%. Les meilleurs atteignent 11%.",
  "Un A/B test chez Google sur 41 nuances de bleu pour un lien a rapporté 200M$ de revenus supplémentaires.",
  "LinkedIn a atteint ses premiers 2 millions d'utilisateurs uniquement via les invitations email des membres existants.",
  "Les publicités vidéo de moins de 15 secondes ont un taux de complétion 72% plus élevé que les vidéos de 30 secondes.",
  "Le packaging d'Apple coûte en moyenne 7$ par boîte d'iPhone. L'expérience unboxing est un investissement marketing.",
  "Slack n'avait aucun commercial quand il a atteint 1 million d'utilisateurs payants. Tout était du bouche-à-oreille.",
  "Les marques qui publient 16+ articles de blog par mois génèrent 3,5x plus de trafic.",
  "Tesla dépense 0$ en publicité traditionnelle. Elon Musk est leur stratégie marketing.",
  "Une étude montre que les prix en 9 (9,99€ vs 10€) augmentent les ventes de 24% en moyenne.",
  "Red Bull a investi 30% de son CA en marketing et seulement 1% en R&D. La marque EST le produit.",
  "GitHub a grandi uniquement par le bouche-à-oreille développeur pendant ses 4 premières années.",
  "Les stories Instagram génèrent 500 millions de vues par jour. C'est le format publicitaire qui croît le plus vite.",
  "Le premier logo de Google a été créé sur GIMP (logiciel gratuit) par Sergey Brin en 5 minutes.",
  "Les emails avec un emoji dans l'objet ont un taux d'ouverture 56% plus élevé.",
  "Notion a attendu 3 ans avant de lancer sa V1. La patience est une stratégie de growth sous-estimée.",
  "Le coût d'acquisition d'un nouveau client est 5 à 25x plus élevé que de fidéliser un client existant.",
];

function getRandomFact(exclude?: string): string {
  const available = exclude
    ? FUN_FACTS.filter((f) => f !== exclude)
    : FUN_FACTS;
  return available[Math.floor(Math.random() * available.length)];
}

export function FunFact() {
  const [fact, setFact] = useState(() => getRandomFact());

  const rotate = useCallback(() => {
    setFact((prev) => getRandomFact(prev));
  }, []);

  useEffect(() => {
    const interval = setInterval(rotate, 5000);
    return () => clearInterval(interval);
  }, [rotate]);

  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <p className="text-sm text-gray-500 italic text-center">
        💡 <span className="font-medium not-italic">Le saviez-vous ?</span>{" "}
        {fact}
      </p>
    </div>
  );
}
