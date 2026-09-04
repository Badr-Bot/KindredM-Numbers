import { describe, expect, it } from "vitest";
import {
  categorizeTx,
  computeControl,
  mapSlashTx,
  reconcile,
  subsForPattern,
  estimateEnRoute,
  fxShares,
  PAYOUT_LAG_DAYS,
  type BankTx,
  type SlashTx,
} from "../bank";
import { monthlyEurCents } from "../subscriptions";

/** 🏦 Rapprochement bancaire — catégorisation et écarts (pur, sans réseau). */

const tx = (day: string, description: string, amountEur: number, over?: Partial<BankTx>): BankTx => {
  const amountCents = Math.round(amountEur * 100);
  const { category, subscriptionLabel } = categorizeTx(description, amountCents);
  return {
    bank: "WISE",
    txId: `${day}-${description}-${amountEur}`,
    day,
    amountCents,
    currency: "EUR",
    amountEurCents: amountCents,
    description,
    category,
    subscriptionLabel,
    label: null,
    labelNote: null,
    ...over,
  };
};

describe("categorizeTx", () => {
  it("reconnaît Meta, les payouts Shopify (crédit) et les abonnements", () => {
    expect(categorizeTx("FACEBK *ADS 12345", -25000).category).toBe("META");
    expect(categorizeTx("Meta Platforms Ireland", -25000).category).toBe("META");
    expect(categorizeTx("Shopify Payments payout", 150000).category).toBe("SHOPIFY");
    expect(categorizeTx("SHOPIFY INC monthly", -3900).category).toBe("ABONNEMENT");
    expect(categorizeTx("ANTHROPIC PBC", -2706).subscriptionLabel).toBe("Claude (Badr + Adnane)"); // 120 €/mois plafond (Badr 19/08)
    expect(categorizeTx("Slash fee: Foreign transaction fee for 08.18.26", -1942).category).toBe("FRAIS");
    expect(categorizeTx("ACH Withdrawal to Emailing : Altura", -180000).subscriptionLabel).toBe("Jeremy — emailing (fixe, hors %)"); // Altura = LLC de Jeremy (Badr 19/08)
    expect(categorizeTx("Fournisseur Panda", -80000).category).toBe("FOURNISSEUR"); // Badr 19/08 : Panda = fournisseur
    expect(categorizeTx("Restaurant Al Majed", -1200).category).toBe("AUTRE");
  });

  it("fournisseur, daily credit, abonnements connus (Badr 19/08 : « tu connais tout »)", () => {
    expect(categorizeTx("PANDA DROPSHIPPING", -500000).category).toBe("FOURNISSEUR");
    // remboursement quotidien de la carte à débit différé Slash : le compter
    // doublerait chaque dépense carte déjà listée individuellement
    expect(categorizeTx("Daily credit payment", -120000).category).toBe("INTERNE");
    expect(categorizeTx("HIGGSFIELD AI", -13000).category).toBe("ABONNEMENT");
    expect(categorizeTx("VMAKE.AI", -999).category).toBe("ABONNEMENT");
    expect(categorizeTx("TRENDTRACK", -2500).category).toBe("ABONNEMENT");
    expect(categorizeTx("SKOOL.COM", -21600).category).toBe("ABONNEMENT");
    // Google Ads (Badr 19/08 : la ligne de 100 € = Google Ads) — mais
    // Google Workspace reste un abonnement, jamais confondu.
    expect(categorizeTx("GOOGLE *ADS7364918", -10000).category).toBe("GOOGLE_ADS");
    expect(categorizeTx("GOOGLE ADWORDS", -10000).category).toBe("GOOGLE_ADS");
    expect(categorizeTx("GOOGLE *Workspace", -810).category).toBe("ABONNEMENT");
  });

  it("un FRAIS hérité d'une dépense perso reste dans la part perso, jamais société", () => {
    const c = computeControl({
      txs: [
        tx("2026-08-18", "Foreign transaction fee", -1.2, { category: "FRAIS", label: "PERSO_FAHD" } as Partial<BankTx>),
        tx("2026-08-18", "Foreign transaction fee 2", -1.5, { category: "FRAIS" } as Partial<BankTx>),
      ],
      reconciliation: null,
      sinceDay: "2026-08-01",
      untilDay: "2026-08-19",
    });
    expect(c.parts.persoFahdCents).toBe(120); // le frais perso suit la carte
    expect(c.parts.societeCents).toBe(150); // le frais société reste société
  });

  it("conversion de devise et virement entre nos comptes = INTERNE, jamais à affecter", () => {
    // « juste j'ai pris USD et je l'ai converti en euros, c'est resté dans le compte » (Badr 19/08)
    expect(categorizeTx("Converted 600.00 USD to 519.41 EUR", -60000).category).toBe("INTERNE");
    expect(categorizeTx("Converted 600.00 USD to 519.41 EUR", 51941).category).toBe("INTERNE");
    expect(categorizeTx("Received money from SLASH - KINDREDM with reference 1211", 200000).category).toBe("INTERNE");
    const c = computeControl({
      txs: [tx("2026-08-13", "Converted 600.00 USD to 519.41 EUR", -600, { currency: "USD" })],
      reconciliation: null,
      sinceDay: "2026-08-01",
      untilDay: "2026-08-19",
    });
    expect(c.toAssign).toHaveLength(0);
    expect(c.parts.aAffecterCents).toBe(0);
  });
});

