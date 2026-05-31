import { describe, it, expect } from "vitest";
import {
  buildUserTableRows,
  buildChildRequestTableRows,
  buildParentRequestTableRows,
  buildParentProjectGroupTableRows,
} from "../domain/tableAggregations";
import type {
  ParentRequest,
  ChildRequest,
  TimeEntry,
  CalculatedRequest,
} from "../domain/types";

const parents: ParentRequest[] = [
  {
    id: "1000",
    code: "1000",
    subject: "Parent 1",
    project: "ProjectA",
    estimatedHours: 100,
  },
];

const children: ChildRequest[] = [
  {
    id: "2000",
    code: "2000",
    subject: "Child 1",
    parentId: "1000",
    project: "ProjectA",
    estimatedHours: 50,
  },
  {
    id: "2001",
    code: "2001",
    subject: "Child 2",
    parentId: "1000",
    project: "ProjectA",
    estimatedHours: 50,
  },
];

const timeEntries: TimeEntry[] = [
  {
    id: "te-1",
    hours: 20,
    petitionId: "2000",
    user: "Juan",
    activity: "Coding",
    profiledRole: "Developer",
  },
  {
    id: "te-2",
    hours: 15,
    petitionId: "2000",
    user: "Ana",
    activity: "Testing",
    profiledRole: "QA",
  },
  {
    id: "te-3",
    hours: 25,
    petitionId: "2001",
    user: "Juan",
    activity: "Coding",
    profiledRole: "Developer",
  },
];

const calculatedRequests: CalculatedRequest[] = [
  {
    parentId: "1000",
    code: "1000",
    subject: "Parent 1",
    project: "ProjectA",
    estimatedHours: 100,
    actualHours: 60,
    differenceHours: 40,
    deviationPercent: -40,
    resultStatus: "profit",
    estimatedHbs: 0,
    consumedHbs: 60,
    differenceHbs: 60,
    deviationPercentHbs: 0,
    resultStatusHbs: "loss",
    childrenCount: 2,
    timeEntriesCount: 3,
    people: ["Juan", "Ana"],
    peopleCount: 2,
    activities: ["Coding", "Testing"],
    roles: ["Developer", "QA"],
    applications: [],
  },
];

