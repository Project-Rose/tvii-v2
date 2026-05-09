import { env } from "../env.ts";

// All NN-allowed countries grouped by region
export const NN_COUNTRIES = {
    JPN: [
        "JP", "KR", "TW", "HK", "MO", "CN", "SG", "MY",
    ],

    USA: [
        "AI", "AG", "AR", "AW", "BS", "BB", "BZ", "BO", "BR", "VG", "CA", "KY", "CL", "CO", "CR",
        "DM", "DO", "EC", "SV", "GF", "GD", "GP", "GT", "GY", "HT", "HN", "JM", "MQ", "MX", "MS",
        "AN", "NI", "PA", "PY", "PE", "KN", "LC", "VC", "SR", "TT", "TC", "US", "UY", "VI", "VE",
        "BM"
    ],

    EUR: [
        "AL", "AU", "AT", "BE", "BA", "BW", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR",
        "HU", "IS", "IE", "IT", "LV", "LS", "LI", "LT", "LU", "MK", "MT", "ME", "MZ", "NA", "NL", "NZ",
        "NO", "PL", "PT", "RO", "RU", "RS", "SK", "SI", "ZA", "ES", "SZ", "SE", "CH", "TR", "GB", "ZM",
        "ZW", "AZ", "MR", "ML", "NE", "TD", "SD", "ER", "DJ", "SO", "AD", "GI", "GG", "IM", "JE", "MC",
        "AE", "SA", "SM", "VA"
    ],
};

export function getRegion(country: string): "USA" | "EUR" | "JPN" {
    const c = country.toUpperCase();

    if (NN_COUNTRIES.JPN.includes(c)) return "JPN";
    if (NN_COUNTRIES.USA.includes(c)) return "USA";
    return "EUR";
}

export function getRealIpFromRequest(req: import('express').Request) {
  // Extract the user's IP (Cloudflare first)
  let ip =
      // WARNING: If not running behind Cloudflare, this can be spoofed.
      req.headers["cf-connecting-ip"] as string | undefined  ||
      req.headers["x-forwarded-for"] as string | undefined  ||
      req.socket.remoteAddress ||
      req.ip;

  // If x-forwarded-for contains multiple IPs, take the first
  if (typeof ip === "string" && ip.includes(",")) {
      ip = ip.split(",")[0];
  }

  // Strip IPv6 prefix
  if (typeof ip === "string" && ip.startsWith("::ffff:")) {
      ip = ip.substring(7);
  }

  return ip;
}

/** Gets Mii Studio API expression string from Miiverse "feeling" ID. */
export const expressionFromFeeling = (feeling: number) =>
    [ /* 0 */ 'normal',
      /* 1 */ 'smile_open_mouth',
      /* 2 */ 'like_wink_left',
      /* 3 */ 'surprise_open_mouth',
      /* 4 */ 'frustrated',
      /* 5 */ 'sorrow'
    ][feeling] || 'normal';

/**
 * @param data Compatible Base64 Mii data.
 * @param param URL query parameters, e.g.: `width=128&expression=normal`
 */
export const getMiiImageUrl = (data: string, param: string) =>
    `${env.VINO_JP_MII_IMAGE_PNG_BASE_URL}?data=${data}&verifyCRC16=0&resourceType=middle&${param}`;
