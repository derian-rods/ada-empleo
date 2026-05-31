/**
 * Colaboradores Domain
 *
 * Lógica centralizada para transformar TimeEntries en resúmenes de colaboradores
 * agrupados por mes con detalle de imputaciones.
 */

import type { TimeEntry, ChildRequest, ParentRequest } from "./types";

/**
 * Detalle de una imputación de un colaborador
 */
export interface CollaboratorTimeEntryDetail {
  id: string;
  petitionCode: string;
  petitionTitle?: string;
  parentRequestCode?: string;
  parentRequestTitle?: string;
  date: string;
  monthKey: string; // "2026-05" para ordenar
  monthDisplay: string; // "Mayo 2026"
  hours: number;
  activity?: string;
}

/**
 * Resumen mensual de horas por mes
 */
export interface MonthSummary {
  monthKey: string; // "2026-05"
  monthDisplay: string; // "Mayo 2026"
  hours: number;
}

/**
 * Resumen agregado de un colaborador
 */
export interface CollaboratorMonthlySummary {
  collaboratorName: string;
  totalHours: number;
  uniqueRequestCount: number;
  months: Record<string, number>; // monthKey → hours
  monthsList: MonthSummary[]; // Meses ordenados
  entries: CollaboratorTimeEntryDetail[];
}

/**
 * Resumen general de colaboradores
 */
export interface CollaboratorsPageSummary {
  totalCollaborators: number;
  totalHours: number;
  totalUniqueRequests: number;
  monthRange: {
    firstMonth: string; // "2026-01"
    lastMonth: string; // "2026-12"
    displayRange: string; // "Enero 2026 - Diciembre 2026"
  };
  monthsAvailable: MonthSummary[];
}

/**
 * Obtener mes y año desde una fecha string
 * Soporta formatos: "2026-05-12", "12/05/2026", "12-05-2026"
 * @returns { monthKey: "2026-05", monthDisplay: "Mayo 2026" } o null si inválida
 */
export function extractMonthFromDate(
  dateStr: string | undefined,
): { monthKey: string; monthDisplay: string } | null {
  if (!dateStr || typeof dateStr !== "string") return null;

  let year: number | null = null;
  let month: number | null = null;

  // Intenta formato ISO: "2026-05-12"
  if (dateStr.includes("-")) {
    const parts = dateStr.split("-");
    if (parts.length >= 2 && !isNaN(+parts[0]) && !isNaN(+parts[1])) {
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
    }
  }

  // Intenta formato español: "12/05/2026" o "12-05-2026"
  if (!year && dateStr.includes("/")) {
    const parts = dateStr.split("/");
    if (parts.length === 3 && !isNaN(+parts[2]) && !isNaN(+parts[1])) {
      year = parseInt(parts[2], 10);
      month = parseInt(parts[1], 10);
    }
  }

  if (!year || !month || month < 1 || month > 12) return null;

  const monthKey = `${year}-${String(month).padStart(2, "0")}`;
  const monthDisplay = formatMonth(new Date(year, month - 1, 1));

  return { monthKey, monthDisplay };
}

/**
 * Formatear una fecha a "dd/mm/yyyy"
 */
export function formatDateSpanish(dateStr: string | undefined): string {
  if (!dateStr) return "-";

  try {
    // Intenta parsear diferentes formatos
    let date: Date | null = null;

    if (dateStr.includes("T")) {
      // ISO format
      date = new Date(dateStr);
    } else if (dateStr.includes("-")) {
      // "2026-05-12"
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        date = new Date(
          parseInt(parts[0]),
          parseInt(parts[1]) - 1,
          parseInt(parts[2]),
        );
      }
    } else if (dateStr.includes("/")) {
      // "12/05/2026"
      const parts = dateStr.split("/");
      if (parts.length === 3) {
        date = new Date(
          parseInt(parts[2]),
          parseInt(parts[1]) - 1,
          parseInt(parts[0]),
        );
      }
    }

    if (!date || isNaN(date.getTime())) return dateStr;

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

/**
 * Formatear fecha a nombre del mes español (solo mes, sin año)
 */
export function formatMonth(date: Date): string {
  const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  const month = monthNames[date.getMonth()];

  return month;
}

/**
 * Formatear horas a string con máximo 2 decimales
 */
export function formatHours(hours: number | undefined): string {
  if (hours === undefined || hours === null) return "0";

  const formatted = hours.toLocaleString("es-ES", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });

  return `${formatted}h`;
}

