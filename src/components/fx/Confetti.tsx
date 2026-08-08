"use client";

const COLORS = ["var(--color-phosphor)", "var(--color-phosphor-brand)", "var(--color-cyan)", "var(--color-net-3)"];
const PIECES = 14;

/** Petite salve de confettis CSS, déclenchée une fois quand le net dépasse
 * la cible du jour — se démonte seule après l'animation (voir TodayBoard).
 * Le parent doit être `position: relative` ; chaque pièce part du même
 * point d'ancrage (pas de flex — les enfants `absolute` ignorent
 * justify-content) et file vers `--dx`/`--dy` via les keyframes CSS. */
export function Confetti() {
  return (
    <div className="pointer-events-none absolute left-1/2 top-16 h-0 w-0" aria-hidden>
      {Array.from({ length: PIECES }).map((_, i) => {
        // éventail horizontal, très peu de dérive verticale — reste dans les
        // limites de la carte (overflow-hidden) au lieu de gicler hors cadre
        const angle = (i / PIECES) * Math.PI - Math.PI / 2;
        const distance = 90 + (i % 4) * 24;
        const dx = Math.cos(angle) * distance;
        const dy = Math.abs(Math.sin(angle)) * 24 + (i % 3) * 10;
        const delay = (i % 5) * 0.02;
        return (
          <span
            key={i}
            className="confetti-piece absolute h-1.5 w-1.5 rounded-sm"
            style={{
              backgroundColor: COLORS[i % COLORS.length],
              animationDelay: `${delay}s`,
              // @ts-expect-error -- custom props consommées par les keyframes CSS
              "--dx": `${dx}px`,
              "--dy": `${dy}px`,
            }}
          />
        );
      })}
    </div>
  );
}
