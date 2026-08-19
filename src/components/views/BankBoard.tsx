"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AnomalyKind, BankReport, BankTx, TxLabel } from "@/lib/bank";
import { formatEur0 } from "@/lib/format";

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
  PERSO_FAHD: { txt: "FAHD", cls: "border-amber/50 bg-amber/10 text-amber" },
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
      <button disabled={busy} onClick={() => assign("PERSO_FAHD")} className={`${btn} border-amber/50 text-amber hover:bg-amber/10`}>Fahd</button>
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

function CashflowBlock({ report, netTheoriqueCents }: { report: BankReport; netTheoriqueCents: number | null }) {
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
  const fournisseur = out((t) => t.category === "FOURNISSEUR");
  const abos = out((t) => t.category === "ABONNEMENT");
  const frais = out((t) => t.category === "FRAIS");
  const societeAutre = out((t) => t.category === "AUTRE" && t.label === "SOCIETE");
  const aAffecter = out((t) => t.category === "AUTRE" && t.label === null);
  const perso = -sum((t) => isPerso(t) && eurOf(t) < 0) || 0;
  const entrees = entreesShopify + entreesAutres;
  const sorties = meta + fournisseur + abos + frais + societeAutre;
  const marge = entrees - sorties;
  // Frais bancaires RÉELS (FX, virements — y compris ceux fondus dans les
  // postes Meta/Fournisseur via leur transaction d'origine) : absents du net
  // théorique du dashboard → on les déduit du théorique pour comparer à âmes
  // égales (Badr 19/08 : « pour Panda inclut les fees, je veux que tout soit
  // carré »).
  const fraisReels = -sum((t) => eurOf(t) < 0 && !isPerso(t) && (t.category === "FRAIS" || (t.labelNote?.startsWith("frais lié") ?? false))) || 0;
  const theoAjuste = netTheoriqueCents !== null ? netTheoriqueCents - fraisReels : null;
  const dd = `${since.slice(8, 10)}/${since.slice(5, 7)}`;
  return (
    <div className="rounded-lg border border-line bg-panel p-3">
      <div className="text-[9.5px] font-bold uppercase tracking-wider text-ink-faint">
        🧾 Le comptable — encaissé / décaissé depuis le {dd}
      </div>
      <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1">
          <div className="text-[9px] font-bold uppercase tracking-wider text-phosphor">💶 Entrées</div>
          <Row l="Versements Shopify" v={entreesShopify} />
          {entreesAutres > 0 && <Row l="Autres entrées" v={entreesAutres} />}
          <div className="border-t border-line-soft pt-1"><Row l="Total entré" v={entrees} strong /></div>
        </div>
        <div className="flex flex-col gap-1">
          <div className="text-[9px] font-bold uppercase tracking-wider text-red">💸 Sorties société</div>
          <Row l="Meta Ads (frais FX inclus)" v={meta} />
          <Row l="Fournisseur (frais de virement inclus)" v={fournisseur} />
          <Row l="Abonnements & équipe" v={abos} />
          {frais > 0 && <Row l="Frais bancaires" v={frais} />}
          {societeAutre > 0 && <Row l="Autres (affectées Société)" v={societeAutre} />}
          <div className="border-t border-line-soft pt-1"><Row l="Total sorti" v={sorties} strong /></div>
        </div>
        <div className="flex flex-col justify-between gap-1">
          <div>
            <div className="text-[9px] font-bold uppercase tracking-wider text-ink-faint">✅ Marge réelle encaissée</div>
            <div className={`tnum text-[22px] font-extrabold ${marge >= 0 ? "text-phosphor" : "text-red"}`}>{formatEur0(marge)}</div>
            {netTheoriqueCents !== null && theoAjuste !== null && (
              <p className="mt-1 text-[10px] leading-snug text-ink-dim">
                Dashboard (théorique) sur la même période : <b className="tnum text-ink">{formatEur0(netTheoriqueCents)}</b>
                {fraisReels > 0 && (
                  <>
                    {" "}− frais bancaires réels (FX, virements Panda…) <b className="tnum text-ink">{formatEur0(fraisReels)}</b> ={" "}
                    <b className="tnum text-ink">{formatEur0(theoAjuste)}</b>
                  </>
                )}{" "}
                — écart vs encaissé{" "}
                <b className={`tnum ${marge - theoAjuste >= 0 ? "text-phosphor" : "text-amber"}`}>{formatEur0(marge - theoAjuste)}</b>.
                Reste d&apos;écart normal : payouts en différé 2-4 j, Meta facture par paliers, COGS fournisseur payé par vagues.
              </p>
            )}
          </div>
          <div className="text-[10px] text-ink-faint">
            <div>Perso (hors marge) : <b className="tnum">{formatEur0(perso)}</b></div>
            {aAffecter > 0 && <div className="text-red">À affecter (hors marge) : <b className="tnum">{formatEur0(aAffecter)}</b></div>}
          </div>
        </div>
      </div>
    </div>
  );
}