describe("reconcile", () => {
  const expected = [
    { day: "2026-08-18", caCents: 300000, spendCents: 100000, feesCents: 20000 },
    { day: "2026-08-19", caCents: 200000, spendCents: 80000, feesCents: 14000 },
  ];

  it("compare débits Meta et crédits Shopify aux totaux du dashboard", () => {
    const txs = [
      tx("2026-08-18", "FACEBK *ADS", -1200), // 1200 € débités
      tx("2026-08-19", "FACEBK *ADS", -650),
      tx("2026-08-19", "Shopify payout", 4500),
    ];
    const r = reconcile(txs, expected, "2026-08-18", "2026-08-19");
    expect(r.meta.bankCents).toBe(185000);
    expect(r.meta.expectedCents).toBe(180000);
    expect(r.meta.gapCents).toBe(5000);
    expect(r.shopify.bankCents).toBe(450000);
    expect(r.shopify.expectedCents).toBe(466000); // CA − frais
  });

  it("un gros écart Meta déclenche un warning ; un petit non", () => {
    const small = reconcile([tx("2026-08-18", "FACEBK", -1810)], expected, "2026-08-18", "2026-08-19");
    expect(small.warnings.some((w) => w.includes("Meta"))).toBe(false);
    const big = reconcile([tx("2026-08-18", "FACEBK", -2500)], expected, "2026-08-18", "2026-08-19");
    expect(big.warnings.some((w) => w.includes("Meta"))).toBe(true);
  });

  it("le reste part en AUTRE, jamais avalé ; devise inconnue signalée", () => {
    const txs = [
      tx("2026-08-18", "Virement inconnu XYZ", -900),
      tx("2026-08-18", "Mystère", -50, { currency: "GBP", amountEurCents: null }),
    ];
    const r = reconcile(txs, expected, "2026-08-18", "2026-08-19");
    expect(r.others).toHaveLength(2);
    expect(r.warnings.some((w) => w.includes("devise"))).toBe(true);
  });
});


