// Legal identity of the Klineus operator, shown in the Impressum (§ 5 DDG).
// Fill in the empty fields; the Impressum prints every field that has a value and
// shows a visible notice while required details (name, address, representative) are missing.
export const OPERATOR = {
  name: "Klineus", // company or person name incl. legal form, e.g. "Klineus GmbH"
  street: "", // street and number
  postalCity: "", // postal code and city
  country: "Deutschland",
  representative: "", // authorised representative(s), e.g. managing director
  register: "", // commercial register and number, e.g. "Amtsgericht München, HRB 123456"
  vatId: "", // VAT ID (USt-IdNr.), if any
  contentResponsible: "", // person responsible for content (§ 18 Abs. 2 MStV); defaults to representative
  email: "contact@klineus.de",
  updated: { de: "Oktober 2026", en: "October 2026" },
};

export function missingOperatorFields() {
  return ["street", "postalCity", "representative"].filter((field) => !OPERATOR[field]);
}
