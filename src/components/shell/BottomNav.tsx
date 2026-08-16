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
];
// /controle existe toujours (affectation d'une campagne Meta toute neuve à
// un marché, lien direct depuis le bandeau ⚠️ du Live) mais n'est plus dans
// la barre — retiré le 08/08 (Badr : « l'onglet Contrôle sert à rien »).

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
      <ul className="card-shadow mx-auto flex max-w-3xl rounded-2xl bg-ink/95 backdrop-blur supports-[backdrop-filter]:bg-ink/90 lg:max-w-2xl">
        {ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.href} className="flex-1 py-1.5 first:pl-1.5 last:pr-1.5">
              <Link
                href={item.href}
                onClick={() => play("tab")}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[10px] uppercase tracking-wider transition-all duration-200 ${
                  active ? "bg-white/10 text-phosphor-brand" : "text-white/50 hover:text-white/80"
                }`}
              >
                <span className="text-base leading-none">{item.emoji}</span>
                <span>{item.label}</span>
                <span
                  className={`h-1 w-1 rounded-full transition-all duration-200 ${
                    active ? "bg-phosphor-brand" : "bg-transparent"
                  }`}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
