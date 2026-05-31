import { describe, it, expect } from "vitest";
import { calculateDashboardSummary } from "../domain/calculations";
import type { CalculatedRequest, OrphanTimeEntry } from "../domain/types";

function makeRequest(
  overrides: Partial<CalculatedRequest> = {},
): CalculatedRequest {
  return {
    parentId: "1000",
    code: "1000",
    subject: "Test",
    estimatedHours: 100,
    actualHours: 80,
    differenceHours: 20,
    deviationPercent: -20,
    resultStatus: "profit",
    estimatedHbs: 0,
    consumedHbs: 80,
    differenceHbs: 80,
    deviationPercentHbs: 0,
    resultStatusHbs: "loss",
    childrenCount: 0,
    timeEntriesCount: 1,
    peopleCount: 1,
    people: ["Ana"],
    activities: ["Desarrollo"],
    roles: ["Analista"],
    applications: ["App1"],
    ...overrides,
  };
}

function makeOrphan(overrides: Partial<OrphanTimeEntry> = {}): OrphanTimeEntry {
  return {
    id: "orphan-1",
    hours: 5,
    orphanReason: "Could not resolve",
    ...overrides,
  };
}

describe("calculateDashboardSummary", () => {
  it("calculates totals correctly", () => {
    const requests = [
      makeRequest({
        estimatedHours: 100,
        actualHours: 80,
        resultStatus: "profit",
      }),
      makeRequest({
        parentId: "1001",
        estimatedHours: 50,
        actualHours: 70,
        differenceHours: -20,
        deviationPercent: 40,
        resultStatus: "loss",
        people: ["Pedro"],
        applications: ["App2"],
      }),
    ];
    const orphans = [makeOrphan()];

    const summary = calculateDashboardSummary(requests, orphans);

    expect(summary.totalEstimatedHours).toBe(150);
    expect(summary.totalActualHours).toBe(150);
    expect(summary.totalDifferenceHours).toBe(0);
    expect(summary.profitableRequests).toBe(1);
    expect(summary.lossRequests).toBe(1);
    expect(summary.neutralRequests).toBe(0);
    expect(summary.orphanTimeEntries).toBe(1);
    expect(summary.totalPeople).toBe(2);
    expect(summary.totalApplications).toBe(2);
  });

  it("handles empty inputs", () => {
    const summary = calculateDashboardSummary([], []);
    expect(summary.totalEstimatedHours).toBe(0);
    expect(summary.totalActualHours).toBe(0);
    expect(summary.averageDeviationPercent).toBe(0);
    expect(summary.profitableRequests).toBe(0);
  });

  it("calculates average deviation only from requests with estimated > 0", () => {
    const requests = [
      makeRequest({ estimatedHours: 100, deviationPercent: -20 }),
      makeRequest({ parentId: "1001", estimatedHours: 0, deviationPercent: 0 }),
      makeRequest({
        parentId: "1002",
        estimatedHours: 200,
        deviationPercent: 10,
      }),
    ];
    const summary = calculateDashboardSummary(requests, []);
    // Only requests with estimated > 0: (-20 + 10) / 2 = -5
    expect(summary.averageDeviationPercent).toBe(-5);
  });
});
