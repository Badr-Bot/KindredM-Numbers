/**
 * Style du checkout Shopify — traduction fidèle de la maison NIVA.
 *
 * Toutes les valeurs ci-dessous sont RECOPIÉES du thème live
 * `NIVA — Maison V6` (config/settings_data.json de mynivashop.com), pas
 * inventées : mêmes hex, même police, mêmes coins carrés. Le checkout doit
 * ressembler à la boutique, sinon la rupture visuelle se paie en conversion.
 *
 * ⚠️ L'API de branding checkout (`checkoutBrandingUpsert`) est réservée aux
 * plans Plus / boutiques de dev. Les stores NIVA sont en Advanced : ce module
 * sert (1) de référence unique pour saisir les mêmes valeurs à la main dans
 * l'éditeur de checkout, (2) de payload prêt à envoyer le jour d'un passage
 * Plus. Voir NIVA_CHECKOUT_STYLE.md.
 */

/** Palette maison — seules couleurs autorisées dans le checkout. */
export const NIVA_PALETTE = {
  /** Encre : texte, boutons pleins, icônes. (thème : text/button) */
  ink: "#151515",
  /** Ivoire : fond principal. (thème : scheme-1 background) */
  ivory: "#FAF9F6",
  /** Crème : fond du récapitulatif. (thème : scheme-2 background) */
  cream: "#F7F3EB",
  /** Sable clair : survol du bouton secondaire. (thème : scheme-3 background) */
  sandLight: "#F2ECE1",
  /** Sable : filets et séparateurs. (thème : scheme-5 background) */
  sand: "#E8E1D4",
  /** Encre à 55 % sur ivoire — bordure des champs (thème : inputs_border_opacity 55). */
  inkMuted: "#7C7C7A",
  /** Noir pur : survol du bouton principal uniquement. */
  inkHover: "#000000",
} as const;

/** Police du thème (`type_body_font` / `type_header_font` = poppins_n4). */
export const NIVA_FONT = {
  name: "Poppins",
  baseWeight: 400,
  boldWeight: 600,
} as const;

const { ink, ivory, cream, sandLight, sand, inkMuted, inkHover } = NIVA_PALETTE;

/** Contrôles (champs, sélecteurs, cases) — identiques dans les deux schémas. */
const control = {
  background: ivory,
  text: ink,
  border: inkMuted,
  icon: ink,
  accent: ink,
  selected: {
    background: ink,
    text: ivory,
    border: ink,
    icon: ivory,
    accent: ivory,
  },
};

/** Bouton principal : plein encre, label ivoire — comme les boutons du thème. */
const primaryButton = {
  background: ink,
  text: ivory,
  border: ink,
  icon: ivory,
  accent: ivory,
  hover: {
    background: inkHover,
    text: ivory,
    border: inkHover,
    icon: ivory,
    accent: ivory,
  },
};

/** Bouton secondaire : contour encre sur fond clair (thème : secondary_button_label). */
function secondaryButton(background: string) {
  return {
    background,
    text: ink,
    border: ink,
    icon: ink,
    accent: ink,
    hover: {
      background: sandLight,
      text: ink,
      border: ink,
      icon: ink,
      accent: ink,
    },
  };
}

/**
 * Payload complet pour `checkoutBrandingUpsert`.
 * Les images (logo, favicon) sont résolues à l'exécution par nom de fichier —
 * les `MediaImage` gid diffèrent d'un store à l'autre (ES/UK/DE/FR).
 */
