import { describe, expect, it } from "vitest";
import {
  SUBSCRIPTIONS,
  dailyEurCents,
  fixedCostsCentsForDay,
  monthlyEurCents,
  subscriptionTotals,
} from "../subscriptions";
import { oneOffCostsCentsForDay } from "../associateLedger";

/**
 * 💳 Charges fixes — fenêtres de facturation.
 * Le MEMO le dit : « un chiffre en dur non vérifiable finit par mentir ».
 * Ces tests figent les dates décidées par Badr : les toucher casse le test
 * au lieu de fausser les dépenses et la marge en silence.
 */

const seif = () => SUBSCRIPTIONS.find((s) => s.label.startsWith("Seif"))!;

/** La ligne d'un abonnement (une devise précise si l'outil en a deux). */
const ligne = (label: string, currency?: "EUR" | "USD") =>
  SUBSCRIPTIONS.find((s) => s.label === label && (currency ? s.currency === currency : true))!;

/** Un abonnement est-il facturé ce jour-là ? (mêmes bornes que le moteur) */
const actifLe = (label: string, day: string) =>
  SUBSCRIPTIONS.some(
    (s) => s.label === label && day >= s.startDay && (s.endDay === null || day <= s.endDay)
  );

describe("Vmake — un seul outil, deux tarifs (Badr 20/08 : « c'est le même outil »)", () => {
  it("ne compte jamais les deux lignes le même jour", () => {
    const lignes = SUBSCRIPTIONS.filter((s) => s.label.startsWith("Vmake"));
    expect(lignes).toHaveLength(2);
    for (const jour of ["2026-06-01", "2026-08-13", "2026-08-14", "2026-08-20"]) {
      const actives = lignes.filter((s) => jour >= s.startDay && (s.endDay === null || jour <= s.endDay));
      expect(actives).toHaveLength(1);
    }
  });

  it("bascule de 8,80 € à 9,99 € le 14/08", () => {
    const actif = (jour: string) =>
      SUBSCRIPTIONS.find((s) => s.label.startsWith("Vmake") && jour >= s.startDay && (s.endDay === null || jour <= s.endDay))!;
    expect(actif("2026-08-13").amount).toBe(8.8);
    expect(actif("2026-08-14").amount).toBe(9.99);
  });
});

describe("Seif — « ne sera pas payé, du 16/07 au 16/08 » (Badr 20/08)", () => {
  it("est facturé du 16/07 au 16/08 inclus, et plus rien après", () => {
    const s = seif();
    expect(s.startDay).toBe("2026-07-16");
    expect(s.endDay).toBe("2026-08-16");
  });

  it("pèse sur les charges du 16/08 mais plus sur celles du 17/08", () => {
    const jour = dailyEurCents(seif());
    expect(fixedCostsCentsForDay("2026-08-16") - fixedCostsCentsForDay("2026-08-17")).toBe(jour);
  });

  it("fait tomber les charges du jour de ~170 € à ~127 €", () => {
    // Repères relevés le 29/08 (151 → 109) : les deux jours ont pris +4,93 €/j
    // quand Klaviyo est passé de 25 € à 150 € sur tout l'historique.
    // Puis +18,76 €/j le 04/09 : les frais de change Slash (Meta payé en USD,
    // 866 $ relevés par Badr) sont inscrits dans le net, étalés du 27/07 au
    // 04/09 — les deux jours sont dedans. Le pas de Seif, lui, n'a pas bougé.
    expect(Math.round(fixedCostsCentsForDay("2026-08-16") / 100)).toBe(170);
    expect(Math.round(fixedCostsCentsForDay("2026-08-17") / 100)).toBe(127);
  });

  it("sort des totaux courants une fois la fenêtre passée", () => {
    const avant = subscriptionTotals("2026-08-16").monthlyCents;
    const apres = subscriptionTotals("2026-08-17").monthlyCents;
    expect(avant - apres).toBe(monthlyEurCents(seif()));
  });

  it("n'est plus une avance perso d'Adnane : rien à rembourser entre associés", () => {
    expect(seif().paidBy).toBeUndefined();
    expect(seif().noBankClaim).toBe(true);
  });
});

