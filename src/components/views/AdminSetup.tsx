"use client";

import { useEffect, useState } from "react";
import { UPSELL_PRODUCT_KEYS } from "@/lib/discover";
import { useSound } from "../sound/SoundProvider";

interface DiscoveredTitle {
  title: string;
  frequency: number;
  guessedProductKey: string;
  guessedUnitGroup: "polo" | "upsell";
}

interface StoreDiscovery {
  market: string;
  domain: string;
  titles: DiscoveredTitle[];
  error?: string;
}

interface EditableRow extends DiscoveredTitle {
  store: string;
  productKey: string;
  unitGroup: "polo" | "upsell";
}

const PRODUCT_KEY_OPTIONS = ["POLO", ...UPSELL_PRODUCT_KEYS, "A_VALIDER"];

export function AdminSetup() {
  const { play } = useSound();
  const [mapCount, setMapCount] = useState<number | null>(null);
  const [discovering, setDiscovering] = useState(false);
  const [rows, setRows] = useState<EditableRow[] | null>(null);
  const [discoverError, setDiscoverError] = useState<string | null>(null);
  const [storeErrors, setStoreErrors] = useState<string[]>([]);
  const [loadingMap, setLoadingMap] = useState(false);
  const [loadMsg, setLoadMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/products-map")
      .then((r) => r.json())
      .then((j) => setMapCount(j.ok ? j.count : 0))
      .catch(() => setMapCount(0));
  }, []);

  const runDiscover = async () => {
    play("beep");
    setDiscovering(true);
    setDiscoverError(null);
    setStoreErrors([]);
    try {
      const res = await fetch("/api/admin/discover");
      const json = await res.json();
      if (!json.ok) {
        setDiscoverError(json.reason ?? "Échec de la découverte.");
      } else {
        const errors: string[] = [];
        const flat: EditableRow[] = [];
        for (const store of json.stores as StoreDiscovery[]) {
          if (store.error) errors.push(`${store.market}: ${store.error}`);
          for (const t of store.titles) {
            flat.push({
              ...t,
              store: store.market,
              productKey: t.guessedProductKey,
              unitGroup: t.guessedUnitGroup,
            });
          }
        }
        setRows(flat);
        setStoreErrors(errors);
        play(flat.length > 0 ? "cash" : "error");
      }
    } catch {
      setDiscoverError("Erreur réseau.");
    }
    setDiscovering(false);
  };

  const loadMapping = async () => {
    if (!rows) return;
    play("beep");
    setLoadingMap(true);
    setLoadMsg(null);
    try {
      const res = await fetch("/api/admin/products-map", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows: rows.map((r) => ({
            store: r.store,
            title_pattern: r.title,
            product_key: r.productKey,
            unit_group: r.unitGroup,
          })),
        }),
      });
      const json = await res.json();
      if (json.ok) {
        play("cash");
        setLoadMsg(`✅ ${json.count} produits chargés dans products_map.`);
        setMapCount(json.count);
      } else {
        play("error");
        setLoadMsg(`❌ ${json.reason}`);
      }
    } catch {
      play("error");
      setLoadMsg("❌ Erreur réseau.");
    }
    setLoadingMap(false);
  };

  const updateRow = (idx: number, patch: Partial<EditableRow>) => {
    setRows((prev) => (prev ? prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)) : prev));
  };

  const toValidate = rows?.filter((r) => r.productKey === "A_VALIDER").length ?? 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Étape 1 — Découverte */}
      <section className="rounded-lg border border-line bg-panel/40 p-3.5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-semibold">1️⃣ Découvrir mes produits</span>
          {mapCount !== null && mapCount > 0 && (
            <span className="rounded border border-phosphor/40 bg-phosphor/10 px-1.5 py-0.5 text-[9px] font-bold text-phosphor">
              {mapCount} déjà en base
            </span>
          )}
        </div>
        <p className="mb-2.5 text-[11px] text-ink-dim">
          Lit tes 4 stores Shopify et liste les titres de produits distincts depuis le 04/06.
          Rien n&apos;est écrit en base à cette étape.
        </p>
        <button
          onClick={runDiscover}
          disabled={discovering}
          className="rounded border border-phosphor/60 bg-phosphor/10 px-3 py-1.5 text-xs font-semibold text-phosphor transition-colors hover:bg-phosphor/20 disabled:opacity-40"
        >
          {discovering ? "Lecture des 4 stores…" : "🔎 Découvrir"}
        </button>
        {discoverError && (
          <p className="mt-2 max-h-32 overflow-y-auto whitespace-pre-wrap break-words text-[11px] text-red">
            ❌ {discoverError}
          </p>
        )}
        {storeErrors.map((e) => (
          <p key={e} className="mt-1 max-h-32 overflow-y-auto whitespace-pre-wrap break-words text-[11px] text-amber">
            ⚠️ {e}
          </p>
        ))}
      </section>

      {/* Étape 2 — Revue + chargement */}
      {rows && rows.length > 0 && (
        <section className="rounded-lg border border-line bg-panel/40 p-3.5">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold">2️⃣ Vérifier le mapping</span>
            {toValidate > 0 && (
              <span className="rounded border border-red/50 bg-red/10 px-1.5 py-0.5 text-[9px] font-bold text-red">
                {toValidate} à valider
              </span>
            )}
          </div>
          <p className="mb-2.5 text-[11px] text-ink-dim">
            Vérifie chaque ligne. &quot;A_VALIDER&quot; doit être corrigé avant de charger (§5 — aucun
            produit ne doit rester non mappé).
          </p>
          <div className="flex max-h-96 flex-col gap-1.5 overflow-y-auto">
            {rows.map((r, idx) => (
              <div
                key={`${r.store}-${r.title}`}
                className={`rounded border p-2 text-[11px] ${
                  r.productKey === "A_VALIDER" ? "border-red/40 bg-red/[0.04]" : "border-line-soft bg-terminal/50"
                }`}
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="truncate font-semibold">
                    {r.store} · {r.title}
                  </span>
                  <span className="flex-none text-ink-faint tnum">×{r.frequency}</span>
                </div>
                <div className="flex gap-1.5">
                  <select
                    value={r.unitGroup}
                    onChange={(e) => updateRow(idx, { unitGroup: e.target.value as "polo" | "upsell" })}
                    className="flex-1 rounded border border-line bg-terminal px-1.5 py-1 text-[10.5px] text-ink"
                  >
                    <option value="polo">polo</option>
                    <option value="upsell">upsell</option>
                  </select>
                  <select
                    value={r.productKey}
                    onChange={(e) => updateRow(idx, { productKey: e.target.value })}
                    className="flex-1 rounded border border-line bg-terminal px-1.5 py-1 text-[10.5px] text-ink"
                  >
                    {PRODUCT_KEY_OPTIONS.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={loadMapping}
            disabled={loadingMap || toValidate > 0}
            className="mt-3 rounded border border-phosphor/60 bg-phosphor/10 px-3 py-1.5 text-xs font-semibold text-phosphor transition-colors hover:bg-phosphor/20 disabled:opacity-40"
          >
            {loadingMap ? "Chargement…" : "💾 Charger ce mapping"}
          </button>
          {toValidate > 0 && (
            <p className="mt-1.5 text-[10.5px] text-amber">Résous les entrées A_VALIDER avant de charger.</p>
          )}
          {loadMsg && <p className="mt-2 text-[11px] text-ink-dim">{loadMsg}</p>}
        </section>
      )}

      {/* Étape 3 — plus de bouton : la synchro se déclenche seule dès qu'un
          visiteur ouvre le site (voir LiveSync), y compris un recalcul
          complet de l'historique après une correction de bug. */}
      <section className="rounded-lg border border-line bg-panel/40 p-3.5">
        <span className="text-sm font-semibold">3️⃣ Backfill</span>
        <p className="mt-1 text-[11px] text-ink-dim">
          Automatique — se déclenche tout seul à l&apos;ouverture du site, rien à faire ici.
        </p>
      </section>
    </div>
  );
}
