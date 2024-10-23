import axios from "axios";
import * as cheerio from "cheerio";

// Helper function to extract inline styles
const extractInlineStyles = (
  element: cheerio.Element,
  $: cheerio.Root,
): Record<string, string> => {
  const styleAttr = $(element).attr("style");
  const inlineStyles: Record<string, string> = {};

  if (styleAttr) {
    styleAttr.split(";").forEach((rule) => {
      const [property, value] = rule.split(":").map((x) => x.trim());
      if (property && value) {
        inlineStyles[property] = value;
      }
    });
  }

  return inlineStyles;
};

// Function to extract @font-face fonts from CSS content
const extractFontsFromCSS = (cssContent: string): any[] => {
  const fonts: any[] = [];

  // Regex to capture @font-face blocks
  const fontFaceRegex =
    /@font-face\s*{[^}]*font-family\s*:\s*["']([^"']+)["'];\s*font-weight\s*:\s*([^;]+);\s*([^}]+)}/g;

  // Regex to capture general font-related rules (font-family, font-weight, font-style, etc.)
  const generalFontRegex =
    /(?:font-family|font-weight|font-style|letter-spacing)\s*:\s*([^;]+);/g;

  // Extracting fonts from @font-face blocks
  let match;
  while ((match = fontFaceRegex.exec(cssContent)) !== null) {
    const [_, family, fontWeight, otherStyles] = match;

    // Extract additional properties (letter-spacing, etc.)
    const letterSpacingMatch = /letter-spacing\s*:\s*([^;]+);/.exec(
      otherStyles,
    );
    const letterSpacings = letterSpacingMatch
      ? letterSpacingMatch[1]
      : "normal";

    fonts.push({
      family: family.trim(),
      fontWeight: fontWeight.trim(),
      letterSpacings,
      url: "", // You may add a URL if needed
    });
  }

  // Extracting general font-related rules (font-family, font-weight, etc.)
  const fontRulesRegex = /([^{]+)\s*{([^}]*font[^}]*)}/g;
  while ((match = fontRulesRegex.exec(cssContent)) !== null) {
    const selectors = match[1].trim(); // CSS selectors
    const styles = match[2].trim(); // CSS rules inside the selector

    let fontFamily = "";
    let fontWeight = "normal";
    let letterSpacings = "normal";

    let fontMatch;
    while ((fontMatch = generalFontRegex.exec(styles)) !== null) {
      const property = fontMatch[0].trim();
      const value = fontMatch[1].trim();

      if (property.includes("font-family")) {
        fontFamily = value.replace(/["']/g, ""); // Clean up quotes
      }
      if (property.includes("font-weight")) {
        fontWeight = value;
      }
      if (property.includes("letter-spacing")) {
        letterSpacings = value;
      }
    }

    if (
      fontFamily &&
      !fontFamily.startsWith("inherit") &&
      fontFamily.startsWith("var")
    ) {
      fonts.push({
        family: fontFamily,
        fontWeight,
        letterSpacings,
        url: "", // Add a URL if applicable
      });
    }
  }

  return fonts;
};

// Function to parse Google Fonts URL and extract font information
const parseGoogleFontUrl = (url: string): any => {
  const urlParams = new URLSearchParams(url.split("?")[1]);
  const familyParam = urlParams.get("family");

  if (familyParam) {
    const [family, variantString] = familyParam.split(":");
    const variants = variantString ? variantString.replace("wght@", "") : "400";

    return {
      family,
      variants,
      fontWeight: variants.includes("700") ? "700" : "400",
      letterSpacings: "normal", // Default letter-spacing (this is rarely specified in Google Fonts URLs)
      url,
    };
  }

  return null;
};

// Fetch and parse external CSS stylesheets
const fetchAndParseCSS = async (
  cssUrls: string[],
  classList: string[],
): Promise<{ externalStyles: Record<string, string>; fonts: any[] }> => {
  const externalStyles: Record<string, string> = {};
  const fonts: any[] = [];

  for (const url of cssUrls) {
    try {
      const { data: cssContent } = await axios.get(`https:${url}`);

      // Extract the relevant styles for the button's classList from the CSS file
      classList.forEach((className) => {
        const regex = new RegExp(`\\.${className}\\s*\\{([^}]*)\\}`, "g");
        let match;
        while ((match = regex.exec(cssContent)) !== null) {
          const classStyles = match[1];
          classStyles.split(";").forEach((rule) => {
            const [property, value] = rule.split(":").map((x) => x.trim());
            if (property && value) {
              externalStyles[property] = value;
            }
          });
        }
      });

      // Extract fonts from @font-face rules
      const extractedFonts = extractFontsFromCSS(cssContent);
      fonts.push(...extractedFonts);
    } catch (error) {
      console.error(
        `Error fetching or parsing CSS from ${url}:`,
        (error as Error).message,
      );
    }
  }

  return { externalStyles, fonts };
};

const uniqueByField = (arr: any[], field: string) => {
  const seen = new Set();
  return arr.filter((item) => {
    const key = item[field];
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

// Main scraper function
export const scrapeShopifyPage = async (url: string) => {
  try {
    const { data: html } = await axios.get(url);
    const $ = cheerio.load(html);

    // Extract fonts from Google Fonts or @font-face rules in external stylesheets
    const fonts: any[] = [];
    const cssUrls: string[] = [];

    $('link[rel="stylesheet"]').each((_, element) => {
      const href = $(element).attr("href");
      if (href) {
        cssUrls.push(href);

        // Capture Google Fonts links directly
        if (href.includes("fonts.googleapis.com")) {
          const parsedFont = parseGoogleFontUrl(href);
          if (parsedFont) {
            fonts.push(parsedFont);
          }
        }
      }
    });

    // Extract button styles
    const buttonSelector = 'form[action*="/cart/add"] button';
    const buttonElement = $(buttonSelector).first();

    if (!buttonElement.length) {
      throw new Error("Button not found");
    }

    // Extract inline styles
    const inlineStyles = extractInlineStyles(buttonElement.get(0), $);

    // Extract class names and fetch styles from external CSS files
    const classList = buttonElement.attr("class")?.split(/\s+/) || [];
    const { externalStyles, fonts: cssFonts } = await fetchAndParseCSS(
      cssUrls,
      classList,
    );

    // Merge inline styles and external styles
    const combinedStyles = { ...externalStyles, ...inlineStyles };

    // Combine all fonts (Google Fonts and @font-face)
    const uniqueFonts = uniqueByField([...fonts, ...cssFonts], "family");

    return {
      fonts: uniqueFonts,
      primaryButton: combinedStyles,
    };
  } catch (error) {
    throw new Error("Error fetching the page");
  }
};