describe("Monteur — arrêté le 29/08 (Badr : « plus de monteur depuis aujourd'hui »)", () => {
  const monteur = () => SUBSCRIPTIONS.find((s) => s.label === "Monteur")!;

  it("est compté jusqu'au 28/08 inclus, et plus rien à partir du 29/08", () => {
    expect(monteur().endDay).toBe("2026-08-28");
    expect(actifLe("Monteur", "2026-08-28")).toBe(true);
    expect(actifLe("Monteur", "2026-08-29")).toBe(false);
  });

  it("garde tout son historique depuis le 21/05 (pause, pas suppression)", () => {
    // La ligne doit rester : les jours déjà payés ne doivent JAMAIS perdre
    // leur charge parce qu'un contrat s'arrête plus tard.
    expect(monteur().startDay).toBe("2026-05-21");
    expect(fixedCostsCentsForDay("2026-08-27")).toBeGreaterThan(fixedCostsCentsForDay("2026-08-29"));
  });

  it("sort des totaux mensuels courants (~563 € de moins)", () => {
    // Le 29/08 porte TROIS mouvements à la fois (monteur et Higgsfield
    // arrêtés, Artlist démarré) : on vérifie la composition exacte du pas,
    // sinon un futur changement du même jour passerait inaperçu.
    const avant = subscriptionTotals("2026-08-28").monthlyCents;
    const apres = subscriptionTotals("2026-08-29").monthlyCents;
    expect(avant - apres).toBe(
      monthlyEurCents(monteur()) + monthlyEurCents(ligne("Higgsfield ×2 (Adnane + Ismael)")) - monthlyEurCents(ligne("Artlist"))
    );
  });
});

describe("Changements du 29/08 annoncés par Badr", () => {
  it("Higgsfield : arrêté, dernier jour compté le 28/08", () => {
    expect(actifLe("Higgsfield ×2 (Adnane + Ismael)", "2026-08-28")).toBe(true);
    expect(actifLe("Higgsfield ×2 (Adnane + Ismael)", "2026-08-29")).toBe(false);
    // L'historique garde sa charge : un arrêt n'efface pas ce qui a été payé.
    expect(actifLe("Higgsfield ×2 (Adnane + Ismael)", "2026-07-01")).toBe(true);
  });

  it("Klaviyo : 25 € jusqu'au 09/08, 150 € à partir du 10/08", () => {
    // Badr 29/08 : « non pour Klaviyo à partir du 10 août » — changement de
    // tarif DATÉ, pas une correction rétroactive : mai → début août gardent
    // leurs 25 €, l'historique d'avant le 10/08 ne bouge pas.
    const lignes = SUBSCRIPTIONS.filter((s) => s.label === "Klaviyo (emailing)");
    expect(lignes).toHaveLength(2);
    const actif = (jour: string) =>
      lignes.find((s) => jour >= s.startDay && (s.endDay === null || jour <= s.endDay))!;
    expect(actif("2026-08-09").amount).toBe(25);
    expect(actif("2026-08-10").amount).toBe(150);
    expect(actif("2026-05-21").amount).toBe(25);
    // Jamais les deux le même jour.
    for (const jour of ["2026-06-01", "2026-08-09", "2026-08-10", "2026-09-01"]) {
      expect(
        lignes.filter((s) => jour >= s.startDay && (s.endDay === null || jour <= s.endDay))
      ).toHaveLength(1);
    }
  });

  it("Artlist : 40 $/mois, rien avant le 29/08", () => {
    const a = ligne("Artlist");
    expect(a.amount).toBe(40);
    expect(a.currency).toBe("USD");
    expect(actifLe("Artlist", "2026-08-28")).toBe(false);
    expect(actifLe("Artlist", "2026-08-29")).toBe(true);
  });

  it("Claude Badr : 100 € jusqu'au 17/09, puis 100 $ — jamais les deux le même jour", () => {
    expect(ligne("Claude (Badr)", "EUR").endDay).toBe("2026-09-17");
    expect(ligne("Claude (Badr)", "USD").startDay).toBe("2026-09-18");
    for (const jour of ["2026-08-29", "2026-09-17", "2026-09-18", "2026-10-01"]) {
      const actives = SUBSCRIPTIONS.filter(
        (s) => s.label === "Claude (Badr)" && jour >= s.startDay && (s.endDay === null || jour <= s.endDay)
      );
      expect(actives).toHaveLength(1);
    }
    expect(ligne("Claude (Badr)", "USD").amount).toBe(100);
  });

  it("Claude Adnane : bascule 20 € → 20 $ à la même date", () => {
    expect(ligne("Claude (Adnane)", "EUR").endDay).toBe("2026-09-17");
    expect(ligne("Claude (Adnane)", "USD").startDay).toBe("2026-09-18");
    for (const jour of ["2026-08-29", "2026-09-17", "2026-09-18"]) {
      const actives = SUBSCRIPTIONS.filter(
        (s) => s.label === "Claude (Adnane)" && jour >= s.startDay && (s.endDay === null || jour <= s.endDay)
      );
      expect(actives).toHaveLength(1);
    }
  });

  it("le passage en dollar ALLÈGE les charges (taux figé 1,1539)", () => {
    // 100 $ + 20 $ coûtent moins que 100 € + 20 € : le pas du 18/09 doit être
    // une BAISSE, jamais une hausse.
    expect(fixedCostsCentsForDay("2026-09-18")).toBeLessThan(fixedCostsCentsForDay("2026-09-17"));
  });
});