export function nivaCheckoutBrandingInput(images: {
  logoMediaImageId?: string;
  faviconMediaImageId?: string;
}) {
  return {
    designSystem: {
      colors: {
        global: {
          brand: ink,
          accent: ink,
          decorative: sand,
        },
        schemes: {
          // scheme1 = corps du checkout (formulaire) → fond ivoire.
          scheme1: {
            base: {
              background: ivory,
              text: ink,
              border: sand,
              icon: ink,
              accent: ink,
              decorative: sand,
            },
            control,
            primaryButton,
            secondaryButton: secondaryButton(ivory),
          },
          // scheme2 = récapitulatif de commande → fond crème, comme les cartes du thème.
          scheme2: {
            base: {
              background: cream,
              text: ink,
              border: sand,
              icon: ink,
              accent: ink,
              decorative: sand,
            },
            control,
            primaryButton,
            secondaryButton: secondaryButton(cream),
          },
        },
      },
      typography: {
        primary: {
          shopifyFontGroup: {
            name: NIVA_FONT.name,
            baseWeight: NIVA_FONT.baseWeight,
            boldWeight: NIVA_FONT.boldWeight,
            loadingStrategy: "SWAP",
          },
        },
        secondary: {
          shopifyFontGroup: {
            name: NIVA_FONT.name,
            baseWeight: NIVA_FONT.baseWeight,
            boldWeight: NIVA_FONT.boldWeight,
            loadingStrategy: "SWAP",
          },
        },
        size: { base: 14, ratio: 1.15 },
      },
      // Le thème est à 0 partout (buttons_radius, inputs_radius, card_corner_radius…).
      cornerRadius: { small: 0, base: 0, large: 0 },
    },
    customizations: {
      global: {
        cornerRadius: "NONE",
        typography: { letterCase: "NONE", kerning: "BASE" },
      },
      header: {
        position: "INLINE",
        alignment: "START",
        divided: true,
        padding: "BASE",
        colorScheme: "COLOR_SCHEME1",
        cartLink: { contentType: "ICON" },
        ...(images.logoMediaImageId
          ? {
              logo: {
                image: { mediaImageId: images.logoMediaImageId },
                maxWidth: 120,
                visibility: "VISIBLE",
              },
            }
          : {}),
      },
      ...(images.faviconMediaImageId
        ? { favicon: { mediaImageId: images.faviconMediaImageId } }
        : {}),
      // Titres en capitales espacées : la signature « maison » (pas le gras SaaS).
      headingLevel1: {
        typography: {
          font: "PRIMARY",
          size: "MEDIUM",
          weight: "BASE",
          letterCase: "UPPER",
          kerning: "EXTRA_LOOSE",
        },
      },
      headingLevel2: {
        typography: {
          font: "PRIMARY",
          size: "BASE",
          weight: "BASE",
          letterCase: "UPPER",
          kerning: "LOOSE",
        },
      },
      headingLevel3: {
        typography: {
          font: "PRIMARY",
          size: "BASE",
          weight: "BASE",
          letterCase: "UPPER",
          kerning: "LOOSE",
        },
      },
      // Pas de cartes ni d'ombres : le thème est plat (card_shadow_opacity 0).
      main: {
        colorScheme: "COLOR_SCHEME1",
        section: { background: "TRANSPARENT", border: "NONE", cornerRadius: "NONE" },
      },
      orderSummary: {
        colorScheme: "COLOR_SCHEME2",
        section: { background: "TRANSPARENT", border: "NONE", cornerRadius: "NONE" },
      },
      control: { cornerRadius: "NONE", border: "FULL", labelPosition: "INSIDE" },
      textField: { border: "FULL" },
      select: { border: "FULL" },
      checkbox: { cornerRadius: "NONE" },
      primaryButton: {
        background: "SOLID",
        border: "NONE",
        cornerRadius: "NONE",
        blockPadding: "LOOSE",
        inlinePadding: "BASE",
        typography: {
          font: "PRIMARY",
          size: "BASE",
          weight: "BASE",
          letterCase: "UPPER",
          kerning: "EXTRA_LOOSE",
        },
      },
      secondaryButton: {
        background: "NONE",
        border: "FULL",
        cornerRadius: "NONE",
        typography: {
          font: "PRIMARY",
          size: "BASE",
          weight: "BASE",
          letterCase: "UPPER",
          kerning: "LOOSE",
        },
      },
      merchandiseThumbnail: { border: "FULL", cornerRadius: "NONE", fit: "COVER" },
      expressCheckout: { button: { cornerRadius: "NONE" } },
      buyerJourney: { visibility: "VISIBLE" },
      cartLink: { visibility: "VISIBLE" },
      footer: {
        position: "END",
        alignment: "START",
        divided: true,
        padding: "BASE",
        colorScheme: "TRANSPARENT",
        content: { visibility: "VISIBLE" },
      },
      content: { divider: { borderStyle: "BASE", borderWidth: "BASE", visibility: "VISIBLE" } },
      divider: { borderStyle: "BASE", borderWidth: "BASE" },
    },
  };
}

export const CHECKOUT_BRANDING_MUTATION = /* GraphQL */ `
  mutation NivaCheckoutBranding($checkoutProfileId: ID!, $checkoutBrandingInput: CheckoutBrandingInput!) {
    checkoutBrandingUpsert(
      checkoutProfileId: $checkoutProfileId
      checkoutBrandingInput: $checkoutBrandingInput
    ) {
      checkoutBranding {
        designSystem {
          colors {
            schemes {
              scheme1 { base { background text } primaryButton { background text } }
              scheme2 { base { background text } }
            }
          }
          cornerRadius { base small large }
        }
        customizations {
          header { position alignment logo { maxWidth } }
          primaryButton { cornerRadius typography { letterCase kerning } }
          orderSummary { colorScheme }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;
