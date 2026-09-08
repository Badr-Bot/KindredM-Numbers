"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AnomalyKind, BankReport, BankTx, TxLabel } from "@/lib/bank";
import type { TreasuryBridge } from "@/lib/treasury";
import { PRE_LLC_RESIDUAL, UNEXPLAINED_ALERT_CENTS, computeOwnership } from "@/lib/treasury";
import type { PayoutReconciliation, ShopifyPayout } from "@/lib/payouts";
import {
  SUPPLIER_BILLS,
  SUPPLIER_NAME,
  SUPPLIER_PENDING_CREDITS,
  SUPPLIER_PREPAYMENTS,
  supplierPendingCreditsCents,
} from "@/lib/supplierBills";
import { formatDayShort, formatEur0 } from "@/lib/format";
import { Reveal } from "../fx/Reveal";

// 🏦 Contrôle bancaire — chaque euro sorti doit finir dans exactement une
// case (Société / Perso Badr / Perso Fahd), tout le reste est une anomalie
// affichée jusqu'à affectation. Lecture seule côté banque : aucun ordre de
// paiement, l'affectation n'écrit que dans le dashboard.
//
// Organisation (Badr 19/08) : « quand tout est vert c'est que c'est tout
// bon » — un bandeau de santé global + une tuile par domaine, le détail
// seulement en dessous. On repère l'anomalie d'un coup d'œil, on descend
// lire ensuite.

type Health = "green" | "amber" | "red";

const HEALTH_DOT: Record<Health, string> = {
  green: "bg-phosphor",
  amber: "bg-amber",
  red: "bg-red",
};
const HEALTH_TILE: Record<Health, string> = {
  green: "border-phosphor/30",
  amber: "border-amber/50 bg-amber/[0.04]",
  red: "border-red/50 bg-red/[0.05]",
};

interface DomainTile {
  title: string;
  health: Health;
  value: string;
  note: string;
}

function buildTiles(report: BankReport, unmappedCount: number): DomainTile[] {
  const control = report.control;
  const anomalies = control?.anomalies ?? [];
  const has = (k: AnomalyKind) => anomalies.some((a) => a.kind === k);

  const banques: DomainTile = !report.ready
    ? report.warnings.some((w) => w.startsWith("Wise"))
      ? { title: "Banques", health: "red", value: "Wise en erreur", note: "Voir le détail en dessous." }
      : { title: "Banques", health: "amber", value: "À brancher", note: "Ajouter les jetons dans Vercel — voir en dessous." }
    : report.slashConnected
      ? { title: "Banques", health: "green", value: "Wise ✓ · Slash ✓", note: "Les deux comptes remontent." }
      : {
          title: "Banques",
          health: "amber",
          value: "Wise ✓ · Slash ✗",
          note: report.warnings.some((w) => w.startsWith("Slash"))
            ? "Erreur Slash — voir le message en dessous."
            : "Clé Slash manquante dans Vercel (SLASH_API_TOKEN).",
        };

  const nAffecter = control?.parts.aAffecterCount ?? 0;
  const affectations: DomainTile =
    nAffecter > 0
      ? { title: "Affectations", health: "red", value: `${nAffecter} sans case`, note: "Chaque euro doit avoir une case — à traiter." }
      : has("DOUBLE_DEBIT")
        ? { title: "Affectations", health: "amber", value: "Double débit ?", note: "Deux passages identiques — voir le détail." }
        : { title: "Affectations", health: "green", value: "Tout est affecté", note: "Chaque euro a sa case." };

  const nAbo = anomalies.filter((a) => a.kind === "ABO_NON_DEBITE" || a.kind === "ABO_MONTANT").length;
  const abos: DomainTile =
    nAbo > 0
      ? { title: "Abonnements", health: "amber", value: `${nAbo} à vérifier`, note: "Abo LLC sans débit visible ou montant qui ne colle pas — voir le détail." }
      : { title: "Abonnements", health: "green", value: "Débits OK", note: "Abos LLC conformes (avances perso exclues)." };

  const meta: DomainTile = report.reconciliation?.metaPending
    ? { title: "Meta Ads", health: "amber", value: "Débité sur Slash", note: "Contrôle en attente du branchement Slash." }
    : has("META_ECART")
      ? { title: "Meta Ads", health: "red", value: "Écart banque/spend", note: "Le total de fenêtre ne colle pas — voir le détail." }
      : { title: "Meta Ads", health: "green", value: "Écart OK", note: "Débits banque ≈ spend enregistré." }
;

  const shopify: DomainTile = has("PAYOUT_MANQUANT")
    ? { title: "Shopify", health: "amber", value: "Payout en retard", note: "Aucun versement récent — voir le détail." }
    : { title: "Shopify", health: "green", value: "Payouts réguliers", note: "Les versements arrivent normalement." };

  const campagnes: DomainTile =
    unmappedCount > 0
      ? { title: "Campagnes Meta", health: "amber", value: `${unmappedCount} sans marché`, note: "Du spend non rattaché — voir la section en bas." }
      : { title: "Campagnes Meta", health: "green", value: "Toutes affectées", note: "Tout le spend est rattaché à un marché." };

  return [banques, affectations, abos, meta, shopify, campagnes];
}

