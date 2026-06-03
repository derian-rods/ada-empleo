import type { ParentRequest, ChildRequest, TimeEntry } from "./types";
import { parseCsvNumber, extractIssueId, cleanText } from "./csvUtils";

type Row = Record<string, unknown>;

const PROFILE_HOUR_COLUMNS = [
  "Horas JP",
  "Horas CS",
  "Horas AF",
  "Horas AS / ES",
  "Horas AP / TS",
  "Horas P",
] as const;

function getEstimatedFromProfiles(row: Row): number {
  const sum = PROFILE_HOUR_COLUMNS.reduce(
    (acc, col) => acc + parseCsvNumber(row[col]),
    0,
  );
  return sum;
}

function getEstimatedHours(row: Row, useProfiles: boolean): number {
  if (useProfiles) {
    const profileSum = getEstimatedFromProfiles(row);
    if (profileSum > 0) return profileSum;
  }
  const total = parseCsvNumber(row["Total de Tiempo Estimado"]);
  if (total > 0) return total;
  return parseCsvNumber(row["Tiempo estimado"]);
}

export function normalizeParentRequests(rows: Row[]): ParentRequest[] {
  return rows
    .filter((row) => row["#"] !== undefined && row["#"] !== "")
    .map((row) => ({
      id: String(row["#"]).trim(),
      code: String(row["#"]).trim(),
      project: cleanText(row["Proyecto"]),
      tracker: cleanText(row["Tracker de peticiones"]),
      parentId: extractIssueId(row["Tarea padre"]),
      parentSubject: cleanText(row["Asunto de la tarea padre"]),
      subject: cleanText(row["Asunto"]) ?? "",
      status: cleanText(row["Estado"]),
      priority: cleanText(row["Prioridad"]),
      author: cleanText(row["Autor"]),
      assignee: cleanText(row["Asignado a"]),
      version: cleanText(row["Versión prevista"]),
      application: cleanText(row["Aplicación"]),
      estimatedHours: getEstimatedHours(row, false),
      dedicatedHoursFromExport:
        parseCsvNumber(row["Tiempo dedicado"]) || undefined,
      totalDedicatedHoursFromExport:
        parseCsvNumber(row["Tiempo total dedicado"]) || undefined,
      createdAt: cleanText(row["Creado"]),
      updatedAt: cleanText(row["Actualizado"]),
    }));
}

export function normalizeChildRequests(rows: Row[]): ChildRequest[] {
  return rows
    .filter((row) => row["#"] !== undefined && row["#"] !== "")
    .map((row) => ({
      id: String(row["#"]).trim(),
      code: String(row["#"]).trim(),
      parentId: extractIssueId(row["Tarea padre"]),
      project: cleanText(row["Proyecto"]),
      tracker: cleanText(row["Tracker de peticiones"]),
      parentSubject: cleanText(row["Asunto de la tarea padre"]),
      subject: cleanText(row["Asunto"]) ?? "",
      status: cleanText(row["Estado"]),
      priority: cleanText(row["Prioridad"]),
      author: cleanText(row["Autor"]),
      assignee: cleanText(row["Asignado a"]),
      assignedUser: cleanText(row["Asignado a"]), // For GSP table
      profile: cleanText(row["Perfil TiC"]), // For GSP table
      category: cleanText(row["Categoría"]),
      version: cleanText(row["Versión prevista"]),
      application: cleanText(row["Aplicación"]),
      estimatedHours: getEstimatedHours(row, true),
      // Profile-based hours
      estimatedHoursJp: parseCsvNumber(row["Horas JP"]) || undefined,
      estimatedHoursCs: parseCsvNumber(row["Horas CS"]) || undefined,
      estimatedHoursAf: parseCsvNumber(row["Horas AF"]) || undefined,
      estimatedHoursAsEs: parseCsvNumber(row["Horas AS / ES"]) || undefined,
      estimatedHoursApTs: parseCsvNumber(row["Horas AP / TS"]) || undefined,
      estimatedHoursP: parseCsvNumber(row["Horas P"]) || undefined,
      dedicatedHoursFromExport:
        parseCsvNumber(row["Tiempo dedicado"]) || undefined,
      totalDedicatedHoursFromExport:
        parseCsvNumber(row["Tiempo total dedicado"]) || undefined,
      costWithoutVat: parseCsvNumber(row["Coste sin IVA"]) || undefined,
      createdAt: cleanText(row["Creado"]),
      updatedAt: cleanText(row["Actualizado"]),
    }));
}

export function normalizeTimeEntries(rows: Row[]): TimeEntry[] {
  return rows.map((row, index) => {
    const petitionRaw = cleanText(row["Petición"]);
    const parentTaskRaw = cleanText(row["Tarea padre"]);
    // Usar Usuario si existe, sino usar Autor como fallback
    const user = cleanText(row["Usuario"]) || cleanText(row["Autor"]);
    const date = cleanText(row["Fecha"]);
    const hours = parseCsvNumber(row["Horas"]);

    return {
      id: `te-${index}-${extractIssueId(row["Petición"]) ?? "no-id"}-${date ?? ""}-${user ?? ""}-${hours}`,
      project: cleanText(row["Proyecto"]),
      date,
      createdAt: cleanText(row["Creado"]),
      week: cleanText(row["Semana"]),
      author: cleanText(row["Autor"]),
      user,
      activity: cleanText(row["Actividad"]),
      petitionRaw,
      petitionId: extractIssueId(row["Petición"]),
      parentTaskRaw,
      parentTaskId: extractIssueId(row["Tarea padre"]),
      tracker: cleanText(row["Tracker de peticiones"]),
      status: cleanText(row["Estado"]),
      category: cleanText(row["Categoría"]),
      version: cleanText(row["Versión prevista"]),
      comment: cleanText(row["Comentario"]),
      hours,
      profiledRole: cleanText(row["Perfil (perfilado)"]),
      cauRole: cleanText(row["Perfil (CAU in-situ)"]),
      application: cleanText(row["Aplicación"]),
    };
  });
}
