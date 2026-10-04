import assert from "node:assert/strict";
import { test } from "node:test";

import {
  countByLevel,
  dayBucket,
  filterCases,
  groupByDay,
  patientDisplayName,
  sortCases,
  topFlags,
} from "./dashboardRows.js";
import { trafficLevel, trafficRank } from "./traffic.js";

const NOW = Date.parse("2026-10-04T12:00:00Z");
const hoursAgo = (hours) => new Date(NOW - hours * 3600000).toISOString();

const levels = { a: "red", b: "orange", c: "green", d: "red", e: "green", f: "" };
const levelOf = (item) => levels[item.case_id];

const cases = [
  { case_id: "c", patient_name: "Anna", patient_last_name: "Becker", created_at: hoursAgo(1) },
  { case_id: "b", patient_name: "Peter", patient_last_name: "Schneider", created_at: hoursAgo(2) },
  { case_id: "a", patient_name: "Klaus", patient_last_name: "Neumann", created_at: hoursAgo(5) },
  { case_id: "d", patient_name: "Ingrid", patient_last_name: "Vogel", created_at: hoursAgo(30) },
  { case_id: "e", patient_name: "Walter", patient_last_name: "Braun", created_at: hoursAgo(80) },
  { case_id: "f", patient_name: "Sabine", patient_last_name: "Krüger", created_at: hoursAgo(1.5) },
];

test("trafficLevel and trafficRank accept strings and objects, unknown sorts last", () => {
  assert.equal(trafficLevel("RED"), "red");
  assert.equal(trafficLevel({ level: "orange" }), "orange");
  assert.equal(trafficLevel("purple"), "");
  assert.equal(trafficLevel(undefined), "");
  assert.ok(trafficRank("red") < trafficRank("orange"));
  assert.ok(trafficRank("orange") < trafficRank("green"));
  assert.ok(trafficRank("green") < trafficRank(""));
});

test("dayBucket: today, yesterday, earlier; bad dates fall into earlier", () => {
  assert.equal(dayBucket(hoursAgo(3), NOW), 0);
  assert.equal(dayBucket(hoursAgo(25), NOW), 1);
  assert.equal(dayBucket(hoursAgo(49), NOW), 2);
  assert.equal(dayBucket("not a date", NOW), 2);
  assert.equal(dayBucket(hoursAgo(-2), NOW), 0, "future timestamps count as today");
});

test("sortCases orders by day, then red -> amber -> green -> unknown, then newest", () => {
  const order = sortCases(cases, levelOf, NOW).map((item) => item.case_id);

  // Today: a (red, 5h), b (amber), c (green), f (unknown). Yesterday: d. Earlier: e.
  assert.deepEqual(order, ["a", "b", "c", "f", "d", "e"]);
});

test("sortCases keeps newest first within the same day and level", () => {
  const two = [
    { case_id: "a", created_at: hoursAgo(5) },
    { case_id: "d", created_at: hoursAgo(2) },
  ];

  assert.deepEqual(
    sortCases(two, levelOf, NOW).map((item) => item.case_id),
    ["d", "a"],
  );
});

test("sortCases does not mutate its input", () => {
  const before = cases.map((item) => item.case_id);
  sortCases(cases, levelOf, NOW);
  assert.deepEqual(
    cases.map((item) => item.case_id),
    before,
  );
});

test("groupByDay groups consecutive buckets and omits empty ones", () => {
  const sorted = sortCases(cases, levelOf, NOW);
  const groups = groupByDay(sorted, NOW);

  assert.deepEqual(
    groups.map((group) => [group.bucket, group.items.map((item) => item.case_id)]),
    [
      [0, ["a", "b", "c", "f"]],
      [1, ["d"]],
      [2, ["e"]],
    ],
  );

  const onlyEarlier = groupByDay(sorted.filter((item) => item.case_id === "e"), NOW);
  assert.deepEqual(onlyEarlier.map((group) => group.bucket), [2]);
  assert.deepEqual(groupByDay([], NOW), []);
});

test("countByLevel counts known levels only", () => {
  assert.deepEqual(countByLevel(cases, levelOf), { red: 2, orange: 1, green: 2 });
  assert.deepEqual(countByLevel([], levelOf), { red: 0, orange: 0, green: 0 });
});

test("filterCases: search matches name, insurance id and indication, case-insensitively", () => {
  const data = [
    { case_id: "1", patient_name: "Klaus", patient_last_name: "Neumann", insurance_id: "A123", indication: "knee_tep", created_at: hoursAgo(1) },
    { case_id: "2", patient_name: "Monika", patient_last_name: "Fischer", insurance_id: "B999", indication: "hip_tep", created_at: hoursAgo(1) },
  ];

  assert.deepEqual(filterCases(data, { search: "neumann" }).map((i) => i.case_id), ["1"]);
  assert.deepEqual(filterCases(data, { search: "b999" }).map((i) => i.case_id), ["2"]);
  assert.deepEqual(filterCases(data, { search: "hüft" }).map((i) => i.case_id), ["2"]);
  assert.deepEqual(filterCases(data, { search: "  " }).map((i) => i.case_id), ["1", "2"]);
  assert.deepEqual(filterCases(data, { indication: "knee_tep" }).map((i) => i.case_id), ["1"]);
});

test("filterCases: report status defaults to not_generated and date uses the created day", () => {
  const data = [
    { case_id: "1", report_status: "generated", created_at: "2026-10-04T08:00:00Z" },
    { case_id: "2", created_at: "2026-10-03T08:00:00Z" },
  ];

  assert.deepEqual(filterCases(data, { report_status: "not_generated" }).map((i) => i.case_id), ["2"]);
  assert.deepEqual(filterCases(data, { report_status: "generated" }).map((i) => i.case_id), ["1"]);
  assert.deepEqual(filterCases(data, { date: "2026-10-03" }).map((i) => i.case_id), ["2"]);
});

test("patientDisplayName hides placeholder values and duplicate first/last names", () => {
  assert.equal(patientDisplayName({ patient_name: "Erika", patient_last_name: "Musterfrau" }), "Erika Musterfrau");
  assert.equal(patientDisplayName({ patient_name: "Max", patient_last_name: "Max" }), "Max");
  assert.equal(patientDisplayName({ patient_name: "not-provided" }), "—");
  assert.equal(patientDisplayName({}), "—");
});

test("topFlags keeps red then amber, drops green, and respects the limit", () => {
  const flags = [
    { level: "green", title: "ok" },
    { level: "orange", title: "o1" },
    { level: "red", title: "r1" },
    { level: "orange", title: "o2" },
    { level: "red", title: "r2" },
  ];

  assert.deepEqual(topFlags(flags).map((flag) => flag.title), ["r1", "r2", "o1", "o2"]);
  assert.deepEqual(topFlags(flags, 2).map((flag) => flag.title), ["r1", "r2"]);
  assert.deepEqual(topFlags(undefined), []);
});
