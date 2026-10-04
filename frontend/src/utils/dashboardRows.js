// Pure helpers for the doctor dashboard list: cleaning, filtering, sorting, grouping.
import { TRAFFIC_LEVELS, trafficLevel, trafficRank } from "./traffic.js";

const FALLBACK_PATIENT_VALUE = "not-provided";
const FALLBACK_PATIENT_EMAIL = "not-provided@klineus.local";
const DAY_MS = 86400000;

export function cleanPatientValue(value, { isEmail = false } = {}) {
  const cleaned = String(value || "").trim();

  if (!cleaned) return "";

  const normalized = cleaned.toLowerCase();

  if (normalized === FALLBACK_PATIENT_VALUE || normalized === FALLBACK_PATIENT_EMAIL) {
    return "";
  }

  if (isEmail && normalized.endsWith("@klineus.local")) return "";

  return cleaned;
}

export function indicationLabel(indication) {
  if (indication === "hip_tep") return "Hüft-TEP";
  if (indication === "knee_tep") return "Knie-TEP";
  return indication || "—";
}

export function patientDisplayName(item) {
  const first = cleanPatientValue(item?.patient_name);
  const last = cleanPatientValue(item?.patient_last_name);

  if (first && last && first !== last) return `${first} ${last}`;

  return first || last || "—";
}

export function patientSearchText(item) {
  return [
    patientDisplayName(item),
    cleanPatientValue(item?.patient_email, { isEmail: true }),
    cleanPatientValue(item?.insurance_id),
    item?.case_id || "",
    item?.session_id || "",
    indicationLabel(item?.indication),
  ]
    .join(" ")
    .toLowerCase();
}

function dateInput(value) {
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? "" : new Date(time).toISOString().slice(0, 10);
}

// Text/indication/status/report/date filters. The traffic-light filter is separate
// so the chip counts can ignore it.
export function filterCases(cases, filters, { dateField = "created_at" } = {}) {
  const search = (filters.search || "").trim().toLowerCase();

  return cases.filter((item) => {
    if (search && !patientSearchText(item).includes(search)) return false;
    if (filters.indication && item.indication !== filters.indication) return false;
    if (filters.status && item.status !== filters.status) return false;

    if (filters.report_status) {
      if ((item.report_status || "not_generated") !== filters.report_status) return false;
    }

    if (filters.date && dateInput(item[dateField] || item.updated_at) !== filters.date) {
      return false;
    }

    return true;
  });
}

// 0 = today, 1 = yesterday, 2 = earlier (24 h steps, measured from `now`).
export function dayBucket(value, now = Date.now()) {
  const time = new Date(value).getTime();

  if (Number.isNaN(time)) return 2;

  return Math.min(Math.max(Math.floor((now - time) / DAY_MS), 0), 2);
}

// Day first, then red -> amber -> green -> unknown, then newest first.
export function sortCases(cases, levelOf, now = Date.now()) {
  return [...cases].sort(
    (a, b) =>
      dayBucket(a.created_at, now) - dayBucket(b.created_at, now) ||
      trafficRank(levelOf(a)) - trafficRank(levelOf(b)) ||
      new Date(b.created_at || 0) - new Date(a.created_at || 0),
  );
}

// -> [{ bucket, items }] in bucket order, empty buckets omitted.
export function groupByDay(sortedCases, now = Date.now()) {
  const groups = [];

  for (const item of sortedCases) {
    const bucket = dayBucket(item.created_at, now);
    const last = groups[groups.length - 1];

    if (last && last.bucket === bucket) {
      last.items.push(item);
    } else {
      groups.push({ bucket, items: [item] });
    }
  }

  return groups;
}

export function countByLevel(cases, levelOf) {
  const counts = Object.fromEntries(TRAFFIC_LEVELS.map((level) => [level, 0]));

  for (const item of cases) {
    const level = trafficLevel(levelOf(item));
    if (level) counts[level] += 1;
  }

  return counts;
}

// The risk notes worth raising: red then amber, capped.
export function topFlags(flags, limit = 6) {
  return (Array.isArray(flags) ? flags : [])
    .filter((flag) => trafficLevel(flag?.level) === "red" || trafficLevel(flag?.level) === "orange")
    .sort((a, b) => trafficRank(a.level) - trafficRank(b.level))
    .slice(0, limit);
}