describe("computeControl — anomalies et parts", () => {
  const W = { sinceDay: "2026-07-21", untilDay: "2026-08-19" };

  it("un débit AUTRE sans affectation = anomalie rouge + inbox + case À affecter", () => {
    const txs = [tx("2026-08-18", "Virement mystère", -250)];
    const c = computeControl({ txs, reconciliation: null, ...W });
    expect(c.anomalies.some((a) => a.kind === "TX_NON_AFFECTEE" && a.severity === "red")).toBe(true);
    expect(c.toAssign).toHaveLength(1);
    expect(c.parts.aAffecterCents).toBe(25000);
  });

  it("affecté PERSO_FAHD → sort de l'inbox, compte dans la part Fahd", () => {
    const txs = [tx("2026-08-18", "Restaurant", -80, { label: "PERSO_FAHD" })];
    const c = computeControl({ txs, reconciliation: null, ...W });
    expect(c.toAssign).toHaveLength(0);
    expect(c.parts.persoFahdCents).toBe(8000);
    expect(c.anomalies.some((a) => a.kind === "TX_NON_AFFECTEE")).toBe(false);
  });

  it("abonnement LLC jamais débité → anomalie ; avance perso (paidBy) exclue", () => {
    const txs = [tx("2026-08-18", "FACEBK", -100)];
    const c = computeControl({ txs, reconciliation: null, ...W });
    // Klaviyo & co : « c'est la LLC qui paye — tu les trouveras » (Badr 19/08).
    expect(c.anomalies.some((a) => a.kind === "ABO_NON_DEBITE" && `${a.label} ${a.detail}`.includes("Klaviyo"))).toBe(true);
    // Hushed : payé perso par Adnane EN CONTINU (Badr 19/08) — jamais réclamé.
    expect(c.anomalies.some((a) => a.kind === "ABO_NON_DEBITE" && `${a.label} ${a.detail}`.includes("Hushed"))).toBe(false);
  });

  it("apps Shopify jamais réclamées en banque : facturées via Shopify, couvertes par les crédits (Badr 04/09)", () => {
    // Avant le 04/09 : réclamées sauf si une facture Shopify était débitée sur
    // la fenêtre. Badr : « Moon Bundles etc. c'est payé directement par
    // Shopify » (et le plan Shopify par les crédits) → noBankClaim, aucun débit
    // attendu, avec ou sans facture Shopify visible.
    for (const txs of [[tx("2026-08-18", "FACEBK", -100)], [tx("2026-08-18", "SHOPIFY INC monthly", -89)]]) {
      const c = computeControl({ txs, reconciliation: null, ...W });
      expect(c.anomalies.some((a) => a.kind === "ABO_NON_DEBITE" && `${a.label} ${a.detail}`.includes("CWILL"))).toBe(false);
      expect(c.anomalies.some((a) => a.kind === "ABO_NON_DEBITE" && `${a.label} ${a.detail}`.includes("Moon"))).toBe(false);
    }
  });

  it("zéro débit Meta + Slash absent = metaPending, ni warning ni anomalie", () => {
    const expected = [{ day: "2026-08-18", caCents: 0, spendCents: 100000, feesCents: 0 }];
    const r = reconcile([tx("2026-08-18", "Shopify payout", 500)], expected, "2026-08-18", "2026-08-19");
    expect(r.metaPending).toBe(true);
    expect(r.warnings.some((w) => w.includes("Meta"))).toBe(false);
    const c = computeControl({ txs: [], reconciliation: r, ...W });
    expect(c.anomalies.some((a) => a.kind === "META_ECART")).toBe(false);
    // Slash branché : le même trou devient un vrai écart.
    const r2 = reconcile([tx("2026-08-18", "Shopify payout", 500)], expected, "2026-08-18", "2026-08-19", { slashConnected: true });
    expect(r2.metaPending).toBe(false);
    expect(r2.warnings.some((w) => w.includes("Meta"))).toBe(true);
  });

  it("double débit même jour / même montant / même libellé → anomalie", () => {
    const txs = [
      tx("2026-08-18", "KLAVIYO INC", -25),
      tx("2026-08-18", "KLAVIYO INC", -25, { txId: "autre-id" }),
    ];
    const c = computeControl({ txs, reconciliation: null, ...W });
    expect(c.anomalies.some((a) => a.kind === "DOUBLE_DEBIT")).toBe(true);
  });

  it("une transaction IGNORER ne compte nulle part", () => {
    const txs = [tx("2026-08-18", "Doublon technique", -50, { label: "IGNORER" })];
    const c = computeControl({ txs, reconciliation: null, ...W });
    expect(c.toAssign).toHaveLength(0);
    expect(c.parts.aAffecterCents).toBe(0);
  });
});


