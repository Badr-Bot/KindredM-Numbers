"use client";

import { useState } from "react";
import type { ProductSplitCard } from "@/lib/analytics";
import { formatEur0, formatEurSigned0, formatInt, formatPct, formatRoas, netTierClass } from "@/lib/format";
import { useSound } from "../sound/SoundProvider";

// ---------------------------------------------------------------------------
// 🎽 Par produit — demandé par Badr (24/08) : « un truc comme pour les pays
// mais pour les produits, genre Lancaster et Polo, pour voir ce que le
// Lancaster seul a rapporté et le Polo aussi ».
//
// Trois ratios sont affichés côte à côte parce qu'ils ne répondent PAS à la
// même question — les confondre, c'est croire une campagne rentable alors
// qu'elle ne l'est pas :
//   • MER      = tout le CA du bloc ÷ spend. Inclut l'organique, le direct,
//                l'e-mail. Mesure le produit, PAS la campagne.
//   • ROAS UTM = CA dont l'utm_campaign pointe vers une campagne du produit
//                ÷ spend. De l'argent réellement encaissé, tracé à la source.
//                C'est le plus honnête LE JOUR MÊME.
//   • ROAS Meta= ce que Meta s'attribue ÷ spend. Sous-estime le jour même
//                (rattrapage sous 24-72 h), puis dépasse l'UTM sur les jours
//                clos (il voit des conversions que l'UTM perd).
// ---------------------------------------------------------------------------

export type PeriodKey = "7j" | "30j" | "mois" | "90j";

export const PERIOD_LABELS: Record<PeriodKey, string> = {
  "7j": "7 jours",
  "30j": "30 jours",
  mois: "Ce mois",
  "90j": "90 jours",
};

// Fenêtre plafonnée à 90 jours (et non « tout l'historique ») : le découpage
// pagine la table orders avec ses line_items, et un scan illimité dépassait
// le budget temps de la fonction — il rendait la page vide au lieu de lente.
const PERIOD_ORDER: PeriodKey[] = ["7j", "30j", "mois", "90j"];

const ratio = (num: number, den: number): number | null => (den > 0 ? num / den : null);

function Tile({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: string;
}) {
  return (
    <div className="rounded-lg border border-line bg-panel/40 p-2.5">
      <div className="text-[9px] font-bold uppercase tracking-wider text-ink-faint">{label}</div>
      <div className={`tnum mt-0.5 text-[17px] font-extrabold ${tone ?? "text-ink"}`}>{value}</div>
      {hint && <div className="mt-0.5 text-[9.5px] leading-snug text-ink-faint">{hint}</div>}
    </div>
  );
}

