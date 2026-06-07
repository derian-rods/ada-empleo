/**
 * Companies Domain
 *
 * Gestiona información de empresas y colaboradores.
 * Actualmente incluye a Sopra Steria como empresa base.
 */

import type { TimeEntry } from "./types";

/**
 * Representación de un colaborador de empresa
 */
export interface CompanyCollaborator {
  id: string;
  name: string; // Nombre completo del colaborador
  company: string; // Nombre de la empresa
  profile: string; // Perfil/rol del colaborador (GP, CD, AS, DE, etc.)
  department?: string; // Departamento (opcional)
}

/**
 * JSON de colaboradores Sopra Steria
 * Fuente: Lista proporcionada del cliente
 * NOTA: Los nombres se ajustan para coincidir exactamente con los CSV de "Tiempo dedicado"
 */
export const SOPRA_STERIA_COLLABORATORS: CompanyCollaborator[] = [
  {
    id: "ss-001",
    name: "Gerardo Manuel García Guillén",
    company: "Sopra Steria",
    profile: "Gestor de proyecto (GP)",
  },
  {
    id: "ss-002",
    name: "Cristina Domínguez Quirós",
    company: "Sopra Steria",
    profile: "Consultor digital (CD)",
  },
  {
    id: "ss-003",
    name: "Enriqueta González Pérez",
    company: "Sopra Steria",
    profile: "Consultor digital (CD)",
  },
  {
    id: "ss-004",
    name: "Diego Manovel Alamillo",
    company: "Sopra Steria",
    profile: "Consultor digital (CD)",
  },
  {
    id: "ss-005",
    name: "José Miguel Morales Ortíz",
    company: "Sopra Steria",
    profile: "Consultor digital (CD)",
  },
  {
    id: "ss-006",
    name: "Pedro González Mora",
    company: "Sopra Steria",
    profile: "Analista de sistemas (AS)",
  },
  {
    id: "ss-007",
    name: "Juan Manuel Lineros Fernández",
    company: "Sopra Steria",
    profile: "Analista de sistemas (AS)",
  },
  {
    id: "ss-008",
    name: "Cándido Iglesias Morato",
    company: "Sopra Steria",
    profile: "Analista de sistemas (AS)",
  },
  {
    id: "ss-009",
    name: "Gabriel Díaz Gavira",
    company: "Sopra Steria",
    profile: "Analista de sistemas (AS)",
  },
  {
    id: "ss-010",
    name: "Julián Fernández Corimayo",
    company: "Sopra Steria",
    profile: "Desarrollador (DE)",
  },
  {
    id: "ss-011",
    name: "Jose Maria Serrano Sáez",
    company: "Sopra Steria",
    profile: "Desarrollador (DE)",
  },
  {
    id: "ss-012",
    name: "Fátima Elsayed Torres",
    company: "Sopra Steria",
    profile: "Desarrollador (DE)",
  },
  {
    id: "ss-013",
    name: "Francisco Rodríguez Espinosa",
    company: "Sopra Steria",
    profile: "Desarrollador (DE)",
  },
  {
    id: "ss-014",
    name: "Alfonso Trigueros Benitez",
    company: "Sopra Steria",
    profile: "Desarrollador (DE)",
  },
  {
    id: "ss-015",
    name: "Laia Benavent Ribelles",
    company: "Sopra Steria",
    profile: "Desarrollador (DE)",
  },
  {
    id: "ss-016",
    name: "Derian Rodriguez Salazar",
    company: "Sopra Steria",
    profile: "Desarrollador (DE)",
  },
  {
    id: "ss-017",
    name: "Kevin Rosales Martínez",
    company: "Sopra Steria",
    profile: "Desarrollador (DE)",
  },
];

/**
 * Construir mapa rápido: nombre colaborador → CompanyCollaborator
 * Para búsqueda O(1) al asignar empresa a TimeEntries
 *
 * @param collaborators Lista de colaboradores
 * @returns Map<string, CompanyCollaborator>
 */
export function buildCollaboratorMap(
  collaborators: CompanyCollaborator[],
): Map<string, CompanyCollaborator> {
  const map = new Map<string, CompanyCollaborator>();

  for (const collaborator of collaborators) {
    // Clave normalizada (lowercase, sin espacios extras)
    const normalizedName = normalizeCollaboratorName(collaborator.name);
    map.set(normalizedName, collaborator);
  }

  return map;
}

/**
 * Normalizar nombre de colaborador para comparación
 * Convierte a lowercase y elimina espacios extras
 *
 * @param name Nombre a normalizar
 * @returns Nombre normalizado
 */
export function normalizeCollaboratorName(name: string): string {
  if (!name || typeof name !== "string") return "";
  return name.toLowerCase().trim();
}

/**
 * Obtener empresa de un colaborador por nombre
 *
 * @param collaboratorName Nombre del colaborador
 * @param collaboratorMap Mapa pre-construido para búsqueda rápida
 * @returns CompanyCollaborator o null
 */
export function findCompanyCollaborator(
  collaboratorName: string,
  collaboratorMap: Map<string, CompanyCollaborator>,
): CompanyCollaborator | null {
  const normalized = normalizeCollaboratorName(collaboratorName);
  return collaboratorMap.get(normalized) || null;
}

/**
 * Asignar empresa a TimeEntries basado en lista de colaboradores
 * Enriquece cada entry con información de empresa si el usuario está en la lista
 *
 * @param timeEntries Entradas de tiempo originales
 * @param collaborators Lista de colaboradores con empresa asignada
 * @returns TimeEntry[] enriquecido con companyName
 */
export function assignCompanyToTimeEntries(
  timeEntries: TimeEntry[],
  collaborators: CompanyCollaborator[],
): TimeEntry[] {
  const collaboratorMap = buildCollaboratorMap(collaborators);

  return timeEntries.map((entry) => {
    if (!entry.user) {
      return entry; // Sin usuario, no se puede asignar empresa
    }

    const found = findCompanyCollaborator(entry.user, collaboratorMap);

    return {
      ...entry,
      companyName: found ? found.company : "Otros",
    };
  });
}

/**
 * Filtrar TimeEntries por empresa
 *
 * @param timeEntries Entradas de tiempo
 * @param companyFilter Nombre de empresa o null para todas
 * @returns TimeEntry[] filtradas
 */
export function filterTimeEntriesByCompany(
  timeEntries: TimeEntry[],
  companyFilter: string | null,
): TimeEntry[] {
  if (!companyFilter) {
    return timeEntries; // Sin filtro, retorna todas
  }

  return timeEntries.filter((entry) => entry.companyName === companyFilter);
}

/**
 * Obtener lista única de empresas en TimeEntries
 *
 * @param timeEntries Entradas de tiempo
 * @returns string[] con nombres únicos de empresas
 */
export function getUniqueCompaniesFromTimeEntries(
  timeEntries: TimeEntry[],
): string[] {
  const companies = new Set<string>();

  for (const entry of timeEntries) {
    if (entry.companyName) {
      companies.add(entry.companyName);
    }
  }

  return Array.from(companies).sort();
}
