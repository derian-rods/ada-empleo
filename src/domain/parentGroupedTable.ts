import type {
  ParentRequest,
  ChildRequest,
  TimeEntry,
  CalculatedRequest,
  ResultStatus,
} from "./types";
import { calculateConsumedHbs } from "./hbs";

export type RiskLevel = "high" | "medium" | "low";

/**
 * Summary of hours imputated by a user with a specific role
 */
export interface UserRoleHoursSummary {
  user: string;
  role: string;
  hours: number;
  activities: string[];
}

/**
 * A grouped child request with its user/role/hours breakdown
 */
export interface ChildRequestGroupedRow {
  childId: string;
  childCode?: string;
  childSubject: string;
  status?: string;
  application?: string;

  estimatedHours: number;
  actualHours: number;
  filteredActualHours?: number;

  differenceHours: number;
  deviationPercent: number;

  estimatedHbs: number;
  consumedHbs: number;
  differenceHbs: number;
  deviationPercentHbs: number;

  users: string[];
  roles: string[];
  activities: string[];

  userRoleHours: UserRoleHoursSummary[];
  timeEntriesCount: number;
}

/**
 * A grouped parent request with its children and aggregated metrics
 */
export interface ParentGroupedTableRow {
  parentId: string;
  parentCode: string;
  parentSubject: string;
  project?: string;
  application?: string;
  status?: string;

  estimatedHours: number;
  actualHours: number;
  filteredActualHours?: number;

  differenceHours: number;
  deviationPercent: number;
  consumptionPercent: number;

  estimatedHbs: number;
  consumedHbs: number;
  differenceHbs: number;
  deviationPercentHbs: number;

  resultStatus: ResultStatus;
  riskLevel: RiskLevel;

  childrenCount: number;
  timeEntriesCount: number;

  users: string[];
  roles: string[];
  activities: string[];
  applications: string[];

  children: ChildRequestGroupedRow[];
}

/**
 * Filter criteria for parent grouped table
 */
export interface ParentGroupedTableFilters {
  parentCode?: string;
  parentSubject?: string;
  childCode?: string;
  childSubject?: string;
  project?: string;
  application?: string[];
  status?: string;
  user?: string[];
  role?: string[];
  activity?: string[];
  resultStatus?: ResultStatus;
  riskLevel?: RiskLevel;
  onlyLosses?: boolean;
  onlyDeviationOver20?: boolean;
  onlyConsumptionOver100?: boolean;
}

/**
 * Calculate risk level based on difference hours
 */
function calculateRiskLevel(differenceHours: number): RiskLevel {
  if (differenceHours < -20) return "high";
  if (differenceHours < -5) return "medium";
  return "low";
}

/**
 * Calculate consumption percent (actual / estimated * 100)
 */
function calculateConsumptionPercent(
  estimatedHours: number,
  actualHours: number,
): number {
  return estimatedHours > 0 ? (actualHours / estimatedHours) * 100 : 0;
}

/**
 * Build parent grouped table rows from raw domain data
 */
