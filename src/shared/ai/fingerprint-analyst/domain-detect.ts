export type FingerprintDomain = "piecewise_math" | "history" | "generic";

const PIECEWISE_RE =
  /kayak|first hour|additional hour|piecewise|coins for the|saat başı|ilk saat|ek saat|her ek|ücret|tarife|coins|rental shop/i;

const HISTORY_RE =
  /osmanlı|osmanli|tarih|cumhuriyet|inkılap|inkilap|atatürk|ataturk|reform|devlet-i|alemi-i|savaş|savas|medeniyet|coğrafya|fetih|padişah|padisah|meşrutiyet|mesrutiyet|isyan|antlaşma|antlasma|yüzyıl|yüzyil|asır|imparatorluk|hanedan|devrim|milli mücadele/i;

export function detectFingerprintDomain(stemText: string): FingerprintDomain {
  const stem = stemText.trim();
  if (PIECEWISE_RE.test(stem)) return "piecewise_math";
  if (HISTORY_RE.test(stem)) return "history";
  return "generic";
}

/** Legacy static template always emitted piecewise pedagogy regardless of stem. */
export function isLegacyStaticPiecewiseFingerprint(measuredSkill: string): boolean {
  return measuredSkill.toLowerCase().includes("piecewise rate structure");
}

export function fingerprintDomainMatchesStem(domain: FingerprintDomain, stemText: string): boolean {
  return detectFingerprintDomain(stemText) === domain;
}
