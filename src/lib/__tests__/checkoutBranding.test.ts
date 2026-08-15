import { describe, expect, it } from "vitest";
import { NIVA_PALETTE, nivaCheckoutBrandingInput } from "../checkoutBranding";

/**
 * Le checkout doit rester la boutique. Ces tests interdisent une couleur ou un
 * coin arrondi « hors maison » qui se glisserait dans le payload — c'est la
 * seule chose vérifiable sans appeler Shopify (l'API de branding est Plus).
 */

const ALLOWED_COLORS = new Set<string>(Object.values(NIVA_PALETTE));

function collect(node: unknown, key: string, out: string[] = []): string[] {
  if (Array.isArray(node)) {
    for (const item of node) collect(item, key, out);
  } else if (node && typeof node === "object") {
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      if (k === key && typeof v === "string") out.push(v);
      collect(v, key, out);
    }
  }
  return out;
}

describe("style checkout NIVA", () => {
  const input = nivaCheckoutBrandingInput({
    logoMediaImageId: "gid://shopify/MediaImage/1",
    faviconMediaImageId: "gid://shopify/MediaImage/2",
  });

  it("n'utilise que des couleurs de la palette maison", () => {
    const hexes = [
      ...collect(input.designSystem, "background"),
      ...collect(input.designSystem, "text"),
      ...collect(input.designSystem, "border"),
      ...collect(input.designSystem, "icon"),
      ...collect(input.designSystem, "accent"),
      ...collect(input.designSystem, "decorative"),
      ...collect(input.designSystem, "brand"),
    ].filter((v) => v.startsWith("#"));

    expect(hexes.length).toBeGreaterThan(0);
    for (const hex of hexes) {
      expect(ALLOWED_COLORS, `couleur hors palette : ${hex}`).toContain(hex);
    }
  });

  it("garde les coins carrés du thème (radius 0 partout)", () => {
    expect(input.designSystem.cornerRadius).toEqual({ small: 0, base: 0, large: 0 });
    expect(input.customizations.global.cornerRadius).toBe("NONE");
    for (const radius of collect(input.customizations, "cornerRadius")) {
      expect(radius).toBe("NONE");
    }
  });

  it("met le récapitulatif en crème et le formulaire en ivoire", () => {
    expect(input.designSystem.colors.schemes.scheme1.base.background).toBe(NIVA_PALETTE.ivory);
    expect(input.designSystem.colors.schemes.scheme2.base.background).toBe(NIVA_PALETTE.cream);
    expect(input.customizations.orderSummary.colorScheme).toBe("COLOR_SCHEME2");
  });

  it("omet logo et favicon quand les fichiers sont absents du store", () => {
    const bare = nivaCheckoutBrandingInput({});
    expect(bare.customizations.header).not.toHaveProperty("logo");
    expect(bare.customizations).not.toHaveProperty("favicon");
  });
});