describe("Jeremy — emailing : à zéro dès le 1er septembre (confirmé Badr 29/08)", () => {
  const jeremy = () => SUBSCRIPTIONS.find((s) => s.label.startsWith("Jeremy"))!;

  it("est facturé jusqu'au 31/08 inclus, plus rien ensuite", () => {
    expect(jeremy().endDay).toBe("2026-08-31");
    expect(actifLe("Jeremy — emailing (fixe, hors %)", "2026-08-31")).toBe(true);
    expect(actifLe("Jeremy — emailing (fixe, hors %)", "2026-09-01")).toBe(false);
  });

  it("fait tomber les charges du jour de ~88 € à ~37 €", () => {
    // Le 01/09 porte DEUX sorties : Jeremy et Eleven Labs (arrêté le 01/09 à
    // la demande de Badr). On vérifie la composition exacte du pas — ce test
    // a déjà attrapé ces deux ajouts, c'est exactement son rôle.
    //
    // ⚠️ On compare les ABONNEMENTS ÉTALÉS seuls : les frais PONCTUELS (Google
    // One payé par Badr le 01/09) tombent en une fois sur leur jour et
    // fausseraient le pas, alors qu'ils ne changent rien au régime quotidien.
    const abosSeuls = (jour: string) => fixedCostsCentsForDay(jour) - oneOffCostsCentsForDay(jour);
    expect(abosSeuls("2026-08-31") - abosSeuls("2026-09-01")).toBe(
      dailyEurCents(jeremy()) + dailyEurCents(ligne("Eleven Labs ×2 (Adnane + monteur)"))
    );
    // 37 € le 29/08 ; +18,76 €/j de frais de change Slash inscrits le 04/09
    // (ligne étalée 27/07→04/09, close ce jour-là : Meta est payé depuis Wise
    // en euros). Dès le 05/09 la journée retombe à ~37 €.
    expect(Math.round(abosSeuls("2026-09-01") / 100)).toBe(56);
    expect(Math.round(abosSeuls("2026-09-05") / 100)).toBe(37);
  });

  it("laisse Marwa seule au poste ÉQUIPE en septembre", () => {
    // Le monteur est arrêté au 28/08 et Seif au 16/08 : plus que Marwa.
    const equipeActive = SUBSCRIPTIONS.filter(
      (s) =>
        s.category === "EQUIPE" &&
        "2026-09-01" >= s.startDay &&
        (s.endDay === null || "2026-09-01" <= s.endDay)
    ).map((s) => s.label);
    expect(equipeActive).toEqual(["Marwa"]);
  });
});

describe("Aucun doublon : deux lignes d'un même poste ne se chevauchent JAMAIS", () => {
  // Badr, 01/09 : « le Claude Adnane 20 € il faut l'enlever, ça fait doublon
  // non ?? pareil pour le Claude Badr à 100 € ». C'était l'affichage (l'onglet
  // Dépenses ne filtrait pas sur la date de DÉBUT), pas les données — mais
  // rien ne l'interdisait. Ce test verrouille l'invariant pour de bon : un
  // chevauchement compterait DEUX FOIS la même charge dans le net.
  const jours = [
    "2026-05-21", "2026-06-15", "2026-07-15", "2026-08-09", "2026-08-10",
    "2026-08-28", "2026-08-31", "2026-09-01", "2026-09-17", "2026-09-18",
    "2026-10-01", "2026-12-31",
  ];

  it("un seul tarif actif par libellé, quel que soit le jour", () => {
    for (const jour of jours) {
      const parLabel = new Map<string, number>();
      for (const s of SUBSCRIPTIONS) {
        if (jour < s.startDay || (s.endDay !== null && jour > s.endDay)) continue;
        parLabel.set(s.label, (parLabel.get(s.label) ?? 0) + 1);
      }
      const doublons = [...parLabel.entries()].filter(([, n]) => n > 1);
      expect({ jour, doublons }).toEqual({ jour, doublons: [] });
    }
  });
});

describe("Eleven Labs — arrêté (Badr 01/09 : « t'as pas enlevé eleven labs »)", () => {
  it("est compté jusqu'au 31/08 inclus, plus rien dès le 01/09", () => {
    expect(actifLe("Eleven Labs ×2 (Adnane + monteur)", "2026-08-31")).toBe(true);
    expect(actifLe("Eleven Labs ×2 (Adnane + monteur)", "2026-09-01")).toBe(false);
    // L'historique garde sa charge.
    expect(actifLe("Eleven Labs ×2 (Adnane + monteur)", "2026-07-01")).toBe(true);
  });

  it("sort du total mensuel courant (−44 €, en même temps que Jeremy)", () => {
    const avant = subscriptionTotals("2026-08-31").monthlyCents;
    const apres = subscriptionTotals("2026-09-01").monthlyCents;
    const jeremy = SUBSCRIPTIONS.find((s) => s.label.startsWith("Jeremy"))!;
    expect(avant - apres).toBe(
      monthlyEurCents(ligne("Eleven Labs ×2 (Adnane + monteur)")) + monthlyEurCents(jeremy)
    );
  });
});