function ProductDetail({ c }: { c: ProductSplitCard }) {
  const mer = ratio(c.caCents, c.spendCents);
  const roasUtm = ratio(c.utmCaCents, c.spendCents);
  const roasMeta = ratio(c.metaPurchaseValueCents, c.spendCents);
  const marge = c.caCents > 0 ? c.netCents / c.caCents : null;
  const panier = c.orders > 0 ? c.caCents / c.orders : 0;
  // Part du bloc qui n'est PAS venue d'une campagne du produit : organique,
  // direct, e-mail, UTM perdue. C'est exactement ce qui écarte le MER du ROAS.
  const horsCampagne = Math.max(c.caCents - c.utmCaCents, 0);

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Tile label="CA" value={formatEur0(c.caCents)} hint={`${formatInt(c.orders)} commandes`} />
        <Tile label="Spend Meta" value={formatEur0(c.spendCents)} tone="text-red" />
        <Tile
          label="Net"
          value={formatEurSigned0(c.netCents)}
          tone={netTierClass(c.netCents)}
          hint="hors charges fixes"
        />
        <Tile label="Marge" value={formatPct(marge)} hint={`panier ${formatEur0(panier)}`} />
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Tile
          label="MER (produit)"
          value={formatRoas(mer)}
          hint="tout le CA du bloc ÷ spend — inclut l'organique"
        />
        <Tile
          label="ROAS UTM (campagne)"
          value={formatRoas(roasUtm)}
          tone="text-phosphor"
          hint={`${formatEur0(c.utmCaCents)} tracés · ${formatInt(c.utmOrders)} cmd`}
        />
        <Tile
          label="ROAS Meta"
          value={formatRoas(roasMeta)}
          hint="sous-estime le jour même (24-72 h)"
        />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Tile label="COGS" value={formatEur0(c.cogsCents)} />
        <Tile label="Taxe UE" value={formatEur0(c.taxCents)} />
        <Tile label="Frais" value={formatEur0(c.feesCents)} />
        <Tile
          label="CA hors campagne"
          value={formatEur0(horsCampagne)}
          tone={horsCampagne > c.caCents * 0.25 ? "text-amber" : undefined}
          hint="organique, direct, e-mail, UTM perdue"
        />
      </div>

      {c.spendCents > 0 && roasUtm !== null && mer !== null && (
        <p className="text-[10.5px] leading-snug text-ink-faint">
          Écart MER − ROAS UTM :{" "}
          <b className="tnum text-ink">{(mer - roasUtm).toFixed(2)}x</b> — c&apos;est la part du bloc
          qui rentre sans que la pub l&apos;ait payée. Pour juger la campagne, lis le ROAS UTM ; pour
          juger le produit, lis le MER.
        </p>
      )}
    </div>
  );
}

