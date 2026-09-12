import { describe, expect, it } from "vitest";
import { ONE_OFF_COSTS, badrNetLedgerCentsForDay } from "../associateLedger";
import {
  SUBSCRIPTIONS,
  badrLedgerCentsForDay,
  isBillingDay,
  monthlyEurCents,
  paidBySubsLedgerCentsForDay,
  subsPaidOutOfPocketCentsBy,
} from "../subscriptions";
import { listParisDays } from "../time";

/**
 * 🤝 Entre associés — ce que l'un a sorti de sa poche pour l'autre.
 * Règle du fichier : seule la part de l'AUTRE est due au payeur (jamais le
 * montant brut), et elle est comptée sur SA vraie date.
 *
 * Le 06/09 (« ça marche pas ton truc »), Badr a montré septembre : Hushed,
 * payé par Adnane tous les mois, n'était crédité que par deux factures
 * saisies à la main (juillet, août). Dès septembre plus rien ne remontait et
 * l'écart entre les deux parts repartait dans le mauvais sens. Un abonnement
 * porte déjà `paidBy` et une durée : le dû se calcule maintenant au jour le
 * jour, sans ressaisie mensuelle.
 */

const ligne = (label: string) => SUBSCRIPTIONS.find((s) => s.label === label)!;

describe("Abonnements payés de sa poche : le dû court tout seul", () => {
  it("Hushed (Adnane) et Google One (Badr) sont des ABONNEMENTS, pas des frais ponctuels", () => {
    expect(ligne("Hushed (Adnane)").paidBy).toBe("ADNANE");
    expect(ligne("Google One").paidBy).toBe("BADR");
    // Plus aucune trace en frais ponctuels : sinon la charge compterait deux fois.
    expect(ONE_OFF_COSTS.filter((c) => c.label === "Google One")).toHaveLength(0);
    expect(ONE_OFF_COSTS.filter((c) => c.label.startsWith("Hushed"))).toHaveLength(0);
  });

  it("ne compte que la part de l'AUTRE, dans le bon sens", () => {
    const jour = "2026-09-01"; // jour de prélèvement, après le 14/07 : 50/50
    // Adnane paie Hushed → Badr lui doit sa moitié (négatif).
    // Badr paie Google One → Adnane lui doit sa moitié (positif).
    expect(paidBySubsLedgerCentsForDay(jour)).toBe(
      Math.round(monthlyEurCents(ligne("Google One")) * 0.5) -
        Math.round(monthlyEurCents(ligne("Hushed (Adnane)")) * 0.5)
    );
    expect(paidBySubsLedgerCentsForDay(jour)).toBe(-300); // 4 € − 1 €
  });

  it("tombe UNE fois par mois, en entier — pas étalé", () => {
    // Étalé, l'écart montait tout le mois (1 € le 6 septembre au lieu de 6 €)
    // et ne retombait jamais sur le vrai montant : 7,99 € ÷ 30,44 × 31 ≠ 7,99 €.
    expect(paidBySubsLedgerCentsForDay("2026-09-02")).toBe(0);
    expect(paidBySubsLedgerCentsForDay("2026-09-15")).toBe(0);
    expect(isBillingDay(ligne("Hushed (Adnane)"), "2026-09-01")).toBe(true);
    expect(isBillingDay(ligne("Hushed (Adnane)"), "2026-09-02")).toBe(false);
    // Avant le premier jour de l'abonnement : jamais.
    expect(isBillingDay(ligne("Hushed (Adnane)"), "2026-06-01")).toBe(false);
  });

  it("applique la règle par date : avant le 14/07, tout est à Adnane", () => {
    // Hushed démarre le 01/07 : tant que Badr ne porte aucune charge, il n'a
    // rien à rembourser à Adnane. Et Google One, payé par Badr, est alors dû
    // EN ENTIER par Adnane — la charge est 100 % la sienne à cette date.
    // Prélèvement du 01/07 : Google One entier dû par Adnane, Hushed rien.
    expect(paidBySubsLedgerCentsForDay("2026-07-01")).toBe(monthlyEurCents(ligne("Google One")));
    // Le prélèvement suivant (01/08) est après le 14/07 : chacun sa moitié,
    // et Hushed pèse plus lourd que Google One.
    expect(paidBySubsLedgerCentsForDay("2026-08-01")).toBe(-300);
  });

  it("SEPTEMBRE remonte comme AOÛT — c'est le défaut que Badr a vu", () => {
    // Avant, seuls juillet et août portaient une facture Hushed saisie à la
    // main. Les deux mois doivent maintenant donner le même solde.
    const soldeDuMois = (debut: string, fin: string) =>
      listParisDays(debut, fin).reduce((a, d) => a + badrLedgerCentsForDay(d), 0);
    const aout = soldeDuMois("2026-08-01", "2026-08-31");
    const septembre = soldeDuMois("2026-09-01", "2026-09-30");
    expect(aout).toBeLessThan(0); // Adnane est créancier net
    // Septembre porte en plus les 30 € de Shopify DE payés par Badr le 12/09
    // (50/50 → +15 € pour Badr) : le régime mensuel, lui, est identique.
    const shopifyDeBadr = 1500;
    expect(Math.abs(aout - (septembre - shopifyDeBadr))).toBeLessThanOrEqual(20); // à 0,20 € près
  });

  it("l'écart entre les deux parts vaut le DOUBLE du solde (l'argent change de poche)", () => {
    // Badr 06/09 : « Adnane aura 6 € de plus ». Hushed 7,99 € (lui) − Google
    // One 1,99 € (Badr) = 3 € de solde, donc 6 € d'écart entre les deux parts.
    const solde = listParisDays("2026-08-01", "2026-08-31").reduce(
      (a, d) => a + badrLedgerCentsForDay(d),
      0
    );
    expect(Math.round((-2 * solde) / 100)).toBe(6);
  });

  it("cumule les PRÉLÈVEMENTS passés, pas des jours", () => {
    const hushed = ligne("Hushed (Adnane)");
    // Démarré le 01/07 : trois prélèvements au 06/09 (juillet, août, septembre).
    expect(subsPaidOutOfPocketCentsBy("ADNANE", "2026-09-06")).toBe(3 * monthlyEurCents(hushed));
    // Avant son premier jour : rien.
    expect(subsPaidOutOfPocketCentsBy("BADR", "2026-06-30")).toBe(0);
  });
});

describe("Frais ponctuels — inchangés", () => {
  it("les frais LLC restent à leur date, payés par Badr, moitié due par Adnane", () => {
    // 3 débits le 21/06 (325 + 142 + 125 $) = 519 €... la moitié est due, mais
    // au 21/06 la règle par date ne s'applique pas : chaque frais porte SA
    // part (badrShare 0,5, décision Badr « la LLC a servi à lancer le 14/07 »).
    const llc = ONE_OFF_COSTS.filter((c) => c.label.startsWith("Frais LLC"));
    expect(llc).toHaveLength(3);
    expect(badrNetLedgerCentsForDay("2026-06-21")).toBe(
      llc.reduce((a, c) => a + Math.round(c.eurCents * 0.5), 0) + 100000 // + l'avance de 1 000 €
    );
  });

  it("une carte LLC ne crée aucune dette entre associés", () => {
    // Google Ads du 02/09 : payé par la société, personne ne doit rien.
    expect(badrNetLedgerCentsForDay("2026-09-02")).toBe(0);
  });
});
