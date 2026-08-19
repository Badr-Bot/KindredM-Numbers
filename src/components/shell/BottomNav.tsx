"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSound } from "../sound/SoundProvider";

// Ordre voulu par Badr (16/08) : Année juste après Mois, puis Dépenses,
// et Analyse/Créas à la fin.
const ITEMS = [
  { href: "/", label: "Live", emoji: "⚡" },
  { href: "/mois", label: "Mois", emoji: "🗓️" },
  { href: "/annee", label: "Année", emoji: "📈" },
  { href: "/depenses", label: "Dépenses", emoji: "🍩" },
  { href: "/analyse", label: "Analyse", emoji: "📊" },
  { href: "/creas", label: "Créas", emoji: "🎬" },
  { href: "/scaling", label: "Scaling", emoji: "🪜" },
  { href: "/controle", label: "Contrôle", emoji: "🛃" },
];
// /controle est REVENU dans la barre le 19/08 (Badr : « il faudra un onglet
// à part de contrôle ») : il porte désormais le rapprochement bancaire en
// plus de l'affectation des campagnes Meta neuves.

export function BottomNav() {
  const pathname = usePathname();
  const { play } = useSound();

  return (
    <nav
      // fixed, pas sticky : un `sticky` dépend de la hauteur totale du
      // document, qui bouge d'un coup quand une carte Créas se déplie (9
      // graphiques insérés) — la barre "saute" visuellement le temps que le
      // navigateur recalcule sa position (signalé 27/07, mobile). `fixed` est
      // ancré au viewport, indifférent aux changements de hauteur du contenu.
      className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
      aria-label="Navigation principale"
    >
      {/* 8 onglets : seul l'ACTIF déploie son nom dans une pastille animée,
          les autres restent en icône — la barre respire quel que soit le
          nombre d'onglets (le layout à largeurs égales écrasait les libellés
          dès 7 entrées, signalé par Badr le 19/08). Le nom s'ouvre par
          transition max-width/opacity, l'icône marque le tap (scale). */}
      <ul className="card-shadow mx-auto flex max-w-3xl items-center justify-between gap-0.5 rounded-2xl bg-ink/95 px-2 py-1.5 backdrop-blur supports-[backdrop-filter]:bg-ink/90 lg:max-w-2xl">
        {ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.href} className="flex-none">
              <Link
                href={item.href}
                onClick={() => play("tab")}
                aria-current={active ? "page" : undefined}
                aria-label={item.label}
                className={`group flex items-center rounded-full px-2.5 py-2.5 transition-colors duration-300 ease-out ${
                  active
                    ? "bg-white/10 text-phosphor-brand shadow-[inset_0_0_0_1px_rgba(255,255,255,0.10)]"
                    : "text-white/45 hover:bg-white/5 hover:text-white/85"
                }`}
              >
                <span
                  className={`text-base leading-none transition-transform duration-300 ease-out ${
                    active ? "scale-110" : "group-active:scale-90"
                  }`}
                  aria-hidden
                >
                  {item.emoji}
                </span>
                {/* Le nom s'ouvre vers sa largeur NATURELLE (grid 0fr→1fr) :
                    jamais tronqué, quelle que soit sa longueur — le max-width
                    fixe coupait « ANNÉE » en « ANN… » (Badr, 19/08). */}
                <span
                  className={`grid transition-[grid-template-columns] duration-300 ease-out ${
                    active ? "grid-cols-[1fr]" : "grid-cols-[0fr]"
                  }`}
                >
                  <span
                    className={`overflow-hidden whitespace-nowrap pl-1.5 text-[10px] font-bold uppercase tracking-wider transition-opacity duration-300 ${
                      active ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    {item.label}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
