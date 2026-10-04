// Traffic-light helpers shared by the doctor screens. Plain JS so it can be unit-tested.

export const TRAFFIC_LEVELS = ["red", "orange", "green"];

const RANK = { red: 0, orange: 1, green: 2 };

// Accepts "red", { level: "red" } or anything else (-> "").
export function trafficLevel(value) {
  const level = String(value?.level || value || "").toLowerCase();
  return level in RANK ? level : "";
}

// Lower is more urgent; unknown sorts last.
export function trafficRank(value) {
  const level = trafficLevel(value);
  return level ? RANK[level] : TRAFFIC_LEVELS.length;
}