/**
 * Transformar TimeEntries en resumen de colaboradores
 *
 * Agrupa por colaborador, luego por mes, con detalle de cada imputación
 */
export function buildCollaboratorsSummary(
  timeEntries: TimeEntry[],
  children: ChildRequest[],
  parents: ParentRequest[],
): CollaboratorMonthlySummary[] {
  // Mapas para búsqueda rápida
  const childrenMap = new Map(children.map((c) => [c.code, c]));
  const parentsMap = new Map(parents.map((p) => [p.code, p]));

  // Agrupar por colaborador
  const collaborators = new Map<string, CollaboratorTimeEntryDetail[]>();

  for (const entry of timeEntries) {
    // Validar datos mínimos
    if (!entry.user || !entry.hours || entry.hours <= 0) continue;

    const user = entry.user.trim();
    if (!user) continue;

    // Extraer mes
    const monthInfo = extractMonthFromDate(entry.date);
    if (!monthInfo) continue;

    // Obtener información de petición si está disponible
    let petitionCode = entry.petitionId || "";
    let petitionTitle = "";
    let parentRequestCode = "";
    let parentRequestTitle = "";

    if (entry.petitionId) {
      const child = childrenMap.get(entry.petitionId);
      if (child) {
        petitionCode = child.code;
        petitionTitle = child.subject;
        if (child.parentId) {
          const parent = parentsMap.get(child.parentId);
          if (parent) {
            parentRequestCode = parent.code;
            parentRequestTitle = parent.subject;
          }
        }
      }
    }

    // Crear detalle
    const detail: CollaboratorTimeEntryDetail = {
      id: entry.id || `${user}-${monthInfo.monthKey}-${petitionCode}`,
      petitionCode,
      petitionTitle,
      parentRequestCode,
      parentRequestTitle,
      date: formatDateSpanish(entry.date),
      monthKey: monthInfo.monthKey,
      monthDisplay: monthInfo.monthDisplay,
      hours: entry.hours,
      activity: entry.activity,
    };

    // Agregar al colaborador
    if (!collaborators.has(user)) {
      collaborators.set(user, []);
    }
    collaborators.get(user)!.push(detail);
  }

  // Construir resúmenes
  const summaries: CollaboratorMonthlySummary[] = [];

  for (const [collaboratorName, entries] of collaborators) {
    // Agrupar por mes
    const monthsMap = new Map<string, number>();
    const uniqueRequests = new Set<string>();

    for (const entry of entries) {
      const current = monthsMap.get(entry.monthKey) || 0;
      monthsMap.set(entry.monthKey, current + entry.hours);

      if (entry.petitionCode) {
        uniqueRequests.add(entry.petitionCode);
      }
    }

    // Calcular totales
    const totalHours = Array.from(monthsMap.values()).reduce(
      (sum, h) => sum + h,
      0,
    );

    // Ordenar meses
    const sortedMonths = Array.from(monthsMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([monthKey, hours]) => ({
        monthKey,
        monthDisplay:
          extractMonthFromDate(`${monthKey}-01`)?.monthDisplay || monthKey,
        hours,
      }));

    // Ordenar entradas por fecha
    const sortedEntries = [...entries].sort((a, b) => {
      const dateA = a.monthKey + a.date;
      const dateB = b.monthKey + b.date;
      return dateA.localeCompare(dateB);
    });

    summaries.push({
      collaboratorName,
      totalHours,
      uniqueRequestCount: uniqueRequests.size,
      months: Object.fromEntries(monthsMap),
      monthsList: sortedMonths,
      entries: sortedEntries,
    });
  }

  // Ordenar colaboradores alfabéticamente
  summaries.sort((a, b) =>
    a.collaboratorName.localeCompare(b.collaboratorName),
  );

  return summaries;
}

/**
 * Crear resumen de página con totales y rango de meses
 */