describe("mapSlashTx — transaction Slash → BankTx (compte USD)", () => {
  const raw = (over?: Partial<SlashTx>): SlashTx => ({
    id: "tx_123",
    date: "2026-08-18T14:03:00.000Z",
    description: "KLAVIYO INC",
    amountCents: -2500,
    status: "posted",
    detailedStatus: "settled",
    ...over,
  });

  it("mappe un débit réglé : USD, jour Paris, catégorisation par libellé marchand", () => {
    const t = mapSlashTx(raw({ merchantData: { description: "KLAVIYO SOFTWARE" } }));
    expect(t).not.toBeNull();
    expect(t!.bank).toBe("SLASH");
    expect(t!.currency).toBe("USD");
    expect(t!.day).toBe("2026-08-18");
    expect(t!.description).toBe("KLAVIYO SOFTWARE"); // merchantData prioritaire
    expect(t!.category).toBe("ABONNEMENT");
    expect(t!.amountEurCents).toBeLessThan(0); // converti au taux figé
  });

  it("exclut les statuts qui n'ont pas bougé d'argent, garde pending et refund", () => {
    expect(mapSlashTx(raw({ detailedStatus: "declined" }))).toBeNull();
    expect(mapSlashTx(raw({ detailedStatus: "canceled" }))).toBeNull();
    expect(mapSlashTx(raw({ detailedStatus: "reversed" }))).toBeNull();
    expect(mapSlashTx(raw({ status: "failed", detailedStatus: "failed" }))).toBeNull();
    expect(mapSlashTx(raw({ status: "pending", detailedStatus: "pending" }))).not.toBeNull();
    expect(mapSlashTx(raw({ detailedStatus: "refund", amountCents: 2500 }))).not.toBeNull();
  });

  it("un débit FACEBK sur Slash part en META (débloque metaPending)", () => {
    const t = mapSlashTx(raw({ description: "FACEBK *ADS 12345", amountCents: -150000 }));
    expect(t!.category).toBe("META");
  });
});

describe("entre associés via banque (Fahd = Adnane, 50/50)", () => {
  it("le perso payé par la LLC crée une dette de la moitié vers l'autre", () => {
    const txs = [
      tx("2026-08-18", "Resto", -100, { label: "PERSO_BADR" }),
      tx("2026-08-17", "Uber", -40, { label: "PERSO_FAHD" }),
    ];
    const c = computeControl({ txs, reconciliation: null, sinceDay: "2026-07-21", untilDay: "2026-08-19" });
    // (100 − 40) / 2 = 30 € : Badr doit 30 € à Fahd
    expect(c.parts.soldeBadrDoitAFahdCents).toBe(3000);
  });
});

describe("subsForPattern — un abonnement n'est couvert que sur SA fenêtre", () => {
  it("ne compte pas une ligne qui ne commence que plus tard", () => {
    // Claude passe en dollar le 18/09 : la ligne USD existe déjà dans le
    // code, mais tant qu'on n'y est pas, seul l'EUR doit compter. Sans borne
    // startDay, le mensuel attendu affichait 224 € au lieu de 120 € et le
    // contrôle criait à l'abonnement débité au mauvais montant.
    const avant = subsForPattern("Claude", "2026-08-29");
    expect(avant).toHaveLength(2); // Badr EUR + Adnane EUR
    expect(avant.every((s) => s.currency === "EUR")).toBe(true);
    expect(avant.reduce((a, s) => a + monthlyEurCents(s), 0)).toBe(12000);
  });

  it("bascule sur la ligne USD une fois la date passée", () => {
    const apres = subsForPattern("Claude", "2026-09-18");
    expect(apres).toHaveLength(2);
    expect(apres.every((s) => s.currency === "USD")).toBe(true);
    // 120 $ au taux figé = moins de 120 €.
    expect(apres.reduce((a, s) => a + monthlyEurCents(s), 0)).toBeLessThan(12000);
  });

  it("laisse tomber un abonnement résilié une fois son endDay passé", () => {
    expect(subsForPattern("Higgsfield ×2 (Adnane + Ismael)", "2026-08-28")).toHaveLength(1);
    expect(subsForPattern("Higgsfield ×2 (Adnane + Ismael)", "2026-08-29")).toHaveLength(0);
  });

  it("couvre Artlist à partir du 29/08 seulement", () => {
    expect(subsForPattern("Artlist", "2026-08-28")).toHaveLength(0);
    expect(subsForPattern("Artlist", "2026-08-29")).toHaveLength(1);
  });
});


