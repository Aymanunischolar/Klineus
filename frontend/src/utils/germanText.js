const GERMAN_TEXT_REPLACEMENTS = [
  ["Block A: ", ""],
  ["Block B: ", ""],
  ["Block C: ", ""],
  ["Block D: ", ""],
  ["Block E: ", ""],
  ["Block F: ", ""],

  ["Arztgespraech", "Arztgespräch"],
  ["Gespraech", "Gespräch"],
  ["gespraech", "gespräch"],

  ["aerztliche", "ärztliche"],
  ["aerztlicher", "ärztlicher"],
  ["aerztliches", "ärztliches"],
  ["aerztlich", "ärztlich"],
  ["Aerztliche", "Ärztliche"],
  ["Aerztlicher", "Ärztlicher"],
  ["Aerztliches", "Ärztliches"],
  ["Aerztlich", "Ärztlich"],

  ["Pruefung", "Prüfung"],
  ["pruefung", "prüfung"],
  ["pruefen", "prüfen"],
  ["prueft", "prüft"],
  ["geprueft", "geprüft"],

  ["Kuerzliches", "Kürzliches"],
  ["Kuerzliche", "Kürzliche"],
  ["kuerzliches", "kürzliches"],
  ["kuerzliche", "kürzliche"],

  ["Erhoehtes", "Erhöhtes"],
  ["Erhoehte", "Erhöhte"],
  ["Erhoehten", "Erhöhten"],
  ["erhoehtes", "erhöhtes"],
  ["erhoehte", "erhöhte"],
  ["erhoehten", "erhöhten"],
  ["erhoeht", "erhöht"],

  ["Praeoperative", "Präoperative"],
  ["praeoperative", "präoperative"],
  ["praeoperativ", "präoperativ"],

  ["Huefte", "Hüfte"],
  ["Hueft", "Hüft"],
  ["huefte", "hüfte"],
  ["hueft", "hüft"],

  ["fuer", "für"],
  ["Fuer", "Für"],

  ["moeglich", "möglich"],
  ["moegliche", "mögliche"],
  ["Moegliche", "Mögliche"],

  ["regelmaessig", "regelmäßig"],
  ["Regelmaessig", "Regelmäßig"],
  ["Regelmaessige", "Regelmäßige"],

  ["vollstaendig", "vollständig"],
  ["Vollstaendig", "Vollständig"],
  ["unvollstaendig", "unvollständig"],

  ["Alltagseinschraenkung", "Alltagseinschränkung"],
  ["Einschraenkung", "Einschränkung"],
  ["Einschraenkungen", "Einschränkungen"],
  ["einschraenkung", "einschränkung"],

  ["Roentgen", "Röntgen"],
  ["roentgen", "röntgen"],

  ["Entzuendung", "Entzündung"],
  ["Entzuendungen", "Entzündungen"],
  ["entzuendung", "entzündung"],
  ["entzuendungen", "entzündungen"],

  ["Klaerung", "Klärung"],
  ["klaeren", "klären"],
  ["geklaert", "geklärt"],

  ["Anaemie", "Anämie"],
  ["anaemie", "anämie"],

  ["bezueglich", "bezüglich"],

  ["Fruehere", "Frühere"],
  ["fruehere", "frühere"],

  ["Gelenkverschleiss", "Gelenkverschleiß"],
  ["gelenkverschleiss", "Gelenkverschleiß"],

  ["Aufklaerung", "Aufklärung"],
  ["aufklaerung", "Aufklärung"],

  ["beduerftig", "bedürftig"],
  ["beduerftigen", "bedürftigen"],

  ["pack_years", "Packungsjahre"],
  ["packs_per_day", "Packungen pro Tag"],
  ["smoking_years", "Raucherjahre"],
  ["stopped_since", "Rauchstopp seit"],
];

export function normalizeGermanText(value) {
  let text = String(value || "");

  text = text.replace(/^\s*Block\s+[A-Z]:\s*/i, "");
  text = text.replace(/\bPack\s*Years?\b/gi, "Packungsjahre");

  GERMAN_TEXT_REPLACEMENTS.forEach(([oldValue, newValue]) => {
    text = text.replaceAll(oldValue, newValue);
  });

  return text.trim();
}