export function buildCollaboratorsPageSummary(
  summaries: CollaboratorMonthlySummary[],
): CollaboratorsPageSummary {
  const allMonths = new Set<string>();
  let totalHours = 0;
  let totalUniqueRequests = 0;

  for (const summary of summaries) {
    totalHours += summary.totalHours;
    totalUniqueRequests += summary.uniqueRequestCount;

    for (const monthKey of Object.keys(summary.months)) {
      allMonths.add(monthKey);
    }
  }

  const sortedMonths = Array.from(allMonths)
    .sort()
    .map((monthKey) => ({
      monthKey,
      monthDisplay:
        extractMonthFromDate(`${monthKey}-01`)?.monthDisplay || monthKey,
      hours: 0,
    }));

  const firstMonth = sortedMonths[0]?.monthKey || "";
  const lastMonth = sortedMonths[sortedMonths.length - 1]?.monthKey || "";

  let displayRange = "";
  if (firstMonth && lastMonth) {
    const firstDisplay =
      extractMonthFromDate(`${firstMonth}-01`)?.monthDisplay || firstMonth;
    const lastDisplay =
      extractMonthFromDate(`${lastMonth}-01`)?.monthDisplay || lastMonth;
    displayRange = `${firstDisplay} - ${lastDisplay}`;
  }

  return {
    totalCollaborators: summaries.length,
    totalHours,
    totalUniqueRequests,
    monthRange: {
      firstMonth,
      lastMonth,
      displayRange,
    },
    monthsAvailable: sortedMonths,
  };
}

/**
 * Filtrar colaboradores por criterios
 */
export interface CollaboratorFilters {
  collaboratorNames?: string[]; // múltiples colaboradores
  dateFrom?: string; // fecha inicio (ISO: "2026-05-01")
  dateTo?: string; // fecha fin (ISO: "2026-05-31")
  petitionCode?: string; // búsqueda parcial, case-insensitive
}

export function filterCollaborators(
  summaries: CollaboratorMonthlySummary[],
  filters: CollaboratorFilters,
): CollaboratorMonthlySummary[] {
  return summaries
    .map((summary) => {
      // Filtrar por nombre de colaborador (múltiples)
      if (
        filters.collaboratorNames &&
        filters.collaboratorNames.length > 0 &&
        !filters.collaboratorNames.includes(summary.collaboratorName)
      ) {
        return null;
      }

      // Filtrar entradas por rango de fechas y petición
      let filteredEntries = summary.entries;

      // Filtrar por rango de fechas
      if (filters.dateFrom || filters.dateTo) {
        const dateFrom = filters.dateFrom ? new Date(filters.dateFrom) : null;
        const dateTo = filters.dateTo ? new Date(filters.dateTo) : null;

        filteredEntries = filteredEntries.filter((e) => {
          // Intentar parsear la fecha en diferentes formatos
          let entryDate: Date | null = null;

          // Intenta ISO: "2026-05-12"
          if (e.monthKey && e.monthKey.includes("-")) {
            const [year, month, day] = e.monthKey.split("-");
            entryDate = new Date(`${year}-${month}-${day || "01"}`);
          }

          if (!entryDate || isNaN(entryDate.getTime())) {
            return true; // Si no puede parsear, incluir
          }

          if (dateFrom && entryDate < dateFrom) return false;
          if (dateTo && entryDate > dateTo) return false;
          return true;
        });
      }

      if (filters.petitionCode) {
        filteredEntries = filteredEntries.filter((e) =>
          e.petitionCode
            .toLowerCase()
            .includes(filters.petitionCode!.toLowerCase()),
        );
      }

      if (filteredEntries.length === 0) {
        return null; // No hay entradas después de filtrar
      }

      // Recalcular meses y totales basado en entradas filtradas
      const monthsMap = new Map<string, number>();
      const uniqueRequests = new Set<string>();

      for (const entry of filteredEntries) {
        const current = monthsMap.get(entry.monthKey) || 0;
        monthsMap.set(entry.monthKey, current + entry.hours);

        if (entry.petitionCode) {
          uniqueRequests.add(entry.petitionCode);
        }
      }

      const totalHours = Array.from(monthsMap.values()).reduce(
        (sum, h) => sum + h,
        0,
      );

      const sortedMonths = Array.from(monthsMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([monthKey, hours]) => ({
          monthKey,
          monthDisplay:
            extractMonthFromDate(`${monthKey}-01`)?.monthDisplay || monthKey,
          hours,
        }));

      return {
        ...summary,
        totalHours,
        uniqueRequestCount: uniqueRequests.size,
        months: Object.fromEntries(monthsMap),
        monthsList: sortedMonths,
        entries: filteredEntries,
      };
    })
    .filter((s) => s !== null) as CollaboratorMonthlySummary[];
}