describe("tableAggregations", () => {
  describe("buildUserTableRows", () => {
    it("creates rows per unique user", () => {
      const rows = buildUserTableRows(
        calculatedRequests,
        children,
        timeEntries,
      );
      expect(rows).toHaveLength(2);
      expect(rows.map((r) => r.user)).toEqual(["Juan", "Ana"]);
    });

    it("sums hours per user", () => {
      const rows = buildUserTableRows(
        calculatedRequests,
        children,
        timeEntries,
      );
      expect(rows[0].totalHours).toBe(45); // Juan: 20 + 25
      expect(rows[1].totalHours).toBe(15); // Ana: 15
    });

    it('handles user without name as "Sin usuario"', () => {
      const teNoUser: TimeEntry[] = [{ id: "te-x", hours: 10 }];
      const rows = buildUserTableRows(calculatedRequests, children, teNoUser);
      expect(rows.some((r) => r.user === "Sin usuario")).toBe(true);
    });

    it("deduplicates projects and activities", () => {
      const rows = buildUserTableRows(
        calculatedRequests,
        children,
        timeEntries,
      );
      expect(rows[0].activities).toHaveLength(1); // Only "Coding" for Juan
    });
  });

  describe("buildChildRequestTableRows", () => {
    it("creates row per child request", () => {
      const rows = buildChildRequestTableRows(
        parents,
        children,
        calculatedRequests,
        timeEntries,
      );
      expect(rows).toHaveLength(2);
    });

    it("calculates actual hours from time entries", () => {
      const rows = buildChildRequestTableRows(
        parents,
        children,
        calculatedRequests,
        timeEntries,
      );
      expect(rows[0].actualHours).toBe(35); // Child 2000: 20 + 15
      expect(rows[1].actualHours).toBe(25); // Child 2001: 25
    });

    it("calculates difference and deviation", () => {
      const rows = buildChildRequestTableRows(
        parents,
        children,
        calculatedRequests,
        timeEntries,
      );
      expect(rows[0].differenceHours).toBe(15); // 50 - 35
      expect(rows[0].resultStatus).toBe("profit");
    });

    it("aggregates people per child", () => {
      const rows = buildChildRequestTableRows(
        parents,
        children,
        calculatedRequests,
        timeEntries,
      );
      expect(rows[0].people).toEqual(["Juan", "Ana"]);
      expect(rows[0].peopleCount).toBe(2);
    });

    it("handles missing parent gracefully", () => {
      const childNoParent: ChildRequest = {
        ...children[0],
        id: "9999",
        parentId: undefined,
      };
      const rows = buildChildRequestTableRows(
        parents,
        [childNoParent],
        calculatedRequests,
        [],
      );
      expect(rows[0].parentSubject).toBeUndefined();
    });
  });

  describe("buildParentRequestTableRows", () => {
    it("transforms calculated requests to parent table rows", () => {
      const rows = buildParentRequestTableRows(calculatedRequests);
      expect(rows).toHaveLength(1);
      expect(rows[0].parentCode).toBe("1000");
    });

    it("preserves profit/loss status", () => {
      const rows = buildParentRequestTableRows(calculatedRequests);
      expect(rows[0].resultStatus).toBe("profit");
    });
  });

  describe("buildParentProjectGroupTableRows", () => {
    it("groups by project", () => {
      const rows = buildParentProjectGroupTableRows(
        parents,
        children,
        calculatedRequests,
        timeEntries,
      );
      expect(rows).toHaveLength(1);
      expect(rows[0].parentProject).toBe("ProjectA");
    });

    it("counts parents and children per project", () => {
      const rows = buildParentProjectGroupTableRows(
        parents,
        children,
        calculatedRequests,
        timeEntries,
      );
      expect(rows[0].parentRequestsCount).toBe(1);
      expect(rows[0].childRequestsCount).toBe(2);
    });

    it("sums hours per project", () => {
      const rows = buildParentProjectGroupTableRows(
        parents,
        children,
        calculatedRequests,
        timeEntries,
      );
      expect(rows[0].estimatedHours).toBe(100);
      expect(rows[0].actualHours).toBe(60);
    });

    it("deduplicates people, roles, activities", () => {
      const rows = buildParentProjectGroupTableRows(
        parents,
        children,
        calculatedRequests,
        timeEntries,
      );
      expect(rows[0].people).toEqual(["Juan", "Ana"]);
      expect(rows[0].roles).toEqual(["Developer", "QA"]);
    });

    it('handles empty project as "Sin proyecto padre"', () => {
      const parentNoProject: ParentRequest = {
        ...parents[0],
        project: undefined,
      };
      const calcNoProject: CalculatedRequest = {
        ...calculatedRequests[0],
        project: undefined,
      };
      const rows = buildParentProjectGroupTableRows(
        [parentNoProject],
        children,
        [calcNoProject],
        [],
      );
      expect(rows[0].parentProject).toBe("Sin proyecto padre");
    });

    it("sorts by difference (losses first)", () => {
      const calc1: CalculatedRequest = {
        ...calculatedRequests[0],
        parentId: "1000",
        differenceHours: -50,
      };
      const calc2: CalculatedRequest = {
        ...calculatedRequests[0],
        parentId: "2000",
        project: "ProjectB",
        differenceHours: -10,
      };
      const rows = buildParentProjectGroupTableRows(
        [...parents, { ...parents[0], id: "2000", project: "ProjectB" }],
        children,
        [calc1, calc2],
        [],
      );
      expect(rows[0].parentProject).toBe("ProjectA");
      expect(rows[1].parentProject).toBe("ProjectB");
    });
  });
});
