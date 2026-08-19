import { describe, expect, it } from "vitest";
import { categorizeTx, computeControl, mapSlashTx, reconcile, type BankTx, type SlashTx } from "../bank";

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

  it("apps Shopify pas réclamées individuellement si une facture Shopify est débitée", () => {
    const sans = computeControl({ txs: [tx("2026-08-18", "FACEBK", -100)], reconciliation: null, ...W });
    expect(sans.anomalies.some((a) => a.kind === "ABO_NON_DEBITE" && `${a.label} ${a.detail}`.includes("CWILL"))).toBe(true);
    const avec = computeControl({
      txs: [tx("2026-08-18", "SHOPIFY INC monthly", -89)],
      reconciliation: null,
      ...W,
    });
    // La facture Shopify peut porter les apps (CWILL, Moon Bundles) → pas d'alerte.
    expect(avec.anomalies.some((a) => a.kind === "ABO_NON_DEBITE" && `${a.label} ${a.detail}`.includes("CWILL"))).toBe(false);
    expect(avec.anomalies.some((a) => a.kind === "ABO_NON_DEBITE" && `${a.label} ${a.detail}`.includes("Moon"))).toBe(false);
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
