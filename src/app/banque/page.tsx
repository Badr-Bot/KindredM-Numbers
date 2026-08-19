import { redirect } from "next/navigation";

// La banque vit dans l'onglet 🛃 Contrôle (demande Badr 19/08) — cette route
// est conservée pour les liens existants.
export default function BanqueRedirect() {
  redirect("/controle");
}