function HealthHeader({ tiles }: { tiles: DomainTile[] }) {
  const worst: Health = tiles.some((t) => t.health === "red") ? "red" : tiles.some((t) => t.health === "amber") ? "amber" : "green";
  const nOff = tiles.filter((t) => t.health !== "green").length;
  const banner =
    worst === "green"
      ? { cls: "border-phosphor/40 bg-phosphor/[0.06] text-phosphor", txt: "✅ Tout est vert — rien à traiter." }
      : worst === "amber"
        ? { cls: "border-amber/50 bg-amber/[0.06] text-amber", txt: `⚠️ ${nOff} point(s) à surveiller — le détail est en dessous.` }
        : { cls: "border-red/50 bg-red/[0.07] text-red", txt: `🚨 ${nOff} point(s) à traiter — le détail est en dessous.` };
  return (
    <div className="flex flex-col gap-2">
      <div className={`rounded-lg border p-3 text-[13px] font-extrabold ${banner.cls}`}>{banner.txt}</div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {tiles.map((t) => (
          <div
            key={t.title}
            className={`rounded-lg border bg-panel p-2.5 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_14px_rgba(0,0,0,0.08)] ${HEALTH_TILE[t.health]}`}
          >
            <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-ink-faint">
              <span className={`h-2 w-2 shrink-0 rounded-full ${t.health !== "green" ? "animate-pulse" : ""} ${HEALTH_DOT[t.health]}`} />
              {t.title}
            </div>
            <div className="mt-0.5 text-[12.5px] font-extrabold text-ink">{t.value}</div>
            <p className="mt-0.5 text-[9.5px] leading-snug text-ink-faint">{t.note}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const CAT_CHIP: Record<BankTx["category"], { txt: string; cls: string }> = {
  META: { txt: "META", cls: "border-cyan/50 bg-cyan/10 text-cyan" },
  GOOGLE_ADS: { txt: "GOOGLE ADS", cls: "border-cyan/50 bg-cyan/10 text-cyan" },
  SHOPIFY: { txt: "SHOPIFY", cls: "border-phosphor/50 bg-phosphor/10 text-phosphor" },
  ABONNEMENT: { txt: "ABO", cls: "border-amber/50 bg-amber/10 text-amber" },
  FOURNISSEUR: { txt: "FOURNISSEUR", cls: "border-net-5/50 bg-net-5/10 text-net-5" },
  FRAIS: { txt: "FRAIS", cls: "border-red/40 bg-red/[0.06] text-red" },
  INTERNE: { txt: "INTERNE", cls: "border-line text-ink-faint" },
  AUTRE: { txt: "AUTRE", cls: "border-line text-ink-dim" },
};

function money(cents: number | null, currency = "EUR"): string {
  if (cents === null) return "—";
  const v = (cents / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${v} ${currency === "EUR" ? "€" : currency}`;
}

function GapTile({ title, bank, expected, note, pending = false }: { title: string; bank: number; expected: number; note: string; pending?: boolean }) {
  const gap = bank - expected;
  const gapCls = pending ? "text-ink-faint" : Math.abs(gap) <= Math.max(1000, expected * 0.05) ? "text-phosphor" : "text-red";
  return (
    <div className="flex-1 rounded-lg border border-line bg-panel p-3">
      <div className="text-[9.5px] font-bold uppercase tracking-wider text-ink-faint">{title}</div>
      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[12px]">
        <span>
          Banque <b className="tnum text-ink">{formatEur0(bank)}</b>
        </span>
        <span>
          Prévu <b className="tnum text-ink">{formatEur0(expected)}</b>
        </span>
        <span>
          Écart <b className={`tnum ${gapCls}`}>{gap >= 0 ? "+" : ""}{formatEur0(gap)}</b>
        </span>
      </div>
      <p className="mt-1 text-[10px] leading-snug text-ink-faint">{note}</p>
    </div>
  );
}

const LABEL_META: Record<TxLabel, { txt: string; cls: string }> = {
  SOCIETE: { txt: "SOCIÉTÉ", cls: "border-cyan/50 bg-cyan/10 text-cyan" },
  PERSO_BADR: { txt: "BADR", cls: "border-net-5/50 bg-net-5/10 text-net-5" },
  PERSO_FAHD: { txt: "ADNANE", cls: "border-amber/50 bg-amber/10 text-amber" },
  IGNORER: { txt: "IGNORÉE", cls: "border-line text-ink-faint" },
};

function AssignButtons({ tx, compact = false }: { tx: BankTx; compact?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function assign(kind: TxLabel) {
    setBusy(true);
    try {
      const res = await fetch("/api/bank-label", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bank: tx.bank, txId: tx.txId, kind }),
      });
      if (res.ok) router.refresh();
      else alert((await res.json()).reason ?? "Erreur");
    } finally {
      setBusy(false);
    }
  }
  const btn = "rounded border px-1.5 py-0.5 text-[9.5px] font-bold transition-colors disabled:opacity-40";
  return (
    <span className={`flex flex-wrap gap-1 ${compact ? "" : "mt-1"}`}>
      <button disabled={busy} onClick={() => assign("SOCIETE")} className={`${btn} border-cyan/50 text-cyan hover:bg-cyan/10`}>Société</button>
      <button disabled={busy} onClick={() => assign("PERSO_BADR")} className={`${btn} border-net-5/50 text-net-5 hover:bg-net-5/10`}>Badr</button>
      <button disabled={busy} onClick={() => assign("PERSO_FAHD")} className={`${btn} border-amber/50 text-amber hover:bg-amber/10`}>Adnane</button>
      <button disabled={busy} onClick={() => assign("IGNORER")} className={`${btn} border-line text-ink-faint hover:bg-terminal-2`}>Ignorer</button>
    </span>
  );
}

// 🧾 Le comptable — entrées / sorties / marge RÉELLE encaissée depuis le
// 01/08 (vision Badr 19/08 : « cet onglet devient le monitoring contrôle de
// l'entreprise, comme si on avait un comptable qui suit tout, pour avoir la
// vraie marge réelle et savoir où on perd l'argent »). Base CAISSE : ce qui
// est réellement entré et sorti des banques — les frais bancaires/FX et
// frais de virement fournisseur sont DEDANS (contrairement au net théorique
// du dashboard). L'INTERNE (conversions, virements entre nos comptes,
// remboursements de carte) est exclu ; le perso est hors marge.
function Row({ l, v, strong = false }: { l: string; v: number; strong?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-2 ${strong ? "font-extrabold text-ink" : "text-ink-dim"}`}>
      <span className="text-[11px]">{l}</span>
      <span className="tnum text-[12px]">{formatEur0(v)}</span>
    </div>
  );
}

function CashflowBlock({ report }: { report: BankReport }) {
  const since = report.reconciliation?.sinceDay;
  if (!since || report.txs.length === 0) return null;
  const inWin = report.txs.filter((t) => t.day >= since && t.label !== "IGNORER" && t.category !== "INTERNE");
  const eurOf = (t: BankTx) => t.amountEurCents ?? 0;
  const sum = (f: (t: BankTx) => boolean) => inWin.filter(f).reduce((a, t) => a + eurOf(t), 0);
  const isPerso = (t: BankTx) => t.label === "PERSO_BADR" || t.label === "PERSO_FAHD";

  const entreesShopify = sum((t) => t.category === "SHOPIFY" && eurOf(t) > 0);
  const entreesAutres = sum((t) => t.category !== "SHOPIFY" && eurOf(t) > 0 && !isPerso(t));
  // « || 0 » : évite le « -0 € » d'affichage quand un poste est vide
  const out = (f: (t: BankTx) => boolean) => -sum((t) => eurOf(t) < 0 && !isPerso(t) && f(t)) || 0;
  const meta = out((t) => t.category === "META");
  const googleAds = out((t) => t.category === "GOOGLE_ADS");
  const fournisseur = out((t) => t.category === "FOURNISSEUR");
  const abos = out((t) => t.category === "ABONNEMENT");
  const frais = out((t) => t.category === "FRAIS");
  const societeAutre = out((t) => t.category === "AUTRE" && t.label === "SOCIETE");
  const entrees = entreesShopify + entreesAutres;
  const sorties = meta + googleAds + fournisseur + abos + frais + societeAutre;
  const dd = `${since.slice(8, 10)}/${since.slice(5, 7)}`;
  return (
    <div className="card-shadow rounded-lg border border-line bg-panel p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[9.5px] font-bold uppercase tracking-wider text-ink-faint">
          🧾 Encaissé / décaissé depuis le {dd}
        </div>
        {report.cashbackTotalEurCents !== null && report.cashbackTotalEurCents > 0 && (
          // 🎁 Macaron cashback (Badr 19/08 : « le total depuis le tout début
          // pour se rendre compte de ce que ça représente »)
          <span className="shrink-0 rounded-full border border-phosphor/50 bg-phosphor/10 px-2.5 py-1 text-[10.5px] font-extrabold text-phosphor shadow-[0_0_10px_rgba(0,200,120,0.15)]">
            🎁 Cashback total : +{formatEur0(report.cashbackTotalEurCents)}
          </span>
        )}
      </div>
      <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <div className="text-[9px] font-bold uppercase tracking-wider text-phosphor">💶 Entrées</div>
          <Row l="Versements Shopify" v={entreesShopify} />
          {entreesAutres > 0 && <Row l="Autres entrées" v={entreesAutres} />}
          <div className="border-t border-line-soft pt-1"><Row l="Total entré" v={entrees} strong /></div>
        </div>
        <div className="flex flex-col gap-1">
          <div className="text-[9px] font-bold uppercase tracking-wider text-red">💸 Sorties société</div>
          <Row l="Meta Ads (frais FX inclus)" v={meta} />
          {googleAds > 0 && <Row l="Google Ads (suivi API à brancher)" v={googleAds} />}
          <Row l="Fournisseur (frais de virement inclus)" v={fournisseur} />
          {(report.control?.fournisseurPointage ?? []).map((l) => (
            <div key={l} className="pl-2 text-[9px] leading-snug text-ink-faint">{l}</div>
          ))}
          <Row l="Abonnements & équipe" v={abos} />
          {frais > 0 && <Row l="Frais bancaires" v={frais} />}
          {societeAutre > 0 && <Row l="Autres (affectées Société)" v={societeAutre} />}
          <div className="border-t border-line-soft pt-1"><Row l="Total sorti" v={sorties} strong /></div>
        </div>
      </div>
    </div>
  );
}


// 🧮 RAPPROCHEMENT DEPUIS LE TOUT DÉBUT (Badr 04/09 : « dis-lui d'aller tout
// retracer depuis le tout début […] et pour savoir cet écart est imputé à
// qui »). Le reste de cette page contrôle des DÉTAILS sur 30 jours ; ce bloc
// répond à la seule question qui compte pour la trésorerie : le net gagné
// est-il vraiment sur les comptes, et sinon où est parti le reste.
function TreasuryBlock({ treasury, setup }: { treasury: TreasuryBridge | null; setup: string | null }) {
  if (!treasury) {
    return setup ? (
      <p className="rounded-lg border border-line bg-panel/40 p-2.5 text-[10.5px] text-ink-dim">🧮 {setup}</p>
    ) : null;
  }
  const t = treasury;
  const eur = (c: number) => formatEur0(c);
  const ligne = (label: string, cents: number | null, opts: { fort?: boolean; signe?: "+" | "−"; note?: string } = {}) => (
    <div
      key={label}
      className={`flex items-baseline justify-between gap-2 ${opts.fort ? "border-t border-line-soft pt-1.5 font-semibold text-ink" : "text-ink-dim"}`}
    >
      <span>
        {opts.signe ? `${opts.signe} ` : ""}
        {label}
        {opts.note && <span className="block text-[9.5px] text-ink-faint">{opts.note}</span>}
      </span>
      <span className="tnum flex-none">{cents === null ? "—" : eur(cents)}</span>
    </div>
  );

  return (
    <div className="rounded-lg border border-line bg-panel/40 p-3.5">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-sm font-semibold">🧮 Rapprochement trésorerie</span>
        <span className="text-[10px] text-ink-faint">
          depuis le {t.scanSinceDay ? t.scanSinceDay.slice(8, 10) + "/" + t.scanSinceDay.slice(5, 7) : "début"}
        </span>
      </div>

      <div className="flex flex-col gap-1 text-[11px]">
        {ligne("Net cumulé (charges fixes déduites)", t.netCumuleCents)}
        {ligne("Dû au fournisseur, pas encore facturé", t.supplierUnbilledCents, {
          signe: "+",
          note: "déjà déduit du net, mais toujours en banque tant que le virement n'est pas parti",
        })}
        {t.supplierOwedCents > 0 && ligne("Reste dû sur factures reçues", t.supplierOwedCents, { signe: "+" })}
        {t.supplierPrepaidCents > 0 &&
          ligne("Acomptes déjà virés au fournisseur", t.supplierPrepaidCents, {
            signe: "−",
            note: "sortis de la banque avant la facture — voir le bloc Fournisseur",
          })}
        {ligne("Cash que l'activité a produit", t.cashTheoriqueCents, { fort: true })}
        {ligne("Argent en route chez Shopify", t.enRouteCents, {
          signe: "−",
          note: t.enRouteEstimated ? "≈ estimation (CA − frais des 5 derniers jours) — scope Shopify à ajouter pour l'exact" : undefined,
        })}
        {ligne("Devrait être sur les comptes", t.attenduEnBanqueCents, { fort: true })}
        {ligne("Solde réel Wise + Slash", t.bankCents, {
          note: t.bankSkipped.length > 0 ? `hors ${t.bankSkipped.join(", ")} (pas de taux)` : undefined,
        })}
      </div>

      {t.fxSplit && t.fxSplit.totalCents > 0 && (
        <p className="mt-2 text-[10px] leading-snug text-ink-dim">
          💱 Frais de change depuis le début : <b className="tnum text-ink">{eur(t.fxSplit.totalCents)}</b> — dont{" "}
          <b className="tnum text-ink">{eur(t.fxSplit.metaCents)}</b> causés par Meta (
          {Math.round((t.fxSplit.metaCents / t.fxSplit.totalCents) * 100)} %), {eur(t.fxSplit.autreCents)} par les autres
          dépenses société, {eur(t.fxSplit.persoCents)} par le perso. Meta payé depuis Wise en euros depuis le 04/09 :
          cette ligne doit cesser de grossir.
        </p>
      )}

      {t.gapCents !== null && (
        <div
          className={`mt-2.5 rounded-md border p-2.5 ${
            Math.abs(t.unexplainedCents ?? t.gapCents) > 100000 ? "border-amber/50 bg-amber/[0.05]" : "border-phosphor/30"
          }`}
        >
          <div className="flex items-baseline justify-between text-[11.5px] font-semibold">
            <span>Écart total</span>
            <span className="tnum">{eur(t.gapCents)}</span>
          </div>
          {t.bankSkipped.length > 0 && (
            <p className="mt-1 text-[10px] leading-snug text-amber">
              ⚠️ Solde{" "}
              {t.bankSkipped.join(", ")}{" "}
              non converti (pas de taux) : il n&apos;entre pas dans le solde réel,
              donc l&apos;écart ci-dessus est surestimé d&apos;autant. À lire comme un plafond, pas comme un montant.
            </p>
          )}
          {t.gapLines.length === 0 ? (
            <p className="mt-1 text-[10px] text-ink-faint">
              Balayage bancaire indisponible — l&apos;écart est affiché sans sa ventilation.
            </p>
          ) : (
            <ul className="mt-1.5 flex flex-col gap-1 text-[10.5px]">
              {t.gapLines.map((l) => (
                <li key={l.label} className="flex items-baseline justify-between gap-2">
                  <span className="text-ink-dim">
                    {l.label}
                    <span className="block text-[9.5px] text-ink-faint">{l.detail}</span>
                  </span>
                  <span className="tnum flex-none text-ink">{eur(l.cents)}</span>
                </li>
              ))}
              {t.unexplainedCents !== null && (
                <li className="flex items-baseline justify-between gap-2 border-t border-line-soft pt-1 font-semibold">
                  <span className={t.unexplainedCents > UNEXPLAINED_ALERT_CENTS ? "text-red" : "text-phosphor"}>
                    Inexpliqué depuis le {PRE_LLC_RESIDUAL.day.slice(8, 10)}/{PRE_LLC_RESIDUAL.day.slice(5, 7)}
                    <span className="block text-[9.5px] font-normal text-ink-faint">
                      {t.scanPartial
                        ? "⚠️ le balayage ne couvre pas toute l'histoire — ce reste contient l'avant."
                        : t.unexplainedCents > UNEXPLAINED_ALERT_CENTS
                          ? "🚨 trou NEUF — l'avant-LLC est déjà absorbé par la ligne Revolut. À chercher."
                          : "arrondis de change et décalages de facturation. Rien à chercher."}
                    </span>
                  </span>
                  <span className="tnum flex-none">{eur(t.unexplainedCents)}</span>
                </li>
              )}
            </ul>
          )}

          {t.attribution && (
            <div className="mt-2 border-t border-line-soft pt-1.5 text-[10.5px]">
              <div className="mb-1 font-semibold text-ink">Imputé à</div>
              <div className="flex items-baseline justify-between">
                <span className="text-ink-dim">🟠 Badr</span>
                <span className="tnum">{eur(t.attribution.badrCents)}</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-ink-dim">🔵 Adnane</span>
                <span className="tnum">{eur(t.attribution.adnaneCents)}</span>
              </div>
              <p className="mt-1 text-[9.5px] text-ink-faint">
                Le perso est nominatif ({eur(t.attribution.persoBadrCents)} Badr ·{" "}
                {eur(t.attribution.persoFahdCents)} Adnane).
                {t.attribution.revolutAdnaneCents > 0 && (
                  <>
                    {" "}
                    Le reliquat Revolut pré-LLC ({eur(t.attribution.revolutAdnaneCents)}) est 100 % Adnane (décision Badr 04/09).
                  </>
                )}{" "}
                Les frais et Google Ads suivent la règle des associés au jour du débit.
                {t.attribution.reparti5050Cents > 0 && (
                  <>
                    {" "}
                    {eur(t.attribution.reparti5050Cents)} (supplément Meta + inexpliqué) n&apos;ont pas de date exploitable :
                    répartis 50/50 — c&apos;est une répartition, pas une mesure.
                  </>
                )}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// 🏭 FOURNISSEUR (Badr 04/09 : « une ligne où il y a les factures payées, la
// prochaine facture, et une fois que je t'envoie la facture tu la déduis de ce
// qui a déjà été viré — pour anticiper ce qu'il pourra me réclamer »). Les
// factures et acomptes sont saisis à la main (supplierBills.ts) ; la prochaine
// facture est ESTIMÉE par le moteur sur les commandes pas encore facturées
// (calibré ±1 % sur les deux factures d'août, taxe incluse).
function SupplierBlock({ treasury }: { treasury: TreasuryBridge | null }) {
  const next = treasury?.supplierNext ?? null;
  const prepaid = treasury?.supplierPrepaidCents ?? 0;
  const avoirs = supplierPendingCreditsCents();
  const reclamable = next ? Math.max(next.cents - prepaid - avoirs, 0) : null;
  const dm = (d: string | null) => (d ? `${d.slice(8, 10)}/${d.slice(5, 7)}` : "—");
  return (
    <div className="rounded-lg border border-line bg-panel/40 p-3.5">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-sm font-semibold">🏭 {SUPPLIER_NAME}</span>
        <span className="text-[10px] text-ink-faint">factures reçues · acomptes · prochaine facture</span>
      </div>

      <ul className="flex flex-col gap-1 text-[11px]">
        {SUPPLIER_BILLS.map((b) => {
          const reste = b.totalCents - b.paidCents;
          return (
            <li key={b.ref} className="flex items-baseline justify-between gap-2">
              <span className="text-ink-dim">
                {b.status === "payee" ? "✓" : reste > 0 ? "⏳" : "•"} {b.ref}{" "}
                <span className="text-[9.5px] text-ink-faint">
                  {b.ordersFrom}→{b.ordersTo} · {b.ordersCount} cmd · émise le {dm(b.issuedDay)}
                </span>
              </span>
              <span className={`tnum flex-none ${reste > 0 ? "text-amber" : "text-ink"}`}>
                {formatEur0(b.totalCents)}
                {reste > 0 && <span className="text-[9.5px]"> · reste {formatEur0(reste)}</span>}
              </span>
            </li>
          );
        })}
        {SUPPLIER_PREPAYMENTS.filter((p) => p.appliedTo === null).map((p) => (
          <li key={`${p.day}-${p.eurCents}`} className="flex items-baseline justify-between gap-2">
            <span className="text-ink-dim">
              💸 Acompte viré le {dm(p.day)}{" "}
              <span className="text-[9.5px] text-ink-faint">({p.original}) — pas encore de facture en face</span>
            </span>
            <span className="tnum flex-none text-cyan">−{formatEur0(p.eurCents)}</span>
          </li>
        ))}
      </ul>

      <div className="mt-2 border-t border-line-soft pt-2 text-[11px]">
        {next === null ? (
          <p className="text-ink-faint">Prochaine facture : estimation indisponible (commandes illisibles).</p>
        ) : (
          <>
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-semibold text-ink">
                Prochaine facture (estimée)
                <span className="block text-[9.5px] font-normal text-ink-faint">
                  {next.orders} commandes {next.firstOrder ?? ""}→{next.lastOrder ?? ""} · du {dm(next.firstDay)} au {dm(next.lastDay)} ·
                  COGS + taxe, calibré ±1 % sur les 2 dernières factures
                </span>
              </span>
              <span className="tnum flex-none font-semibold">{formatEur0(next.cents)}</span>
            </div>
            {(prepaid > 0 || avoirs > 0) && (
              <div className="mt-1 flex flex-col gap-0.5 text-ink-dim">
                {prepaid > 0 && (
                  <div className="flex items-baseline justify-between">
                    <span>− acomptes déjà virés</span>
                    <span className="tnum">{formatEur0(prepaid)}</span>
                  </div>
                )}
                {avoirs > 0 && (
                  <div className="flex items-baseline justify-between">
                    <span>
                      − avoirs promis{" "}
                      <span className="text-[9.5px] text-ink-faint">({SUPPLIER_PENDING_CREDITS.map((c) => c.label).join(" · ")})</span>
                    </span>
                    <span className="tnum">{formatEur0(avoirs)}</span>
                  </div>
                )}
              </div>
            )}
            <div className="mt-1.5 flex items-baseline justify-between border-t border-line-soft pt-1.5 font-semibold">
              <span className="text-ink">Ce qu&apos;il pourra encore réclamer</span>
              <span className={`tnum flex-none ${reclamable && reclamable > 0 ? "text-amber" : "text-phosphor"}`}>
                {reclamable === null ? "—" : formatEur0(reclamable)}
              </span>
            </div>
            <p className="mt-1 text-[9.5px] text-ink-faint">
              À réception de sa facture : on vérifie la plage de commandes et la ligne TOTAL contre cette estimation, on déduit
              les acomptes, et l&apos;écart éventuel (packing, LS surfacturées) est pointé ligne à ligne avant de payer.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// 🏛️ À qui appartient l'argent des comptes (règle Badr 19/08) : le net de
// l'onglet Année ne bouge JAMAIS ; ici on répartit le SOLDE réel — la part
// de Badr = son net Année (moins son perso banque, 0 tant que la carte Badr
// dort), TOUT LE RESTE = Adnane. Sa part doit dépasser son net Année : la
// différence = l'apport perso qu'il a injecté dans la LLC et qui y est encore.
/** Les chiffres « ce qu'il reste à chacun », calculés UNE fois — servis par
 * le résumé en tête d'onglet et par le bloc détaillé. null sans solde lu. */
/**
 * Branche le rapport bancaire sur le calcul pur `computeOwnership`
 * (treasury.ts, testé) : ici on ne fait que choisir les bonnes sources.
 *
 * Ce que chacun a « consommé » est la ventilation COMPLÈTE de l'écart
 * (TreasuryAttribution) : ses dépenses perso, sa part des frais bancaires, du
 * supplément Meta et de Google Ads, plus pour Adnane le reliquat resté sur son
 * Revolut. Retrancher les seules dépenses perso — ce que faisait la première
 * version — laissait ~14 000 € de dépenses réelles se faire passer pour un
 * trou (Badr 07/09).
 *
 * Tout depuis le DÉBUT, jamais la fenêtre 30 jours du contrôle : on retranche
 * d'un net cumulé depuis le début, les deux doivent couvrir la même période.
 */
function ownershipFrom(report: BankReport, annee: { badrCents: number; adnaneCents: number }) {
  const t = report.treasury;
  const known = report.balances.filter((b) => b && typeof b.amountEurCents === "number");
  if (known.length === 0 || !t?.attribution) return null;
  const a = t.attribution;
  const enRouteExact = report.enRoute && !report.enRoute.missingScopes ? report.enRoute.totalEurCents : null;
  const enRouteCents = enRouteExact ?? report.enRouteEstimateCents ?? 0;
  const detteFournisseur = t.supplierUnbilledCents + t.supplierOwedCents - t.supplierPrepaidCents;
  const totalCents = known.reduce((acc, b) => acc + (b.amountEurCents ?? 0), 0);
  const metaExcess = t.metaExcessCents ?? 0;
  const own = computeOwnership({
    netBadrCents: annee.badrCents,
    netAdnaneCents: annee.adnaneCents,
    consommeBadrCents: a.badrCents,
    consommeAdnaneCents: a.adnaneCents,
    bankCents: totalCents,
    enRouteCents,
    // Ce qu'on n'explique pas ne compte NI comme argent à nous, ni comme
    // dépense de quelqu'un : il ressort dans le trou, en rouge.
    metaAdvanceCents: 0,
    supplierDebtCents: detteFournisseur,
  });
  return {
    totalCents,
    metaExcess,
    metaByMonth: t.metaByMonth,
    enRouteCents,
    enRouteExact,
    detteFournisseur,
    revolutAdnane: a.revolutAdnaneCents,
    consommeBadr: a.badrCents,
    consommeAdnane: a.adnaneCents,
    persoBadr: a.persoBadrCents,
    persoAdnane: a.persoFahdCents,
    fraisCents: a.badrCents + a.adnaneCents - a.persoBadrCents - a.persoFahdCents - a.revolutAdnaneCents,
    reparti5050Cents: a.reparti5050Cents,
    partBadr: own.partBadrCents,
    partAdnane: own.partAdnaneCents,
    duCents: own.dueCents,
    disponibleCents: own.availableCents,
    trouCents: own.gapCents,
  };
}

// 🧾 EN UN COUP D'ŒIL — Badr 05/09 : « je veux juste voir les écarts, combien
// d'argent reste pour Badr, combien pour Adnane, est-ce qu'il y a une dépense
// inconnue, et s'il y a un trou par rapport au net affiché. Pas 100 000 infos. »
// Quatre réponses, rien d'autre ; le détail est replié derrière un bouton.
function SummaryTile({ title, value, cls, note }: { title: string; value: string; cls: string; note?: string }) {
  return (
    <div className="rounded-lg border border-line bg-panel p-3">
      <div className="text-[9px] font-bold uppercase tracking-wider text-ink-faint">{title}</div>
      <div className={`tnum text-[20px] font-extrabold ${cls}`}>{value}</div>
      {note && <div className="mt-0.5 text-[9.5px] leading-snug text-ink-faint">{note}</div>}
    </div>
  );
}

function SummaryBlock({
  report,
  annee,
}: {
  report: BankReport;
  annee: { badrCents: number; adnaneCents: number } | null;
}) {
  const own = annee ? ownershipFrom(report, annee) : null;
  const aAffecter = report.control?.parts.aAffecterCount ?? 0;
  const aAffecterCents = report.control?.parts.aAffecterCents ?? 0;
  const estime = own ? own.enRouteExact === null : false;
  // Un en route ESTIMÉ vaut ±2 000 € : on ne crie pas au trou sur une
  // estimation, on le dit.
  const alerte = own !== null && !estime && Math.abs(own.trouCents) > UNEXPLAINED_ALERT_CENTS;
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <SummaryTile
          title="Net Badr"
          value={own ? formatEur0(own.partBadr) : "—"}
          cls="text-net-5"
          note={own ? `net Année − ${formatEur0(own.consommeBadr)} déjà consommés` : "net Année indisponible"}
        />
        <SummaryTile
          title="Net Adnane"
          value={own ? formatEur0(own.partAdnane) : "—"}
          cls="text-amber"
          note={own ? `net Année − ${formatEur0(own.consommeAdnane)} déjà consommés (lui + Fahd)` : "net Année indisponible"}
        />
        <SummaryTile
          title="CA pas encore encaissé"
          value={own ? formatEur0(own.enRouteCents) : "—"}
          cls="text-cyan"
          note={
            own
              ? estime
                ? "≈ versements Shopify en attente (estimé, ±2 000 €)"
                : "versements Shopify en attente"
              : "indisponible"
          }
        />
        <SummaryTile
          title="Trou dans les comptes"
          value={own ? (Math.abs(own.trouCents) < 100 ? "Non" : formatEur0(own.trouCents)) : "—"}
          cls={own === null ? "text-ink-dim" : alerte ? "text-red" : "text-phosphor"}
          note={
            own === null
              ? "rapprochement indisponible"
              : Math.abs(own.trouCents) < 100
                ? "chaque euro sorti des comptes a une case"
                : `à expliquer${estime ? " · CA pas encore encaissé estimé (±2 000 €)" : ""}`
          }
        />
      </div>

      {/* La vérification, en une phrase : ce qu'on possède contre ce qui
          existe (Badr 07/09 : « le total après paiement du fournisseur, le CA
          mérité à date, et la diff entre les deux »). */}
      {own && (
        <div className="rounded-lg border border-line bg-panel px-3 py-2 text-[11px] leading-relaxed">
          <div>
            Sur les comptes <b className="tnum text-ink">{formatEur0(own.totalCents)}</b>
            {" + "}CA pas encore encaissé <b className="tnum text-cyan">{formatEur0(own.enRouteCents)}</b>
            {own.detteFournisseur !== 0 && (
              <>
                {" − "}encore dû à Panda <b className="tnum text-ink">{formatEur0(own.detteFournisseur)}</b>
              </>
            )}
            {" = "}
            <b className="tnum text-ink">{formatEur0(own.disponibleCents)}</b>
          </div>
          <div>
            Net Badr <b className="tnum text-net-5">{formatEur0(own.partBadr)}</b>
            {" + "}Net Adnane <b className="tnum text-amber">{formatEur0(own.partAdnane)}</b>
            {" = "}
            <b className="tnum text-ink">{formatEur0(own.duCents)}</b>
          </div>
          <div className="mt-0.5 border-t border-line-soft pt-1">
            {Math.abs(own.trouCents) < 100 ? (
              <b className="text-phosphor">Les deux tombent juste : aucun trou.</b>
            ) : (
              <>
                Différence <b className={`tnum ${alerte ? "text-red" : "text-amber"}`}>{formatEur0(own.trouCents)}</b>
                {estime && " — dont ±2 000 € d'incertitude sur le CA pas encore encaissé."}
              </>
            )}
          </div>
        </div>
      )}

      <div
        className={`rounded-lg border px-3 py-2 text-[11px] ${
          aAffecter === 0 ? "border-line bg-panel text-ink-dim" : "border-red/50 bg-red/[0.06] text-red"
        }`}
      >
        Dépense inconnue ?{" "}
        <b>{aAffecter === 0 ? "Non — chaque euro sorti a une case." : `${aAffecter} ligne${aAffecter > 1 ? "s" : ""} à affecter (${formatEur0(aAffecterCents)}), ci-dessous.`}</b>
      </div>
    </div>
  );
}

// 🧾 CE QUE SHOPIFY A RETENU entre le CA encaissé et les versements — la vue
// de Shopify (résumés de versements) face à celle du dashboard (CA, frais,
// remboursements comptés) sur la même période. C'est ici qu'un « trou » qui
// n'est ni en banque ni dans les sorties se nomme : litiges, réserve, frais
// non comptés, CA surestimé.
function PayoutsSummaryBlock({ ps }: { ps: NonNullable<BankReport["payoutsSummary"]> }) {
  const sh = ps.shopifyEur;
  const d = ps.dashEur;
  const rows: { label: string; shopify: number; dash: number | null; note?: string }[] = [
    { label: "CA encaissé", shopify: sh.chargesGross, dash: d.ca, note: "ventes passées par Shopify Payments" },
    { label: "− Frais Shopify", shopify: sh.fees, dash: d.fees, note: "traitement + change + frais sur remboursements" },
    { label: "− Remboursements", shopify: sh.refunds, dash: d.refunds },
    { label: "− Ajustements / litiges", shopify: sh.adjustments, dash: null, note: "chargebacks, corrections — le net ne les compte pas" },
    { label: "− Réserve retenue", shopify: sh.reserved, dash: null, note: "fonds gardés par Shopify" },
    { label: "= Versé (ou programmé)", shopify: sh.net, dash: d.expected, note: "dashboard : CA − frais − remboursements" },
  ];
  const ecartNet = d.expected - sh.net;
  return (
    <div className="card-shadow rounded-lg border border-line bg-panel p-3">
      <div className="text-[9.5px] font-bold uppercase tracking-wider text-ink-faint">
        🧾 Entre le CA et les versements : ce que Shopify a retenu (depuis le {formatDayShort(d.sinceDay)})
      </div>
      <div className="mt-1 overflow-x-auto">
        <table className="w-full min-w-[420px] text-left text-[11px]">
          <thead>
            <tr className="border-b border-hair text-[9px] uppercase text-ink-faint">
              <th className="py-1 pr-2">Poste</th>
              <th className="py-1 pr-2 text-right">Shopify dit</th>
              <th className="py-1 pr-2 text-right">Le dash compte</th>
              <th className="py-1 text-right">Écart</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const ec = r.dash === null ? null : r.shopify - r.dash;
              return (
                <tr key={r.label} className="border-b border-hair/50">
                  <td className="py-1 pr-2">
                    {r.label}
                    {r.note && <span className="block text-[9.5px] text-ink-faint">{r.note}</span>}
                  </td>
                  <td className="tnum py-1 pr-2 text-right">{formatEur0(r.shopify)}</td>
                  <td className="tnum py-1 pr-2 text-right text-ink-faint">{r.dash === null ? "—" : formatEur0(r.dash)}</td>
                  <td className={`tnum py-1 text-right ${ec === null ? (r.shopify > 0 ? "text-amber" : "text-ink-faint") : Math.abs(ec) < 50000 ? "text-ink-faint" : "text-red"}`}>
                    {ec === null ? (r.shopify > 0 ? "non compté" : "—") : `${ec >= 0 ? "+" : "−"}${formatEur0(Math.abs(ec))}`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-1 text-[10.5px] leading-snug text-ink-dim">
        {Math.abs(ecartNet) < 50000 ? (
          <b className="text-phosphor">Le dash et Shopify racontent la même histoire.</b>
        ) : (
          <>
            Le dash attend <b className="tnum text-ink">{formatEur0(ecartNet)}</b> de plus que ce que Shopify a
            versé ou programmé : cet argent n&apos;est jamais entré, il a été retenu ou n&apos;a jamais été encaissé —
            les lignes ci-dessus disent où.
          </>
        )}
      </p>
      <p className="mt-1 text-[9.5px] leading-snug text-ink-faint">
        Devises converties en euros (USD au taux Wise, CAD/GBP au dernier taux connu) : une petite différence de
        change est normale. Détail par devise :{" "}
        {ps.byCurrency.map((c) => `${c.currency} ${c.count} versements, net ${(c.net / 100).toLocaleString("fr-FR", { maximumFractionDigits: 0 })}`).join(" · ")}.
      </p>
    </div>
  );
}

// 🏦 DEUX PÉRIODES — Badr 08/09 : l'écart posé au bon endroit. Avant le
// 21/07 tout passait par le Revolut d'Adnane (le dash ne le voit pas) ; depuis,
// tout passe par Wise + Slash (le dash voit tout).
function PeriodsBlock({ t }: { t: NonNullable<BankReport["treasury"]> }) {
  const p = t.periods;
  if (!p) return null;
  const llcOk = p.llc.unexplainedCents !== null && Math.abs(p.llc.unexplainedCents) <= UNEXPLAINED_ALERT_CENTS;
  return (
    <div className="card-shadow rounded-lg border border-line bg-panel p-3">
      <div className="text-[9.5px] font-bold uppercase tracking-wider text-ink-faint">
        🏦 Deux périodes — la coupure est le premier versement Shopify reçu par la société ({formatDayShort(p.llcStartDay)})
      </div>
      <div className="mt-1.5 grid grid-cols-1 gap-2 text-[12px] sm:grid-cols-2">
        <div className="rounded border border-line-soft p-2">
          <div className="font-semibold">Avant le {formatDayShort(p.llcStartDay)} — Revolut d&apos;Adnane</div>
          <div className="mt-1 text-[11px] leading-snug text-ink-dim">
            Net gagné <b className="tnum text-ink">{formatEur0(p.revolut.netCents)}</b>
            {p.revolut.cogsPaidByLlcCents > 0 && (
              <>
                {" + "}Panda payé par la LLC pour ces ventes{" "}
                <b className="tnum text-ink">{formatEur0(p.revolut.cogsPaidByLlcCents)}</b>
              </>
            )}
            {p.revolut.caOldAccountCents > 0 && (
              <>
                {" + "}CA d&apos;après la coupure encaissé par l&apos;ancien compte Shopify{" "}
                <b className="tnum text-ink">{formatEur0(p.revolut.caOldAccountCents)}</b>
              </>
            )}
            {p.revolut.paidForLlc.totalCents > 0 && (
              <>
                {" − "}Meta / Panda / abonnements de la LLC payés depuis le Revolut{" "}
                <b className="tnum text-ink">{formatEur0(p.revolut.paidForLlc.totalCents)}</b>
              </>
            )}
            {p.revolut.transfersToLlcCents > 0 && (
              <>
                {" − "}apports vers la LLC <b className="tnum text-ink">{formatEur0(p.revolut.transfersToLlcCents)}</b>
              </>
            )}
          </div>
          <div className="mt-1 text-[12px]">
            À justifier par Adnane <b className="tnum text-ink">{formatEur0(p.revolut.toJustifyCents)}</b>
            {p.revolut.offBook.totalCents > 0 && (
              <>
                {" − "}sorti hors compta <b className="tnum text-ink">{formatEur0(p.revolut.offBook.totalCents)}</b>
                <span className="text-[10px] text-ink-faint">
                  {" ("}
                  {p.revolut.offBook.items.map((l) => `${l.label} ${formatEur0(l.cents)}${l.note ? ` · ${l.note}` : ""}`).join(", ")}
                  {")"}
                </span>
              </>
            )}
          </div>
          <div className="mt-1 text-[13px]">
            Doit rester sur le Revolut d&apos;Adnane <b className="tnum text-amber">{formatEur0(p.revolut.shouldRemainCents)}</b>
          </div>
          <div className="text-[10px] leading-snug text-ink-faint">
            Le dash ne voit pas ce compte : à comparer au solde réel du Revolut. Un écart est soit une dépense hors compta
            oubliée ici, soit un trou.
          </div>
        </div>
        <div className="rounded border border-line-soft p-2">
          <div className="font-semibold">Depuis le {formatDayShort(p.llcStartDay)} — Wise + Slash</div>
          <div className="mt-1 text-[11px] leading-snug text-ink-dim">
            Net gagné <b className="tnum text-ink">{formatEur0(p.llc.netCents)}</b> → attendu sur les comptes{" "}
            <b className="tnum text-ink">{p.llc.attenduEnBanqueCents === null ? "—" : formatEur0(p.llc.attenduEnBanqueCents)}</b>
            {" vs réel "}
            <b className="tnum text-ink">{t.bankCents === null ? "—" : formatEur0(t.bankCents)}</b>
          </div>
          <div className="mt-1 text-[12px]">
            Trou sur cette période{" "}
            <b className={`tnum ${p.llc.unexplainedCents === null ? "text-ink-dim" : llcOk ? "text-phosphor" : "text-red"}`}>
              {p.llc.unexplainedCents === null ? "—" : llcOk ? "Non" : formatEur0(p.llc.unexplainedCents)}
            </b>
          </div>
          <div className="text-[10px] leading-snug text-ink-faint">
            Après perso, frais et Google Ads. C&apos;est ici qu&apos;un trou serait un vrai trou : chaque versement
            Shopify et chaque débit sont lus.{t.enRouteEstimated ? " En route estimé (±2 000 €)." : ""}
          </div>
        </div>
      </div>
      {p.llc.outByCategory.length > 0 && (
        <details className="mt-2 border-t border-line-soft pt-2 text-[11px]" open>
          <summary className="cursor-pointer text-ink-dim">
            🔎 Sorti des comptes depuis le {formatDayShort(p.llcStartDay)}, poste par poste, face à ce que le net a compté
          </summary>
          <div className="mt-1 overflow-x-auto">
            <table className="w-full min-w-[420px] text-left text-[11px]">
              <thead>
                <tr className="border-b border-hair text-[9px] uppercase text-ink-faint">
                  <th className="py-1 pr-2">Poste</th>
                  <th className="py-1 pr-2 text-right">Sorti en banque</th>
                  <th className="py-1 pr-2 text-right">Compté dans le net</th>
                  <th className="py-1 text-right">Écart</th>
                </tr>
              </thead>
              <tbody>
                {p.llc.outByCategory.map((c) => {
                  const ecart = c.netCents === null ? null : c.bankCents - c.netCents;
                  return (
                    <tr key={c.category} className="border-b border-hair/50">
                      <td className="py-1 pr-2">
                        {c.category}
                        {c.note && <span className="block text-[9.5px] text-ink-faint">{c.note}</span>}
                      </td>
                      <td className="tnum py-1 pr-2 text-right">{formatEur0(c.bankCents)}</td>
                      <td className="tnum py-1 pr-2 text-right text-ink-faint">{c.netCents === null ? "—" : formatEur0(c.netCents)}</td>
                      <td
                        className={`tnum py-1 text-right ${
                          ecart === null
                            ? c.bankCents > 0
                              ? "text-amber"
                              : "text-ink-faint"
                            : Math.abs(ecart) < 50000
                              ? "text-ink-faint"
                              : ecart > 0
                                ? "text-red"
                                : "text-amber"
                        }`}
                      >
                        {ecart === null ? (c.bankCents > 0 ? "hors net" : "—") : `${ecart >= 0 ? "+" : "−"}${formatEur0(Math.abs(ecart))}`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-1 text-[9.5px] leading-snug text-ink-faint">
            Écart positif = la banque a sorti plus que le net n&apos;a compté pour ce poste : un coût réel absent du
            P&amp;L. Négatif = le net compte un coût que la LLC n&apos;a pas (encore) payé. « Hors net » = sorti sans
            aucune case.
          </p>
        </details>
      )}
      {p.bigCredits.length > 0 && (
        <details className="mt-2 border-t border-line-soft pt-2 text-[11px]">
          <summary className="cursor-pointer text-ink-dim">
            🔎 {p.bigCredits.length} gros crédits reçus qui ne sont pas des versements Shopify (≥ 200 €)
          </summary>
          <table className="mt-1 w-full text-left text-[11px]">
            <tbody>
              {p.bigCredits.map((c, i) => (
                <tr key={i} className="border-b border-hair/50">
                  <td className="py-1 pr-2 tnum">{formatDayShort(c.day)}</td>
                  <td className="py-1 pr-2 text-ink-faint">{c.bank}</td>
                  <td className="tnum py-1 pr-2 text-right">{formatEur0(c.amountEurCents)}</td>
                  <td className="py-1 text-ink-dim">{c.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}
    </div>
  );
}

function OwnershipBlock({
  report,
  annee,
}: {
  report: BankReport;
  annee: { badrCents: number; adnaneCents: number };
}) {
  const own = ownershipFrom(report, annee);
  if (!own) return null;
  const {
    totalCents, metaExcess, metaByMonth, enRouteCents, enRouteExact, detteFournisseur, revolutAdnane,
    persoBadr, persoAdnane, fraisCents, reparti5050Cents, consommeBadr, consommeAdnane,
    partBadr, partAdnane, duCents, disponibleCents, trouCents,
  } = own;
  const enRouteEstime = enRouteExact === null ? report.enRouteEstimateCents : null;
  const horsTotal = report.balances.filter((b) => b && typeof b.amountEurCents !== "number").map((b) => b.currency);
  const colle = Math.abs(trouCents) < 100;
  return (
    <div className="card-shadow rounded-lg border border-line bg-panel p-3">
      <div className="text-[9.5px] font-bold uppercase tracking-wider text-ink-faint">🏛️ Le détail du calcul</div>

      {/* Ce que les deux possèdent — chacun calculé PAREIL (Badr 07/09). */}
      <div className="mt-1.5 grid grid-cols-2 gap-1.5 text-[12px]">
        <div>
          Net Badr <b className="tnum text-net-5">{formatEur0(partBadr)}</b>
          <span className="block text-[9.5px] text-ink-faint">
            {formatEur0(annee.badrCents)} au net Année − {formatEur0(consommeBadr)} déjà consommés
            {persoBadr > 0 ? ` (dont ${formatEur0(persoBadr)} de dépenses carte)` : ""}
          </span>
        </div>
        <div>
          Net Adnane <b className="tnum text-amber">{formatEur0(partAdnane)}</b>
          <span className="block text-[9.5px] text-ink-faint">
            {formatEur0(annee.adnaneCents)} au net Année − {formatEur0(consommeAdnane)} déjà consommés
            {persoAdnane > 0 ? ` (dont ${formatEur0(persoAdnane)} de dépenses carte Adnane + Fahd` : ""}
            {persoAdnane > 0 && revolutAdnane > 0 ? `, ${formatEur0(revolutAdnane)} sur son Revolut)` : persoAdnane > 0 ? ")" : ""}
          </span>
        </div>
      </div>

      {/* Ce qui est sorti des comptes sans appartenir à personne en propre. */}
      {fraisCents > 0 && (
        <p className="mt-1.5 text-[10px] leading-snug text-ink-faint">
          Sur ce qui est « déjà consommé », <b className="tnum text-ink">{formatEur0(fraisCents)}</b> ne sont
          les dépenses perso de personne : frais bancaires et de change, Google Ads
          {reparti5050Cents > 0 ? `, et ${formatEur0(reparti5050Cents)} encore inexpliqués partagés 50/50` : ""}.
          Le détail ligne par ligne est dans le rapprochement plus bas.
        </p>
      )}

      {/* Ce qui est réellement disponible en face. */}
      <div className="mt-2 grid grid-cols-2 gap-1.5 border-t border-line-soft pt-2 text-[12px] sm:grid-cols-3">
        <div>
          Sur les comptes <b className="tnum text-ink">{formatEur0(totalCents)}</b>
          <span className="block text-[9.5px] text-ink-faint">Wise + Slash, fournisseur déjà payé</span>
          {horsTotal.length > 0 && <span className="block text-[9.5px] text-ink-faint">hors {horsTotal.join(", ")} (sans taux)</span>}
          {!report.balances.some((b) => b.bank === "SLASH") && (
            <span className="block text-[9.5px] text-amber">⚠️ solde Slash non compté</span>
          )}
        </div>
        <div>
          CA pas encore encaissé <b className="tnum text-cyan">{formatEur0(enRouteCents)}</b>
          <span className="block text-[9.5px] text-ink-faint">
            {enRouteExact !== null
              ? "versements Shopify en attente, montant réel"
              : enRouteEstime !== null
                ? "≈ CA − frais des 5 derniers jours (délai de versement) — scope Shopify à ajouter pour l'exact"
                : "indisponible"}
          </span>
        </div>
        <div>
          Encore dû à Panda <b className="tnum text-ink">−{formatEur0(detteFournisseur)}</b>
          <span className="block text-[9.5px] text-ink-faint">commandes livrées, pas encore facturées</span>
        </div>
      </div>

      {/* 🔎 La chasse au trou : où et QUAND l'argent part sans être compté.
          Badr 07/09 : « cherche d'où sortent ces 13 000 €, avant y avait pas
          ce trou ». Un total ne dit pas quand ; un mois, si. */}
      {metaExcess > 0 && metaByMonth && metaByMonth.length > 0 && (
        <div className="mt-2 border-t border-line-soft pt-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-red">
            🔎 {formatEur0(metaExcess)} payés à Meta au-delà de la pub comptée — à identifier
          </div>
          <div className="mt-1 overflow-x-auto">
            <table className="w-full min-w-[320px] text-left text-[11px]">
              <thead>
                <tr className="border-b border-hair text-[9px] uppercase text-ink-faint">
                  <th className="py-1 pr-2">Mois</th>
                  <th className="py-1 pr-2 text-right">Payé en banque</th>
                  <th className="py-1 pr-2 text-right">Pub comptée</th>
                  <th className="py-1 text-right">Écart</th>
                </tr>
              </thead>
              <tbody>
                {metaByMonth.map((m) => {
                  const ecart = m.bankCents - m.spendCents;
                  return (
                    <tr key={m.month} className="border-b border-hair/50">
                      <td className="py-1 pr-2 tnum">{m.month}</td>
                      <td className="tnum py-1 pr-2 text-right">{formatEur0(m.bankCents)}</td>
                      <td className="tnum py-1 pr-2 text-right text-ink-faint">{formatEur0(m.spendCents)}</td>
                      <td
                        className={`tnum py-1 text-right ${
                          Math.abs(ecart) < 50000 ? "text-ink-faint" : ecart > 0 ? "text-red" : "text-amber"
                        }`}
                      >
                        {ecart >= 0 ? "+" : "−"}
                        {formatEur0(Math.abs(ecart))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-1 text-[9.5px] leading-snug text-ink-faint">
            Écart positif = la banque a payé Meta plus que la pub comptée ce mois-là. Négatif = Meta a diffusé
            sans avoir encore prélevé (décalage de facturation, normal). Le mois où l&apos;écart apparaît dit
            quoi chercher sur le relevé.
          </p>
        </div>
      )}

      <p className="mt-2 border-t border-line-soft pt-2 text-[11px] leading-snug text-ink-dim">
        <b className="tnum text-ink">{formatEur0(duCents)}</b> qui nous appartiennent, contre{" "}
        <b className="tnum text-ink">{formatEur0(disponibleCents)}</b> réellement disponibles →{" "}
        {colle ? (
          <b className="text-phosphor">ça tombe juste, aucun trou.</b>
        ) : (
          <>
            différence de{" "}
            <b className={enRouteExact === null ? "text-amber" : "text-red"}>{formatEur0(trouCents)}</b>
            {enRouteExact === null
              ? " — le CA pas encore encaissé est une ESTIMATION (±2 000 €) : ajouter le scope Shopify avant de creuser."
              : " sans explication : à creuser."}
          </>
        )}
      </p>
    </div>
  );
}


// 📦 VERSEMENTS SHOPIFY ↔ BANQUE — Badr 08/09 : « tu dois savoir quel est le
// dernier encaissement reçu de Shopify, les versements programmés ou déjà
// réalisés et pas atterris sur le compte ». Quatre réponses, puis la liste.
function moneyIn(cents: number, currency: string): string {
  const v = (Math.abs(cents) / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const sym = currency === "EUR" ? "€" : currency === "USD" ? "$" : currency === "GBP" ? "£" : currency === "CAD" ? "$ CAD" : currency;
  return `${v} ${sym}`;
}

function payoutLine(p: ShopifyPayout): string {
  return `${formatDayShort(p.issuedDay)} · ${moneyIn(p.amountCents, p.currency)}`;
}

function PayoutsBlock({
  payouts,
  markets,
  byMonth,
  oldestDay,
}: {
  payouts: PayoutReconciliation;
  markets: string[];
  byMonth: BankReport["payoutsByMonth"];
  oldestDay: string | null;
}) {
  const { lastReceived, paidNotInBank, paidPending, inTransit, scheduled, matched, creditsUnmatched } = payouts;
  const sumBy = (list: ShopifyPayout[]) => {
    const by: Record<string, number> = {};
    for (const p of list) by[p.currency] = (by[p.currency] ?? 0) + p.amountCents;
    return Object.entries(by)
      .map(([cur, c]) => moneyIn(c, cur))
      .join(" + ");
  };
  const enAttente = [...inTransit, ...paidPending];
  return (
    <div className="card-shadow rounded-lg border border-line bg-panel p-3">
      <div className="text-[9.5px] font-bold uppercase tracking-wider text-ink-faint">
        📦 Versements Shopify ↔ banque <span className="normal-case">({markets.join(", ")})</span>
      </div>

      <div className="mt-1.5 grid grid-cols-2 gap-1.5 text-[12px] sm:grid-cols-4">
        <div>
          Dernier reçu en banque{" "}
          <b className="tnum text-phosphor">{lastReceived ? moneyIn(lastReceived.credit.amountCents, lastReceived.credit.currency) : "—"}</b>
          <span className="block text-[9.5px] text-ink-faint">
            {lastReceived ? `${formatDayShort(lastReceived.credit.day)} sur ${lastReceived.credit.bank}` : "aucun rapproché"}
          </span>
        </div>
        <div>
          Partis, pas encore arrivés <b className="tnum text-cyan">{enAttente.length}</b>
          <span className="block text-[9.5px] text-ink-faint">{enAttente.length ? sumBy(enAttente) : "rien en route"}</span>
        </div>
        <div>
          Programmés <b className="tnum text-cyan">{scheduled.length}</b>
          <span className="block text-[9.5px] text-ink-faint">{scheduled.length ? sumBy(scheduled) : "aucun"}</span>
        </div>
        <div>
          Versés, jamais arrivés{" "}
          <b className={`tnum ${paidNotInBank.length ? "text-red" : "text-phosphor"}`}>{paidNotInBank.length}</b>
          <span className={`block text-[9.5px] ${paidNotInBank.length ? "text-red" : "text-ink-faint"}`}>
            {paidNotInBank.length ? `${sumBy(paidNotInBank)} — sur un autre compte ?` : "chaque versement a son crédit"}
          </span>
        </div>
      </div>

      {(paidNotInBank.length > 0 || creditsUnmatched.length > 0) && (
        <div className="mt-2 border-t border-line-soft pt-2 text-[11px]">
          {paidNotInBank.map((p) => (
            <div key={p.id} className="text-red">
              ❌ Shopify dit « versé » le {formatDayShort(p.issuedDay)} — {moneyIn(p.amountCents, p.currency)} ({p.market}) — aucun crédit
              en banque depuis. Où est-il parti ?
            </div>
          ))}
          {creditsUnmatched.map((c) => (
            <div key={c.txId} className="text-amber">
              ⚠️ Crédit Shopify en banque le {formatDayShort(c.day)} — {moneyIn(c.amountCents, c.currency)} ({c.bank}) — qu&apos;aucun
              versement lu n&apos;explique (autre boutique, ou hors période lue).
            </div>
          ))}
        </div>
      )}

      {byMonth.length > 0 && (
        <details className="mt-2 border-t border-line-soft pt-2 text-[11px]" open>
          <summary className="cursor-pointer text-ink-dim">
            📅 Mois par mois : versé par Shopify vs reçu en banque
            {oldestDay ? ` (versements lus depuis le ${formatDayShort(oldestDay)})` : ""}
          </summary>
          <div className="mt-1 overflow-x-auto">
            <table className="w-full min-w-[360px] text-left text-[11px]">
              <thead>
                <tr className="border-b border-hair text-[9px] uppercase text-ink-faint">
                  <th className="py-1 pr-2">Mois</th>
                  <th className="py-1 pr-2">Devise</th>
                  <th className="py-1 pr-2 text-right">Versé par Shopify</th>
                  <th className="py-1 pr-2 text-right">Reçu en banque</th>
                  <th className="py-1 text-right">Écart</th>
                </tr>
              </thead>
              <tbody>
                {byMonth.map((m) => {
                  const ecart = m.shopifyCents - m.bankCents;
                  const gros = Math.abs(ecart) > Math.max(20000, m.shopifyCents * 0.15);
                  return (
                    <tr key={`${m.month}-${m.currency}`} className="border-b border-hair/50">
                      <td className="py-1 pr-2 tnum">{m.month}</td>
                      <td className="py-1 pr-2 text-ink-faint">{m.currency}</td>
                      <td className="tnum py-1 pr-2 text-right">{moneyIn(m.shopifyCents, m.currency)}</td>
                      <td className="tnum py-1 pr-2 text-right">{moneyIn(m.bankCents, m.currency)}</td>
                      <td className={`tnum py-1 text-right ${gros ? "text-red" : "text-ink-faint"}`}>
                        {ecart === 0 ? "—" : `${ecart > 0 ? "+" : "−"}${moneyIn(Math.abs(ecart), m.currency)}`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-1 text-[9.5px] leading-snug text-ink-faint">
            Écart positif = Shopify a versé plus que ce que la banque a reçu ce mois-là : l&apos;argent est allé
            sur un autre compte (ou arrive le mois suivant). Le décalage de 2-4 jours explique de petits écarts
            en fin de mois, pas les gros.
          </p>
        </details>
      )}

      <details className="mt-2 border-t border-line-soft pt-2 text-[11px]">
        <summary className="cursor-pointer text-ink-dim">
          Les {matched.length + enAttente.length + scheduled.length} derniers versements, un par un
        </summary>
        <div className="mt-1 overflow-x-auto">
          <table className="w-full min-w-[380px] text-left text-[11px]">
            <thead>
              <tr className="border-b border-hair text-[9px] uppercase text-ink-faint">
                <th className="py-1 pr-2">Émis</th>
                <th className="py-1 pr-2 text-right">Montant</th>
                <th className="py-1 pr-2">Shopify</th>
                <th className="py-1">Banque</th>
              </tr>
            </thead>
            <tbody>
              {[
                ...scheduled.map((p) => ({ p, shop: "programmé", bank: "—", cls: "text-ink-faint" })),
                ...inTransit.map((p) => ({ p, shop: "en transit", bank: "⏳ attendu", cls: "text-cyan" })),
                ...paidPending.map((p) => ({ p, shop: "versé", bank: "⏳ attendu", cls: "text-cyan" })),
                ...paidNotInBank.map((p) => ({ p, shop: "versé", bank: "❌ jamais arrivé", cls: "text-red" })),
                ...matched.map((m) => ({
                  p: m.payout,
                  shop: "versé",
                  bank: `✓ ${formatDayShort(m.credit.day)} ${m.credit.bank}${
                    m.feeCents > 0 ? ` (−${moneyIn(m.feeCents, m.payout.currency)} de frais)` : ""
                  }`,
                  cls: "text-phosphor",
                })),
              ]
                .sort((a, b) => b.p.issuedDay.localeCompare(a.p.issuedDay))
                .slice(0, 40)
                .map(({ p, shop, bank, cls }) => (
                  <tr key={p.id} className="border-b border-hair/50">
                    <td className="py-1 pr-2 tnum">{payoutLine(p).split(" · ")[0]}</td>
                    <td className="tnum py-1 pr-2 text-right">{moneyIn(p.amountCents, p.currency)}</td>
                    <td className="py-1 pr-2 text-ink-dim">{shop}</td>
                    <td className={`py-1 ${cls}`}>{bank}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

export function BankBoard({
  report,
  unmappedCount,
  annee = null,
}: {
  report: BankReport;
  unmappedCount: number;
  annee?: { badrCents: number; adnaneCents: number; netDepuisCents: number | null } | null;
}) {
  const control = report.control;
  // Détail replié par défaut (Badr 05/09 : « je veux pas 100 000 infos »).
  const [showDetail, setShowDetail] = useState(false);
  return (
    <div className="flex flex-col gap-4">
      <Reveal>
        <SummaryBlock report={report} annee={annee} />
      </Reveal>

      {report.payouts && (
        <Reveal>
          <PayoutsBlock
            payouts={report.payouts}
            markets={report.payoutsMarkets}
            byMonth={report.payoutsByMonth}
            oldestDay={report.payoutsOldestDay}
          />
        </Reveal>
      )}

      {report.payoutsSummary && (
        <Reveal>
          <PayoutsSummaryBlock ps={report.payoutsSummary} />
        </Reveal>
      )}

      {report.treasury?.periods && (
        <Reveal>
          <PeriodsBlock t={report.treasury} />
        </Reveal>
      )}

      {control && control.anomalies.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {control.anomalies.map((a, i) => (
            <div
              key={`${a.kind}-${i}`}
              className={`rounded-lg border p-2.5 text-[11px] leading-snug ${
                a.severity === "red" ? "border-red/50 bg-red/[0.06] text-red" : "border-amber/50 bg-amber/[0.06] text-amber"
              }`}
            >
              <b>{a.severity === "red" ? "🚨" : "⚠️"} {a.label}</b>
              {a.detail && <span className="block text-[10px] opacity-80">{a.detail}</span>}
            </div>
          ))}
        </div>
      )}
      {showDetail && control && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { t: "Société (dep. 01/08)", v: control.parts.societeCents, cls: "text-cyan" },
            { t: "Perso Badr", v: control.parts.persoBadrCents, cls: "text-net-5" },
            { t: "Perso Adnane", v: control.parts.persoFahdCents, cls: "text-amber" },
            { t: `À affecter (${control.parts.aAffecterCount})`, v: control.parts.aAffecterCents, cls: control.parts.aAffecterCount > 0 ? "text-red" : "text-phosphor" },
          ].map((x) => (
            <div key={x.t} className="rounded-lg border border-line bg-panel p-2.5">
              <div className="text-[9px] font-bold uppercase tracking-wider text-ink-faint">{x.t}</div>
              <div className={`tnum text-[15px] font-extrabold ${x.cls}`}>{formatEur0(x.v)}</div>
            </div>
          ))}
        </div>
      )}

      {showDetail && (
        <>
          <HealthHeader tiles={buildTiles(report, unmappedCount)} />
          <CashflowBlock report={report} />
          <TreasuryBlock treasury={report.treasury} setup={report.treasurySetup} />
          <SupplierBlock treasury={report.treasury} />
          {annee && <OwnershipBlock report={report} annee={annee} />}
        </>
      )}

      {showDetail && control && (control.parts.persoBadrCents > 0 || control.parts.persoFahdCents > 0) && (
        <p className="rounded-lg border border-line bg-panel/40 p-2.5 text-[10.5px] text-ink-dim">
          👥 <b className="text-ink">Entre associés (via banque, depuis le 01/08)</b> — le perso payé par la LLC est
          déduit du net de celui qui l&apos;a dépensé (cartes Fahd/Adnane = perso Adnane, carte Badr = perso Badr,
          affectées automatiquement) ; la moitié est due à l&apos;autre (50/50) :{" "}
          {control.parts.soldeBadrDoitAFahdCents === 0 ? (
            <b className="text-phosphor">équilibré</b>
          ) : control.parts.soldeBadrDoitAFahdCents > 0 ? (
            <b className="tnum text-amber">Badr doit {formatEur0(control.parts.soldeBadrDoitAFahdCents)} à Adnane</b>
          ) : (
            <b className="tnum text-amber">Adnane doit {formatEur0(-control.parts.soldeBadrDoitAFahdCents)} à Badr</b>
          )}
          . S&apos;ajoute au solde historique « Entre associés » de l&apos;onglet Année (avances perso → société).
        </p>
      )}

      {control && control.toAssign.length > 0 && (
        <div className="rounded-lg border border-red/40 bg-panel p-3">
          <div className="text-[9.5px] font-bold uppercase tracking-wider text-red">📥 À affecter — chaque euro doit avoir une case</div>
          <table className="mt-1 w-full text-[11px]">
            <tbody>
              {control.toAssign.map((t) => (
                <tr key={`${t.bank}-${t.txId}`} className="border-t border-line-soft align-top">
                  <td className="py-1.5 pr-2 tnum text-ink-dim">{t.day.slice(8, 10)}/{t.day.slice(5, 7)}</td>
                  <td className="py-1.5 pr-2">
                    <span className="text-ink">{t.description}</span>
                    <span className="block text-[9.5px] text-ink-faint">
                      {t.bank}
                      {t.detail ? ` · ${t.detail}` : ""}
                    </span>
                    {t.suggestion && (
                      <span className="block text-[9.5px] font-semibold text-cyan">🤖 {t.suggestion}</span>
                    )}
                    <AssignButtons tx={t} />
                  </td>
                  <td className="py-1.5 text-right tnum font-bold text-red">{money(t.amountCents, t.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {report.setup.length > 0 && (
        <div className="rounded-lg border border-cyan/40 bg-cyan/[0.05] p-2.5 text-[10.5px] text-cyan">
          {report.setup.map((s) => (
            <p key={s}>🔧 {s}</p>
          ))}
        </div>
      )}
      {report.warnings.length > 0 && (
        <div className="rounded-lg border border-amber/40 bg-amber/[0.05] p-2.5 text-[10.5px] text-amber">
          {report.warnings.map((w) => (
            <p key={w}>⚠️ {w}</p>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowDetail((v) => !v)}
        className="self-start rounded-md border border-line px-3 py-1 text-[11px] font-semibold text-ink-dim hover:text-ink"
      >
        {showDetail ? "Masquer le détail" : "Voir le détail (rapprochement, Panda, banques, 30 jours)"}
      </button>

      {showDetail && report.balances.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {report.balances.filter(Boolean).map((b) => (
            <span key={`${b.bank}-${b.currency}`} className="tnum rounded-lg border border-line bg-panel px-2.5 py-1.5 text-[12px] font-bold text-ink">
              {b.bank} · {money(b.amountCents, b.currency)}
            </span>
          ))}
        </div>
      )}

      {report.reconciliation && (
        <>
          <div className="flex flex-col gap-2 sm:flex-row">
            <GapTile
              title={`Meta Ads (${report.reconciliation.sinceDay.slice(8)}/${report.reconciliation.sinceDay.slice(5, 7)} → aujourd'hui)`}
              bank={report.reconciliation.meta.bankCents}
              expected={report.reconciliation.meta.expectedCents}
              pending={report.reconciliation.metaPending}
              note={
                report.reconciliation.metaPending
                  ? "Meta est débité sur la carte Slash (pas encore branchée) — contrôle actif dès le branchement, pas un écart."
                  : "Meta facture par paliers, pas jour par jour : seul le TOTAL de la fenêtre doit coller."
              }
            />
            <GapTile
              title="Versements Shopify"
              bank={report.reconciliation.shopify.bankCents}
              expected={report.reconciliation.shopify.expectedCents}
              note="Prévu = CA − frais estimés. Les payouts arrivent en différé (2-4 j) : écart de bord de fenêtre normal."
            />
          </div>

          {report.reconciliation.subscriptions.length > 0 && (
            <div className="rounded-lg border border-line bg-panel p-3">
              <div className="text-[9.5px] font-bold uppercase tracking-wider text-ink-faint">
                Abonnements LLC (depuis le {report.reconciliation.sinceDay.slice(8, 10)}/{report.reconciliation.sinceDay.slice(5, 7)} — avances perso exclues)
              </div>
              <table className="mt-1 w-full text-[11px]">
                <tbody>
                  {report.reconciliation.subscriptions.map((s) => (
                    <tr key={s.label} className="border-t border-line-soft">
                      <td className="py-1">{s.label}</td>
                      <td className="py-1 text-right tnum">
                        {s.paidCents === 0 ? (
                          <span className="text-ink-faint">non vu — Slash ? facture Shopify ?</span>
                        ) : (
                          <>payé {formatEur0(s.paidCents)}</>
                        )}
                      </td>
                      <td className="py-1 text-right tnum text-ink-dim">attendu ~{formatEur0(s.expectedMonthlyCents)}/mois</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {showDetail && report.txs.length > 0 && (
        <details className="overflow-x-auto rounded-lg border border-line bg-panel p-3">
          <summary className="cursor-pointer text-[9.5px] font-bold uppercase tracking-wider text-ink-faint">
            Transactions (30 j) — replié, pour audit ({report.txs.length})
          </summary>
          <table className="mt-1 w-full min-w-[480px] text-[11px]">
            <tbody>
              {report.txs.map((t) => (
                <tr key={`${t.bank}-${t.txId}`} className="border-t border-line-soft">
                  <td className="py-1 pr-2 tnum text-ink-dim">{t.day.slice(8, 10)}/{t.day.slice(5, 7)}</td>
                  <td className="py-1 pr-2">
                    <span className={`mr-1.5 rounded border px-1 text-[9px] font-bold ${CAT_CHIP[t.category].cls}`}>{CAT_CHIP[t.category].txt}</span>
                    {t.label && (
                      <span className={`mr-1.5 rounded border px-1 text-[9px] font-bold ${LABEL_META[t.label].cls}`}>{LABEL_META[t.label].txt}</span>
                    )}
                    <span className="text-ink">{t.description}</span>
                  </td>
                  <td className={`py-1 text-right tnum font-bold ${t.amountCents < 0 ? "text-red" : "text-phosphor"}`}>
                    {money(t.amountCents, t.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}

      <p className="text-[10px] text-ink-faint">
        Lecture seule (aucun ordre de paiement possible). Wise : relevés sur 30 j, rafraîchis toutes les 15 min — le bouton
        Actualiser force la relecture. USD converti au taux figé du dashboard (1 € = 1,1539 $) ; autres devises (CAD, CHF, MAD…)
        au taux Wise du jour. Contrôle (anomalies, affectations, rapprochement) depuis le 01/08 — l&apos;antérieur est affiché
        mais ne génère aucune alerte (décision Badr 19/08).
      </p>
    </div>
  );
}