// 04/09 — anomalie « trésorerie inexpliquée » (au-delà du reliquat Revolut
// pré-LLC). Les refus de carte, eux, ont été retirés le soir même : « je m'en
// fous des refus, cette info me sert à rien » (Badr).
describe("anomalies du 04/09", () => {
  const W = { sinceDay: "2026-08-01", untilDay: "2026-09-04" };

  it("trésorerie inexpliquée au-delà du seuil = rouge ; en dessous, rien", () => {
    const treasury = (unexplainedCents: number | null) =>
      ({ unexplainedCents }) as unknown as Parameters<typeof computeControl>[0]["treasury"];
    const rouge = computeControl({ txs: [], reconciliation: null, ...W, treasury: treasury(250000) });
    expect(rouge.anomalies.find((x) => x.kind === "TRESORERIE_INEXPLIQUE")?.severity).toBe("red");
    const calme = computeControl({ txs: [], reconciliation: null, ...W, treasury: treasury(60000) });
    expect(calme.anomalies.some((x) => x.kind === "TRESORERIE_INEXPLIQUE")).toBe(false);
    const inconnu = computeControl({ txs: [], reconciliation: null, ...W, treasury: treasury(null) });
    expect(inconnu.anomalies.some((x) => x.kind === "TRESORERIE_INEXPLIQUE")).toBe(false);
  });
});


// 04/09 — « les frais de change, c'est lié aux dépenses courantes ou à Meta ? »
// L'agrégat quotidien est redécoupé au prorata des frais portés par chaque
// transaction, et chaque morceau dit à quoi il est rattaché.
describe("fxShares — ventilation d'un agrégat de frais FX", () => {
  it("rattache chaque part à son origine, Meta à part entière", () => {
    const parts = fxShares({ fahd: 100, badr: 0, meta: 2800, societe: 100 }, -3000);
    expect(parts.map((p) => [p.suffix, p.amountCents, p.feeOf, p.label])).toEqual([
      ["fahd", -100, "PERSO", "PERSO_FAHD"],
      ["meta", -2800, "META", null],
      ["ste", -100, "AUTRE", null],
    ]);
  });

  it("la somme des parts vaut EXACTEMENT l'agrégat, arrondis compris", () => {
    const parts = fxShares({ fahd: 1, badr: 1, meta: 1, societe: 0 }, -1000);
    expect(parts.reduce((a, p) => a + p.amountCents, 0)).toBe(-1000);
  });

  it("aucun frais porté ce jour-là : rien à ventiler", () => {
    expect(fxShares({ fahd: 0, badr: 0, meta: 0, societe: 0 }, -500)).toEqual([]);
  });
});


// 04/09 — lignes qui restaient « à affecter » sur le dash de Badr.
describe("catégorisation du 04/09", () => {
  it("le monteur (ARINLOYE ISMAEL KOREDELE) est un abonnement « Monteur », pas une ligne mystère", () => {
    const c = categorizeTx("Sent money to ARINLOYE ISMAEL KOREDELE", -66000);
    expect(c).toEqual({ category: "ABONNEMENT", subscriptionLabel: "Monteur" });
  });

  it("un « Disbursement Reversal » négatif est un versement Shopify repris, pas une dépense", () => {
    expect(categorizeTx("Disbursement Reversal", -21904).category).toBe("SHOPIFY");
    // et un débit AUTRE quelconque reste AUTRE
    expect(categorizeTx("Some shop", -21904).category).toBe("AUTRE");
  });

  it("mapSlashTx explique le retour de versement dans la note", () => {
    const t = mapSlashTx({
      id: "rev1",
      date: "2026-08-21T01:55:00.000Z",
      description: "Disbursement Reversal",
      amountCents: -21904,
      status: "posted",
      detailedStatus: "settled",
    });
    expect(t!.category).toBe("SHOPIFY");
    expect(t!.labelNote).toContain("déjà déduit du CA");
  });
});

describe("estimateEnRoute — argent en route sans le scope Shopify", () => {
  const day = (d: string, ca: number, fees: number) => ({ day: d, caCents: ca, spendCents: 0, feesCents: fees });
  it("= CA − frais des 5 derniers jours, untilDay inclus", () => {
    expect(PAYOUT_LAG_DAYS).toBe(5);
    const rows = [
      day("2026-08-30", 100000, 5000), // hors fenêtre
      day("2026-08-31", 100000, 5000),
      day("2026-09-01", 100000, 5000),
      day("2026-09-02", 100000, 5000),
      day("2026-09-03", 100000, 5000),
      day("2026-09-04", 50000, 2500),
    ];
    expect(estimateEnRoute(rows, "2026-09-04")).toBe(4 * 95000 + 47500);
  });
  it("zéro sans agrégats", () => {
    expect(estimateEnRoute([], "2026-09-04")).toBe(0);
  });
});