// 🏛️ À qui appartient l'argent des comptes (règle Badr 19/08) : le net de
// l'onglet Année ne bouge JAMAIS ; ici on répartit le SOLDE réel — la part
// de Badr = son net Année (moins son perso banque, 0 tant que la carte Badr
// dort), TOUT LE RESTE = Adnane. Sa part doit dépasser son net Année : la
// différence = l'apport perso qu'il a injecté dans la LLC et qui y est encore.
function OwnershipBlock({ report, annee }: { report: BankReport; annee: { badrCents: number; adnaneCents: number } }) {
  // typeof === "number" : blindé contre une entrée de cache d'une version
  // antérieure sans contre-valeur EUR (crash prod 19/08).
  const known = report.balances.filter((b) => b && typeof b.amountEurCents === "number");
  if (known.length === 0) return null;
  const totalCents = known.reduce((a, b) => a + (b.amountEurCents ?? 0), 0);
  const horsTotal = report.balances.filter((b) => b && typeof b.amountEurCents !== "number").map((b) => b.currency);
  const persoBadr = report.control?.parts.persoBadrCents ?? 0;
  const partBadr = annee.badrCents - persoBadr;
  const partAdnane = totalCents - partBadr;
  const apportAdnane = partAdnane - annee.adnaneCents;
  return (
    <div className="rounded-lg border border-line bg-panel p-3">
      <div className="text-[9.5px] font-bold uppercase tracking-wider text-ink-faint">
        🏛️ À qui appartient l&apos;argent des comptes
      </div>
      <div className="mt-1.5 grid grid-cols-1 gap-1.5 text-[12px] sm:grid-cols-3">
        <div>
          Solde total connu <b className="tnum text-ink">{formatEur0(totalCents)}</b>
          {horsTotal.length > 0 && <span className="block text-[9.5px] text-ink-faint">hors {horsTotal.join(", ")} (sans taux)</span>}
          {!report.balances.some((b) => b.bank === "SLASH") && (
            <span className="block text-[9.5px] text-amber">⚠️ solde Slash non compté</span>
          )}
        </div>
        <div>
          Part Badr <b className="tnum text-net-5">{formatEur0(partBadr)}</b>
          <span className="block text-[9.5px] text-ink-faint">= net Année{persoBadr > 0 ? ` − ${formatEur0(persoBadr)} perso banque` : " (zéro dépense perso)"}</span>
        </div>
        <div>
          Part Adnane <b className="tnum text-amber">{formatEur0(partAdnane)}</b>
          <span className="block text-[9.5px] text-ink-faint">= le reste du solde</span>
        </div>
      </div>
      <p className="mt-2 border-t border-line-soft pt-2 text-[10.5px] leading-snug text-ink-dim">
        Net Année d&apos;Adnane : <b className="tnum text-ink">{formatEur0(annee.adnaneCents)}</b> →{" "}
        {apportAdnane >= 0 ? (
          <>
            sa part sur les comptes dépasse son net de <b className="tnum text-phosphor">{formatEur0(apportAdnane)}</b> ={" "}
            <b>son apport perso encore dans la LLC</b> (il avait transféré de son argent perso).
          </>
        ) : (
          <b className="text-red">
            ⚠️ sa part sur les comptes est INFÉRIEURE de {formatEur0(-apportAdnane)} à son net Année — solde Slash manquant ou
            argent sorti non tracé : à creuser.
          </b>
        )}
      </p>
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
  return (
    <div className="flex flex-col gap-4">
      <HealthHeader tiles={buildTiles(report, unmappedCount)} />

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
      {control && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { t: "Société (dep. 01/08)", v: control.parts.societeCents, cls: "text-cyan" },
            { t: "Perso Badr", v: control.parts.persoBadrCents, cls: "text-net-5" },
            { t: "Perso Fahd", v: control.parts.persoFahdCents, cls: "text-amber" },
            { t: `À affecter (${control.parts.aAffecterCount})`, v: control.parts.aAffecterCents, cls: control.parts.aAffecterCount > 0 ? "text-red" : "text-phosphor" },
          ].map((x) => (
            <div key={x.t} className="rounded-lg border border-line bg-panel p-2.5">
              <div className="text-[9px] font-bold uppercase tracking-wider text-ink-faint">{x.t}</div>
              <div className={`tnum text-[15px] font-extrabold ${x.cls}`}>{formatEur0(x.v)}</div>
            </div>
          ))}
        </div>
      )}

      <CashflowBlock report={report} netTheoriqueCents={annee?.netDepuisCents ?? null} />

      {annee && <OwnershipBlock report={report} annee={annee} />}

      {control && (control.parts.persoBadrCents > 0 || control.parts.persoFahdCents > 0) && (
        <p className="rounded-lg border border-line bg-panel/40 p-2.5 text-[10.5px] text-ink-dim">
          👥 <b className="text-ink">Entre associés (via banque, depuis le 01/08)</b> — le perso payé par la LLC est
          déduit du net de celui qui l&apos;a dépensé (cartes Fahd/Adnane = perso Adnane, carte Badr = perso Badr,
          affectées automatiquement) ; la moitié est due à l&apos;autre (50/50) :{" "}
          {control.parts.soldeBadrDoitAFahdCents === 0 ? (
            <b className="text-phosphor">équilibré</b>
          ) : control.parts.soldeBadrDoitAFahdCents > 0 ? (
            <b className="tnum text-amber">Badr doit {formatEur0(control.parts.soldeBadrDoitAFahdCents)} à Fahd</b>
          ) : (
            <b className="tnum text-amber">Fahd doit {formatEur0(-control.parts.soldeBadrDoitAFahdCents)} à Badr</b>
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

      {report.balances.length > 0 && (
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

      {report.txs.length > 0 && (
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