export function ProductBoard({
  byPeriod,
  rangeByPeriod,
}: {
  byPeriod: Record<PeriodKey, ProductSplitCard[]>;
  rangeByPeriod: Record<PeriodKey, { start: string; end: string }>;
}) {
  const { play } = useSound();
  const [period, setPeriod] = useState<PeriodKey>("7j");
  const cards = byPeriod[period] ?? [];
  const [productKey, setProductKey] = useState<string>("ALL");
  const range = rangeByPeriod[period];

  const selected = cards.find((c) => c.key === productKey);
  const totalCa = cards.reduce((s, c) => s + c.caCents, 0);

  const fmtDay = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;

  return (
    <div className="flex flex-col gap-3">
      {/* Période */}
      <div className="flex gap-1 overflow-x-auto pb-1" role="tablist" aria-label="Période">
        {PERIOD_ORDER.map((p) => {
          const isActive = p === period;
          return (
            <button
              key={p}
              role="tab"
              aria-selected={isActive}
              onClick={() => {
                if (!isActive) {
                  play("tab");
                  setPeriod(p);
                }
              }}
              className={`flex-none rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                isActive
                  ? "border-phosphor/60 bg-phosphor/10 text-phosphor"
                  : "border-line text-ink-dim hover:text-ink"
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          );
        })}
      </div>

      {/* Produits */}
      <div className="flex gap-1 overflow-x-auto pb-1" role="tablist" aria-label="Produit">
        {[{ key: "ALL", label: "Tous", emoji: "🌍" }, ...cards].map((c) => {
          const isActive = c.key === productKey;
          return (
            <button
              key={c.key}
              role="tab"
              aria-selected={isActive}
              onClick={() => {
                if (!isActive) {
                  play("tab");
                  setProductKey(c.key);
                }
              }}
              className={`flex-none rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                isActive
                  ? "border-phosphor/60 bg-phosphor/10 text-phosphor"
                  : "border-line text-ink-dim hover:text-ink"
              }`}
            >
              <span aria-hidden>{c.emoji}</span> {c.label}
              {c.key === "GILET" && <span className="ml-1 text-[9px] opacity-70">Lancaster</span>}
            </button>
          );
        })}
      </div>

      {range && (
        <p className="text-[10px] text-ink-faint">
          Du {fmtDay(range.start)} au {fmtDay(range.end)} inclus. Le spend est celui des campagnes du
          produit (Gilet = campagnes « LANCASTER », Polo = tout le reste). Charges fixes non
          déduites : elles sont transverses, elles vivent dans l&apos;onglet Dépenses.
        </p>
      )}

      {cards.length === 0 ? (
        <p className="rounded-lg border border-line bg-panel/40 p-6 text-center text-[11px] text-ink-faint">
          Aucune donnée sur cette période.
        </p>
      ) : selected ? (
        <ProductDetail c={selected} />
      ) : (
        /* Vue « Tous » : le tableau de comparaison, produit par produit */
        <div className="-mx-1 overflow-x-auto px-1">
          <table className="w-full min-w-[640px] border-collapse text-[11.5px]">
            <thead>
              <tr className="border-b border-line text-ink-faint">
                <th className="py-2 pr-2 text-left font-semibold">Produit</th>
                <th className="py-2 pr-2 text-right font-semibold">CA</th>
                <th className="py-2 pr-2 text-right font-semibold">Part</th>
                <th className="py-2 pr-2 text-right font-semibold">Spend</th>
                <th className="py-2 pr-2 text-right font-semibold">Net</th>
                <th className="py-2 pr-2 text-right font-semibold">Marge</th>
                <th className="py-2 pr-2 text-right font-semibold">MER</th>
                <th className="py-2 pr-2 text-right font-semibold">ROAS UTM</th>
                <th className="py-2 text-right font-semibold">ROAS Meta</th>
              </tr>
            </thead>
            <tbody className="tnum">
              {cards.map((c) => (
                <tr key={c.key} className="border-b border-line-soft last:border-0">
                  <td className="py-1.5 pr-2 text-left font-medium text-ink">
                    <span aria-hidden>{c.emoji}</span> {c.label}
                    {c.key === "GILET" && <span className="ml-1 text-[9px] text-ink-faint">Lancaster</span>}
                  </td>
                  <td className="py-1.5 pr-2 text-right">{formatEur0(c.caCents)}</td>
                  <td className="py-1.5 pr-2 text-right text-ink-faint">
                    {totalCa > 0 ? `${Math.round((c.caCents / totalCa) * 100)} %` : "—"}
                  </td>
                  <td className="py-1.5 pr-2 text-right text-ink-dim">{formatEur0(c.spendCents)}</td>
                  <td className={`py-1.5 pr-2 text-right font-semibold ${netTierClass(c.netCents)}`}>
                    {formatEurSigned0(c.netCents)}
                  </td>
                  <td className="py-1.5 pr-2 text-right text-ink-dim">
                    {formatPct(c.caCents > 0 ? c.netCents / c.caCents : null)}
                  </td>
                  <td className="py-1.5 pr-2 text-right">{formatRoas(ratio(c.caCents, c.spendCents))}</td>
                  <td className="py-1.5 pr-2 text-right text-phosphor">
                    {formatRoas(ratio(c.utmCaCents, c.spendCents))}
                  </td>
                  <td className="py-1.5 text-right text-ink-dim">
                    {formatRoas(ratio(c.metaPurchaseValueCents, c.spendCents))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-[10px] leading-snug text-ink-faint">
            <b className="text-ink-dim">MER</b> = tout le CA du bloc ÷ spend (inclut l&apos;organique,
            le direct, l&apos;e-mail) — il juge le PRODUIT.{" "}
            <b className="text-ink-dim">ROAS UTM</b> = CA dont l&apos;utm_campaign pointe vers une
            campagne du produit ÷ spend — il juge la CAMPAGNE, sur de l&apos;argent réellement
            encaissé. <b className="text-ink-dim">ROAS Meta</b> = ce que Meta s&apos;attribue : il
            sous-estime le jour même et se rattrape sous 24-72 h. Une commande suit le produit que le
            client est VENU acheter (campagne d&apos;arrivée, sinon le principal qui pèse le plus au
            panier) — un gilet ajouté à un panier de polos reste au Polo.
          </p>
        </div>
      )}
    </div>
  );
}