export function buildParentGroupedTableRows(
  parents: ParentRequest[],
  children: ChildRequest[],
  timeEntries: TimeEntry[],
  calculatedRequests: CalculatedRequest[],
): ParentGroupedTableRow[] {
  // Create lookup maps
  const parentMap = new Map(parents.map((p) => [p.id, p]));
  const childMap = new Map(children.map((c) => [c.id, c]));

  // Build parent -> children mapping
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

  // Build parent -> time entries mapping
  const timeEntriesByParent = new Map<string, TimeEntry[]>();
  for (const te of timeEntries) {
    // Try to resolve parent from calculated requests if available
    const calc = calculatedRequests.find(
      (c) =>
        c.people.includes(te.user || "") ||
        c.activities.includes(te.activity || ""),
    );
    if (calc) {
      const list = timeEntriesByParent.get(calc.parentId);
      if (list) {
        list.push(te);
      } else {
        timeEntriesByParent.set(calc.parentId, [te]);
      }
    }
  }

  // Build child -> time entries mapping
  const timeEntriesByChild = new Map<string, TimeEntry[]>();
  for (const te of timeEntries) {
    if (te.petitionId && childMap.has(te.petitionId)) {
      const list = timeEntriesByChild.get(te.petitionId);
      if (list) {
        list.push(te);
      } else {
        timeEntriesByChild.set(te.petitionId, [te]);
      }
    } else if (te.parentTaskId && childMap.has(te.parentTaskId)) {
      const list = timeEntriesByChild.get(te.parentTaskId);
      if (list) {
        list.push(te);
      } else {
        timeEntriesByChild.set(te.parentTaskId, [te]);
      }
    }
  }

  // Build grouped rows
  return calculatedRequests.map((calc) => {
    const parent = parentMap.get(calc.parentId);
    if (!parent) {
      // Should not happen, but handle gracefully
      return {
        parentId: calc.parentId,
        parentCode: calc.code,
        parentSubject: calc.subject,
        estimatedHours: calc.estimatedHours,
        actualHours: calc.actualHours,
        differenceHours: calc.differenceHours,
        deviationPercent: calc.deviationPercent,
        consumptionPercent: calculateConsumptionPercent(
          calc.estimatedHours,
          calc.actualHours,
        ),
        estimatedHbs: calc.estimatedHbs,
        consumedHbs: calc.consumedHbs,
        differenceHbs: calc.differenceHbs,
        deviationPercentHbs: calc.deviationPercentHbs,
        resultStatus: calc.resultStatus,
        riskLevel: calculateRiskLevel(calc.differenceHours),
        childrenCount: calc.childrenCount,
        timeEntriesCount: calc.timeEntriesCount,
        users: calc.people,
        roles: calc.roles,
        activities: calc.activities,
        applications: calc.applications,
        children: [],
      };
    }

    const parentChildren = childrenByParent.get(parent.id) ?? [];

    // Build grouped child rows
    const childRows: ChildRequestGroupedRow[] = parentChildren.map((child) => {
      const childTimeEntries = timeEntriesByChild.get(child.id) ?? [];

      // Group time entries by user + role
      const userRoleMap = new Map<
        string,
        { hours: number; activities: Set<string> }
      >();

      for (const te of childTimeEntries) {
        const user = te.user || "Sin usuario";
        const role = te.profiledRole || te.cauRole || "Sin rol";
        const key = `${user}|${role}`;

        const entry = userRoleMap.get(key);
        if (entry) {
          entry.hours += te.hours;
          if (te.activity) entry.activities.add(te.activity);
        } else {
          const activities = new Set<string>();
          if (te.activity) activities.add(te.activity);
          userRoleMap.set(key, { hours: te.hours, activities });
        }
      }

      // Convert to array
      const userRoleHours: UserRoleHoursSummary[] = Array.from(
        userRoleMap.entries(),
      ).map(([key, data]) => {
        const [user, role] = key.split("|");
        return {
          user,
          role,
          hours: data.hours,
          activities: Array.from(data.activities),
        };
      });

      // Calculate metrics
      const estimatedHours = child.estimatedHours;
      const actualHours = childTimeEntries.reduce(
        (sum, te) => sum + te.hours,
        0,
      );
      const differenceHours = estimatedHours - actualHours;
      const deviationPercent =
        estimatedHours > 0
          ? ((actualHours - estimatedHours) / estimatedHours) * 100
          : 0;

      // HBS calculations
      const estimatedHbs = child.estimatedHours ?? 0; // Note: cannot be calculated accurately without per-user breakdown
      const consumedHbs = calculateConsumedHbs(
        childTimeEntries.map((te) => ({ user: te.user, hours: te.hours })),
      );
      const differenceHbs = consumedHbs - estimatedHbs;
      const deviationPercentHbs =
        estimatedHbs > 0
          ? ((consumedHbs - estimatedHbs) / estimatedHbs) * 100
          : 0;

      // Collect unique users and roles from time entries
      const users = [
        ...new Set(
          childTimeEntries
            .map((te) => te.user || "Sin usuario")
            .filter(Boolean),
        ),
      ].sort();
      const roles = [
        ...new Set(
          childTimeEntries
            .flatMap((te) => [
              te.profiledRole || "Sin rol",
              te.cauRole || "Sin rol",
            ])
            .filter(Boolean),
        ),
      ].sort();
      const activities = [
        ...new Set(
          childTimeEntries.map((te) => te.activity).filter(Boolean) as string[],
        ),
      ].sort();

      return {
        childId: child.id,
        childCode: child.code,
        childSubject: child.subject,
        status: child.status,
        application: child.application,
        estimatedHours,
        actualHours,
        differenceHours,
        deviationPercent,
        estimatedHbs,
        consumedHbs,
        differenceHbs,
        deviationPercentHbs,
        users,
        roles,
        activities,
        userRoleHours,
        timeEntriesCount: childTimeEntries.length,
      };
    });

    // Collect unique values from children and time entries
    const allChildUsers = [
      ...new Set(
        childRows.flatMap((cr) => cr.users).filter(Boolean) as string[],
      ),
    ].sort();

    const allChildRoles = [
      ...new Set(
        childRows.flatMap((cr) => cr.roles).filter(Boolean) as string[],
      ),
    ].sort();

    const allChildActivities = [
      ...new Set(
        childRows.flatMap((cr) => cr.activities).filter(Boolean) as string[],
      ),
    ].sort();

    const allApplications = [
      ...new Set(
        [
          parent.application,
          ...parentChildren.map((c) => c.application),
          ...childRows.map((cr) => cr.application),
        ].filter(Boolean) as string[],
      ),
    ].sort();

    const consumptionPercent = calculateConsumptionPercent(
      calc.estimatedHours,
      calc.actualHours,
    );

    return {
      parentId: parent.id,
      parentCode: parent.code,
      parentSubject: parent.subject,
      project: parent.project,
      application: parent.application,
      status: parent.status,
      estimatedHours: calc.estimatedHours,
      actualHours: calc.actualHours,
      differenceHours: calc.differenceHours,
      deviationPercent: calc.deviationPercent,
      consumptionPercent,
      estimatedHbs: calc.estimatedHbs,
      consumedHbs: calc.consumedHbs,
      differenceHbs: calc.differenceHbs,
      deviationPercentHbs: calc.deviationPercentHbs,
      resultStatus: calc.resultStatus,
      riskLevel: calculateRiskLevel(calc.differenceHours),
      childrenCount: calc.childrenCount,
      timeEntriesCount: calc.timeEntriesCount,
      users: allChildUsers,
      roles: allChildRoles,
      activities: allChildActivities,
      applications: allApplications,
      children: childRows,
    };
  });
}

