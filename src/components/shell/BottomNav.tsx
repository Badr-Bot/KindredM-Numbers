"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSound } from "../sound/SoundProvider";

const ITEMS = [
  { href: "/", label: "Live", emoji: "⚡" },
  { href: "/mois", label: "Mois", emoji: "🗓️" },
  { href: "/analyse", label: "Analyse", emoji: "📊" },
  { href: "/creas", label: "Créas", emoji: "🎬" },
  { href: "/annee", label: "Année", emoji: "📈" },
  { href: "/depenses", label: "Dépenses", emoji: "🍩" },
  { href: "/controle", label: "Contrôle", emoji: "🛡️" },
];

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
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-terminal/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:bg-terminal/80"
      aria-label="Navigation principale"
    >
      <ul className="mx-auto flex max-w-3xl lg:max-w-2xl">
        {ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                onClick={() => play("tab")}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-0.5 py-2.5 text-[10px] uppercase tracking-wider transition-colors ${
                  active
                    ? "text-phosphor"
                    : "text-ink-faint hover:text-ink-dim"
                }`}
              >
                <span className={`text-base leading-none ${active ? "drop-shadow-[0_0_6px_rgba(51,255,156,0.7)]" : ""}`}>
                  {item.emoji}
                </span>
                <span>{item.label}</span>
                <span
                  className={`h-px w-6 rounded-full transition-all ${
                    active ? "bg-phosphor shadow-[0_0_6px_rgba(51,255,156,0.8)]" : "bg-transparent"
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
