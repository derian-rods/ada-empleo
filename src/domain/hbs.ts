/**
 * HBS Module - Collaborative Hours Billing System
 *
 * Manages profiles, ratios, and HBS calculations for the team.
 * HBS = horas * ratio_transformación_HBS
 *
 * Profiles define the billing rate multiplier for each role.
 */

// Profile definitions with HBS ratios
export const HBS_PROFILES = {
  GP: { name: "Gestor de proyecto", ratio: 1.69 },
  CD: { name: "Consultor digital", ratio: 1.49 },
  AN: { name: "Analista de negocio", ratio: 1.16 },
  ARQ: { name: "Arquitecto de sistemas", ratio: 1.33 },
  AS: { name: "Analista de sistemas", ratio: 1.18 },
  DE: { name: "Desarrollador", ratio: 1.0 },
} as const;

export type ProfileCode = keyof typeof HBS_PROFILES;

// Collaborator database: maps name to profile
export const COLLABORATORS: Record<string, ProfileCode> = {
  "Gerardo Manuel García Guillén": "GP",
  "Cristina Domínguez Quirós": "CD",
  "Enriqueta González Pérez": "CD",
  "Diego Manovel Alamillo": "CD",
  "José Miguel Morales Ortíz": "CD",
  "Pedro González Mora": "AS",
  "Juan Manuel Lineros Fernández": "AS",
  "Cándido Iglesias Morato": "AS",
  "Gabriel Díaz Gavira": "AS",
  "Julián Fernández Corimayo": "DE",
  "Jose Maria Serrano Sáez": "DE",
  "Fátima Elsayed Torres": "DE",
  "Francisco Rodríguez Espinosa": "DE",
  "Alfonso Trigueros Benitez": "DE",
  "Laia Benavent Ribelles": "DE",
  "Derian Rodriguez Salazar": "DE",
  "Kevin Rosales Martínez": "DE",
};

/**
 * Get the profile code for a collaborator by name
 * Returns the profile code or undefined if not found
 * @param collaboratorName - Full name of the collaborator
 * @returns Profile code (GP, CD, AN, ARQ, AS, DE) or undefined
 */
export function getCollaboratorProfile(
  collaboratorName: string,
): ProfileCode | undefined {
  if (!collaboratorName) return undefined;
  return COLLABORATORS[collaboratorName.trim()];
}

/**
 * Get the HBS ratio for a given profile code
 * @param profile - Profile code (GP, CD, AN, ARQ, AS, DE)
 * @returns HBS ratio or 1.0 as fallback for unknown profiles
 */
export function getHbsRatioByProfile(profile: ProfileCode | undefined): number {
  if (!profile || !HBS_PROFILES[profile]) {
    console.warn(
      `[HBS] Unknown profile: ${profile}, using ratio 1.0 as fallback`,
    );
    return 1.0;
  }
  return HBS_PROFILES[profile].ratio;
}

/**
 * Calculate consumed HBS from time entries
 * Each time entry's hours are multiplied by the HBS ratio of the collaborator's profile
 *
 * @param timeEntries - Array of time entries with user and hours
 * @returns Total consumed HBS
 */
export function calculateConsumedHbs(
  timeEntries: Array<{ user?: string; hours: number }>,
): number {
  return timeEntries.reduce((total, entry) => {
    if (!entry.user) {
      console.warn("[HBS] Time entry without user, hours not counted for HBS");
      return total;
    }

    const profile = getCollaboratorProfile(entry.user);
    const ratio = getHbsRatioByProfile(profile);
    const hbs = entry.hours * ratio;

    return total + hbs;
  }, 0);
}

/**
 * Calculate estimated HBS from estimated hours
 *
 * IMPORTANT: Estimated hours in the system are NOT associated with a specific collaborator.
 * They are assigned at the request level, not per-user.
 *
 * This function:
 * 1. Returns 0 if no collaborator info is available
 * 2. Logs a warning that exact HBS estimates cannot be calculated
 * 3. Provides a fallback mechanism for future use if collaborator data becomes available
 *
 * @param estimatedHours - Total estimated hours (not per-collaborator)
 * @param collaboratorName - Optional: if provided, uses this to calculate HBS
 * @returns Estimated HBS (0 if no collaborator data, or estimated hours * ratio if provided)
 */
export function calculateEstimatedHbs(
  estimatedHours: number,
  collaboratorName?: string,
): number {
  // If no collaborator name provided, we cannot accurately estimate HBS
  if (!collaboratorName) {
    if (estimatedHours > 0) {
      console.warn(
        "[HBS] Estimated hours are not associated with a collaborator. " +
          "Cannot calculate exact estimated HBS without profile information. " +
          "Returning 0. (This is expected behavior - HBS estimates require per-collaborator breakdown)",
      );
    }
    return 0;
  }

  // If collaborator is provided, calculate HBS
  const profile = getCollaboratorProfile(collaboratorName);
  const ratio = getHbsRatioByProfile(profile);
  return estimatedHours * ratio;
}

/**
 * Get the full profile details for a collaborator
 * @param collaboratorName - Full name of the collaborator
 * @returns Profile object with name and ratio, or undefined if not found
 */
export function getCollaboratorFullProfile(
  collaboratorName: string,
): { code: ProfileCode; name: string; ratio: number } | undefined {
  const code = getCollaboratorProfile(collaboratorName);
  if (!code) return undefined;

  return {
    code,
    name: HBS_PROFILES[code].name,
    ratio: HBS_PROFILES[code].ratio,
  };
}

/**
 * Get all known collaborators
 * @returns Array of collaborator names
 */
export function getAllCollaborators(): string[] {
  return Object.keys(COLLABORATORS);
}

/**
 * Get all profiles
 * @returns Array of profile information
 */
export function getAllProfiles(): Array<{
  code: ProfileCode;
  name: string;
  ratio: number;
}> {
  return Object.entries(HBS_PROFILES).map(([code, data]) => ({
    code: code as ProfileCode,
    name: data.name,
    ratio: data.ratio,
  }));
}