/**
 * Apply filters to parent grouped rows
 */
export function filterParentGroupedRows(
  rows: ParentGroupedTableRow[],
  filters: ParentGroupedTableFilters,
): ParentGroupedTableRow[] {
  return rows
    .map((row) => {
      // Apply child-level filters first
      let filteredChildren = row.children;

      if (
        filters.childCode ||
        filters.childSubject ||
        filters.user?.length ||
        filters.role?.length ||
        filters.activity?.length
      ) {
        filteredChildren = filteredChildren.filter((child) => {
          if (
            filters.childCode &&
            !child.childCode
              ?.toLowerCase()
              .includes(filters.childCode.toLowerCase())
          ) {
            return false;
          }

          if (
            filters.childSubject &&
            !child.childSubject
              .toLowerCase()
              .includes(filters.childSubject.toLowerCase())
          ) {
            return false;
          }

          if (filters.user && filters.user.length > 0) {
            const userExists = child.userRoleHours.some((urh) =>
              filters.user!.some((u) =>
                urh.user.toLowerCase().includes(u.toLowerCase()),
              ),
            );
            if (!userExists) return false;
          }

          if (filters.role && filters.role.length > 0) {
            const roleExists = child.userRoleHours.some((urh) =>
              filters.role!.some((r) =>
                urh.role.toLowerCase().includes(r.toLowerCase()),
              ),
            );
            if (!roleExists) return false;
          }

          if (filters.activity && filters.activity.length > 0) {
            const activityExists = child.activities.some((a) =>
              filters.activity!.some((act) =>
                a.toLowerCase().includes(act.toLowerCase()),
              ),
            );
            if (!activityExists) return false;
          }

          return true;
        });
      }

      // Calculate filtered actual hours if user/role filters are active
      let filteredActualHours: number | undefined = undefined;
      if (
        filters.user?.length ||
        filters.role?.length ||
        filters.activity?.length
      ) {
        filteredActualHours = filteredChildren.reduce((sum, child) => {
          const childHours = child.userRoleHours.reduce((s, urh) => {
            let matches = true;

            if (filters.user && filters.user.length > 0) {
              matches =
                matches &&
                filters.user.some((u) =>
                  urh.user.toLowerCase().includes(u.toLowerCase()),
                );
            }
            if (filters.role && filters.role.length > 0) {
              matches =
                matches &&
                filters.role.some((r) =>
                  urh.role.toLowerCase().includes(r.toLowerCase()),
                );
            }
            if (filters.activity && filters.activity.length > 0) {
              matches =
                matches &&
                filters.activity.some((act) =>
                  urh.activities.some((a) =>
                    a.toLowerCase().includes(act.toLowerCase()),
                  ),
                );
            }

            return matches ? s + urh.hours : s;
          }, 0);
          return sum + childHours;
        }, 0);
      }

      return {
        ...row,
        children: filteredChildren,
        filteredActualHours,
      };
    })
    .filter((row) => {
      // Parent-level filters
      if (
        filters.parentCode &&
        !row.parentCode.toLowerCase().includes(filters.parentCode.toLowerCase())
      ) {
        return false;
      }

      if (
        filters.parentSubject &&
        !row.parentSubject
          .toLowerCase()
          .includes(filters.parentSubject.toLowerCase())
      ) {
        return false;
      }

      if (filters.project && row.project !== filters.project) {
        return false;
      }

      if (
        filters.application &&
        !row.applications.some((a) => filters.application!.includes(a))
      ) {
        return false;
      }

      if (filters.status && row.status !== filters.status) {
        return false;
      }

      if (filters.resultStatus && row.resultStatus !== filters.resultStatus) {
        return false;
      }

      if (filters.riskLevel && row.riskLevel !== filters.riskLevel) {
        return false;
      }

      // Special filters
      if (filters.onlyLosses && row.resultStatus !== "loss") {
        return false;
      }

      if (filters.onlyDeviationOver20 && Math.abs(row.deviationPercent) <= 20) {
        return false;
      }

      if (filters.onlyConsumptionOver100 && row.consumptionPercent <= 100) {
        return false;
      }

      // If user/role/activity filters exist, only show if children passed the filter
      if (
        (filters.user?.length ||
          filters.role?.length ||
          filters.activity?.length) &&
        row.children.length === 0
      ) {
        return false;
      }

      // If any parent-level filter matched, need at least matching children
      if (
        filters.childCode ||
        filters.childSubject ||
        filters.user?.length ||
        filters.role?.length ||
        filters.activity?.length
      ) {
        if (row.children.length === 0) {
          return false;
        }
      }

      return true;
    });
}
