// Charge les variables d'environnement pour les scripts (discover-products,
// backfill). Priorité à .env.local (comme Next.js), puis .env en repli.
// Ainsi un seul fichier .env.local suffit pour l'app ET les scripts.
import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });
