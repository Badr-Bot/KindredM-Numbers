"use client";

import { useState } from "react";
import type { DayLine } from "@/lib/data";
import type { MarketTab } from "@/lib/markets";
import {
  formatDayShort,
  formatEur0,
  formatEurSigned0,
  formatPct,
  formatRoas,
} from "@/lib/format";
import { MarketTabs } from "../shell/MarketTabs";
import { statusText } from "../shell/StatusPill";

export function DayTableBoard({
  tabsData,
}: {
  tabsData: Record<MarketTab, DayLine[]>;
}) {
  const [tab, setTab] = useState<MarketTab>("GLOBAL");
  const lines = tabsData[tab];
  const totalNet = lines.reduce((s, l) => s + l.netCents, 0);

  return (
    <div className="flex flex-col gap-3">
      <MarketTabs active={tab} onChange={setTab} />

      <div className="overflow-x-auto rounded-lg border border-line">
        <table className="w-full min-w-[400px] border-collapse text-[11.5px] sm:min-w-[600px]">
          <thead>
            <tr className="border-b border-line bg-panel/60 text-[10px] uppercase tracking-wide text-ink-dim">
              <Th className="sticky left-0 bg-panel/95 text-left">Jour</Th>
              <Th className="text-right">Cmd</Th>
              <Th className="text-right">CA</Th>
              <Th className="text-right">Spend</Th>
              <Th className="hidden text-right sm:table-cell">COGS+tx</Th>
              <Th className="hidden text-right sm:table-cell">Frais</Th>
              <Th className="text-right">Net</Th>
              <Th className="hidden text-right sm:table-cell">Marge</Th>
              <Th className="text-right">ROAS</Th>
              <Th className="text-right">Cumul</Th>
            </tr>
          </thead>
          <tbody className="tnum">
            {lines.map((l) => {
              const empty = l.orders === 0 && l.caCents === 0 && l.spendCents === 0;
              return (
                <tr
                  key={l.day}
                  className={`border-b border-line-soft last:border-0 ${
                    l.isToday ? "bg-phosphor/[0.06]" : ""
                  } ${empty ? "text-ink-faint" : ""}`}
                >
                  <Td className="sticky left-0 bg-terminal/95 text-left font-medium text-ink">
                    {l.isToday && <span className="mr-1 text-phosphor">⚡</span>}
                    {formatDayShort(l.day)}
                  </Td>
                  <Td className="text-right text-ink-dim">{l.orders || "—"}</Td>
                  <Td className="text-right">{l.caCents ? formatEur0(l.caCents) : "—"}</Td>
                  <Td className="text-right text-ink-dim">{l.spendCents ? formatEur0(l.spendCents) : "—"}</Td>
                  <Td className="hidden text-right text-ink-dim sm:table-cell">
                    {l.caCents ? formatEur0(l.cogsCents + l.taxCents) : "—"}
                  </Td>
                  <Td className="hidden text-right text-ink-dim sm:table-cell">{l.caCents ? formatEur0(l.feesCents) : "—"}</Td>
                  <Td className={`text-right font-semibold ${empty ? "" : statusText(l.status)}`}>
                    {l.caCents || l.spendCents ? formatEurSigned0(l.netCents) : "—"}
                  </Td>
                  <Td className="hidden text-right text-ink-dim sm:table-cell">{l.caCents ? formatPct(l.marginPct) : "—"}</Td>
                  <Td className={`text-right ${empty ? "" : statusText(l.status)}`}>
                    {l.spendCents ? formatRoas(l.roas) : "—"}
                  </Td>
                  <Td className={`text-right font-medium ${l.cumulNetCents >= 0 ? "text-ink" : "text-red"}`}>
                    {formatEurSigned0(l.cumulNetCents)}
                  </Td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-line bg-panel/60 font-semibold">
              <Td className="sticky left-0 bg-panel/95 text-left">Σ 14 j</Td>
              <Td className="text-right text-ink-dim">{lines.reduce((s, l) => s + l.orders, 0)}</Td>
              <Td className="text-right">{formatEur0(lines.reduce((s, l) => s + l.caCents, 0))}</Td>
              <Td className="text-right text-ink-dim">{formatEur0(lines.reduce((s, l) => s + l.spendCents, 0))}</Td>
              <Td className="hidden text-right text-ink-dim sm:table-cell">
                {formatEur0(lines.reduce((s, l) => s + l.cogsCents + l.taxCents, 0))}
              </Td>
              <Td className="hidden text-right text-ink-dim sm:table-cell">{formatEur0(lines.reduce((s, l) => s + l.feesCents, 0))}</Td>
              <Td className={`text-right ${totalNet >= 0 ? "text-phosphor" : "text-red"}`}>
                {formatEurSigned0(totalNet)}
              </Td>
              <Td className="hidden text-right sm:table-cell"></Td>
              <Td className="text-right"></Td>
              <Td className="text-right"></Td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="text-center text-[10.5px] text-ink-faint">
        ⚡ jour en cours · Net & ROAS colorés selon les seuils dynamiques (14 j)
      </p>
    </div>
  );
}

function Th({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return <th className={`whitespace-nowrap px-2.5 py-2 font-semibold ${className}`}>{children}</th>;
}

function Td({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return <td className={`whitespace-nowrap px-2.5 py-1.5 ${className}`}>{children}</td>;
}
