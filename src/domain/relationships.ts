import type {
  ParentRequest,
  ChildRequest,
  TimeEntry,
  OrphanTimeEntry,
  CalculatedRequest,
  ResultStatus,
} from "./types";
import { calculateConsumedHbs } from "./hbs";

export interface RelationshipResult {
  calculatedRequests: CalculatedRequest[];
  orphanTimeEntries: OrphanTimeEntry[];
}

/**
 * Resolve time entries to parent requests, calculate estimated/actual hours,
 * and detect orphan time entries.
 */
export function buildCalculatedRequests(
  parents: ParentRequest[],
  children: ChildRequest[],
  timeEntries: TimeEntry[],
): RelationshipResult {
  const parentMap = new Map(parents.map((p) => [p.id, p]));
  const childMap = new Map(children.map((c) => [c.id, c]));

  // Map: parentId -> time entries assigned to it
  const parentTimeEntries = new Map<string, TimeEntry[]>();
  const orphanTimeEntries: OrphanTimeEntry[] = [];

  for (const te of timeEntries) {
    const resolvedParentId = resolveParentId(te, parentMap, childMap);
    if (resolvedParentId) {
      const list = parentTimeEntries.get(resolvedParentId);
      if (list) {
        list.push(te);
      } else {
        parentTimeEntries.set(resolvedParentId, [te]);
      }
    } else {
      orphanTimeEntries.push({
        ...te,
        orphanReason:
          "Could not resolve parent request from petitionId or parentTaskId",
      });
    }
  }

  // Build children by parent
  const childrenByParent = new Map<string, ChildRequest[]>();
  for (const child of children) {
    if (child.parentId) {
      const list = childrenByParent.get(child.parentId);
      if (list) {
        list.push(child);
      } else {
        childrenByParent.set(child.parentId, [child]);
      }
    }
  }

  const calculatedRequests: CalculatedRequest[] = parents.map((parent) => {
    const parentChildren = childrenByParent.get(parent.id) ?? [];
    const entries = parentTimeEntries.get(parent.id) ?? [];

    // Estimated hours: prefer sum of children, fallback to parent
    const childrenEstimated = parentChildren.reduce(
      (sum, c) => sum + c.estimatedHours,
      0,
    );
    const estimatedHours =
      childrenEstimated > 0 ? childrenEstimated : parent.estimatedHours;

    // Profile-based estimated hours (JP, CS, AF from children)
    const estimatedHoursJp = parentChildren.reduce(
      (sum, c) => sum + (c.estimatedHoursJp ?? 0),
      0,
    );
    const estimatedHoursCs = parentChildren.reduce(
      (sum, c) => sum + (c.estimatedHoursCs ?? 0),
      0,
    );
    const estimatedHoursAf = parentChildren.reduce(
      (sum, c) => sum + (c.estimatedHoursAf ?? 0),
      0,
    );
    const estimatedHoursTotal =
      estimatedHoursJp + estimatedHoursCs + estimatedHoursAf;

    // Actual hours: always from time entries
    const actualHours = entries.reduce((sum, te) => sum + te.hours, 0);

    const differenceHours = estimatedHours - actualHours;
    const deviationPercent =
      estimatedHours > 0
        ? ((actualHours - estimatedHours) / estimatedHours) * 100
        : 0;

    const resultStatus: ResultStatus =
      differenceHours > 0 ? "profit" : differenceHours < 0 ? "loss" : "neutral";

    // Aggregations
    const people = [
      ...new Set(entries.map((e) => e.user).filter(Boolean) as string[]),
    ];
    const activities = [
      ...new Set(entries.map((e) => e.activity).filter(Boolean) as string[]),
    ];
    const roles = [
      ...new Set(
        entries
          .flatMap((e) => [e.profiledRole, e.cauRole])
          .filter(Boolean) as string[],
      ),
    ];
    const applications = [
      ...new Set(
        [
          parent.application,
          ...parentChildren.map((c) => c.application),
          ...entries.map((e) => e.application),
        ].filter(Boolean) as string[],
      ),
    ];

    const costWithoutVat = parentChildren.reduce(
      (sum, c) => sum + (c.costWithoutVat ?? 0),
      0,
    );

    // HBS CALCULATIONS
    // Consumed HBS: from time entries (each entry uses collaborator's HBS ratio)
    const consumedHbs = calculateConsumedHbs(
      entries.map((e) => ({ user: e.user, hours: e.hours })),
    );

    // Estimated HBS: We cannot estimate HBS accurately without per-collaborator data
    // The system stores estimated hours at the request level, not per-user
    // Return 0 with warning (see hbs.ts::calculateEstimatedHbs for details)
    const estimatedHbs = 0; // Cannot be calculated from request-level data

    // HBS Difference: consumed - estimated (note: inverted semantics from hours)
    // Positive difference = over-consumption (bad)
    // Negative difference = under-consumption (good)
    const differenceHbs = consumedHbs - estimatedHbs;

    // HBS Deviation percentage
    const deviationPercentHbs =
      estimatedHbs > 0
        ? ((consumedHbs - estimatedHbs) / estimatedHbs) * 100
        : 0;

    // HBS Result status (inverted from hours: positive diff = loss, negative = profit)
    const resultStatusHbs: ResultStatus =
      differenceHbs > 0 ? "loss" : differenceHbs < 0 ? "profit" : "neutral";

    return {
      parentId: parent.id,
      code: parent.code,
      subject: parent.subject,
      project: parent.project,
      tracker: parent.tracker,
      status: parent.status,
      application: parent.application,
      estimatedHours,
      estimatedHoursJp,
      estimatedHoursCs,
      estimatedHoursAf,
      estimatedHoursTotal,
      actualHours,
      differenceHours,
      deviationPercent,
      resultStatus,
      estimatedHbs,
      consumedHbs,
      differenceHbs,
      deviationPercentHbs,
      resultStatusHbs,
      childrenCount: parentChildren.length,
      timeEntriesCount: entries.length,
      peopleCount: people.length,
      people,
      activities,
      roles,
      applications,
      costWithoutVat: costWithoutVat > 0 ? costWithoutVat : undefined,
    };
  });

  return { calculatedRequests, orphanTimeEntries };
}

function resolveParentId(
  te: TimeEntry,
  parentMap: Map<string, ParentRequest>,
  childMap: Map<string, ChildRequest>,
): string | undefined {
  // 1. petitionId matches a child -> use child's parentId
  if (te.petitionId) {
    const child = childMap.get(te.petitionId);
    if (child?.parentId) return child.parentId;

    // 2. petitionId matches a parent directly
    if (parentMap.has(te.petitionId)) return te.petitionId;
  }

  // 3. parentTaskId matches a parent directly
  if (te.parentTaskId) {
    if (parentMap.has(te.parentTaskId)) return te.parentTaskId;

    // 4. parentTaskId matches a child -> use child's parentId
    const child = childMap.get(te.parentTaskId);
    if (child?.parentId) return child.parentId;
  }

  return undefined;
}
