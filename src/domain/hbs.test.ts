import { describe, it, expect, vi } from "vitest";
import {
  getCollaboratorProfile,
  getHbsRatioByProfile,
  calculateConsumedHbs,
  calculateEstimatedHbs,
  getCollaboratorFullProfile,
  getAllCollaborators,
  getAllProfiles,
  HBS_PROFILES,
  COLLABORATORS,
} from "./hbs";

describe("HBS Module", () => {
  describe("getCollaboratorProfile", () => {
    it("debe retornar el perfil correcto para un colaborador conocido", () => {
      const profile = getCollaboratorProfile("Gerardo Manuel García Guillén");
      expect(profile).toBe("GP");
    });

    it("debe retornar el perfil CD para Cristina Domínguez Quirós", () => {
      const profile = getCollaboratorProfile("Cristina Domínguez Quirós");
      expect(profile).toBe("CD");
    });

    it("debe retornar undefined para un colaborador desconocido", () => {
      const profile = getCollaboratorProfile("Persona Desconocida");
      expect(profile).toBeUndefined();
    });

    it("debe retornar undefined para string vacío", () => {
      const profile = getCollaboratorProfile("");
      expect(profile).toBeUndefined();
    });

    it("debe manejar espacios en blanco", () => {
      const profile = getCollaboratorProfile(
        "  Gerardo Manuel García Guillén  ",
      );
      expect(profile).toBe("GP");
    });
  });

  describe("getHbsRatioByProfile", () => {
    it("debe retornar 1.69 para GP", () => {
      const ratio = getHbsRatioByProfile("GP");
      expect(ratio).toBe(1.69);
    });

    it("debe retornar 1.49 para CD", () => {
      const ratio = getHbsRatioByProfile("CD");
      expect(ratio).toBe(1.49);
    });

    it("debe retornar 1.00 para DE", () => {
      const ratio = getHbsRatioByProfile("DE");
      expect(ratio).toBe(1.0);
    });

    it("debe retornar 1.0 como fallback para perfil desconocido", () => {
      const ratio = getHbsRatioByProfile(undefined);
      expect(ratio).toBe(1.0);
    });

    it("debe loguear warning para perfil desconocido", () => {
      const consoleSpy = vi.spyOn(console, "warn");
      getHbsRatioByProfile(undefined);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("calculateConsumedHbs", () => {
    it("debe calcular correctamente HBS consumidas para un colaborador GP", () => {
      const entries = [{ user: "Gerardo Manuel García Guillén", hours: 10 }];
      const hbs = calculateConsumedHbs(entries);
      expect(hbs).toBe(10 * 1.69); // 16.9
    });

    it("debe sumar HBS de múltiples colaboradores", () => {
      const entries = [
        { user: "Gerardo Manuel García Guillén", hours: 10 }, // GP: 10 * 1.69 = 16.9
        { user: "Julián Fernández Corimayo", hours: 8 }, // DE: 8 * 1.0 = 8
      ];
      const hbs = calculateConsumedHbs(entries);
      expect(hbs).toBeCloseTo(24.9, 1);
    });

    it("debe retornar 0 para array vacío", () => {
      const hbs = calculateConsumedHbs([]);
      expect(hbs).toBe(0);
    });

    it("debe ignorar entries sin usuario", () => {
      const consoleSpy = vi.spyOn(console, "warn");
      const entries = [
        { user: undefined, hours: 10 },
        { user: "Gerardo Manuel García Guillén", hours: 5 },
      ];
      const hbs = calculateConsumedHbs(entries);
      expect(hbs).toBe(5 * 1.69); // Solo cuenta la segunda
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("without user"),
      );
      consoleSpy.mockRestore();
    });

    it("debe usar ratio 1.0 para colaborador desconocido", () => {
      const entries = [{ user: "Persona Desconocida", hours: 10 }];
      const hbs = calculateConsumedHbs(entries);
      expect(hbs).toBe(10); // Sin multiplicador
    });
  });

  describe("calculateEstimatedHbs", () => {
    it("debe retornar 0 sin nombre de colaborador (documentado)", () => {
      const hbs = calculateEstimatedHbs(100);
      expect(hbs).toBe(0);
    });

    it("debe retornar 0 y loguear warning sin nombre de colaborador", () => {
      const consoleSpy = vi.spyOn(console, "warn");
      calculateEstimatedHbs(100);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("not associated with a collaborator"),
      );
      consoleSpy.mockRestore();
    });

    it("debe retornar 0 para 0 horas sin loguear si collaborator no proporcionado", () => {
      const consoleSpy = vi.spyOn(console, "warn");
      const hbs = calculateEstimatedHbs(0);
      expect(hbs).toBe(0);
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("debe calcular HBS estimadas si collaborator name se proporciona", () => {
      const hbs = calculateEstimatedHbs(100, "Gerardo Manuel García Guillén");
      expect(hbs).toBe(100 * 1.69); // 169
    });

    it("debe calcular con ratio 1.0 para colaborador desconocido", () => {
      const consoleSpy = vi.spyOn(console, "warn");
      const hbs = calculateEstimatedHbs(100, "Persona Desconocida");
      expect(hbs).toBe(100);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("ratio 1.0"),
      );
      consoleSpy.mockRestore();
    });
  });

  describe("getCollaboratorFullProfile", () => {
    it("debe retornar profile completo para colaborador conocido", () => {
      const profile = getCollaboratorFullProfile(
        "Gerardo Manuel García Guillén",
      );
      expect(profile).toEqual({
        code: "GP",
        name: "Gestor de proyecto",
        ratio: 1.69,
      });
    });

    it("debe retornar undefined para colaborador desconocido", () => {
      const profile = getCollaboratorFullProfile("Persona Desconocida");
      expect(profile).toBeUndefined();
    });
  });

  describe("getAllCollaborators", () => {
    it("debe retornar array con todos los colaboradores", () => {
      const collaborators = getAllCollaborators();
      expect(collaborators.length).toBe(17);
      expect(collaborators).toContain("Gerardo Manuel García Guillén");
      expect(collaborators).toContain("Derian Rodríguez Salazar");
    });
  });

  describe("getAllProfiles", () => {
    it("debe retornar array con todos los perfiles", () => {
      const profiles = getAllProfiles();
      expect(profiles.length).toBe(6);
      expect(profiles.some((p: any) => p.code === "GP")).toBe(true);
      expect(profiles.some((p: any) => p.code === "DE")).toBe(true);
    });

    it("debe incluir nombre y ratio en cada perfil", () => {
      const profiles = getAllProfiles();
      profiles.forEach((profile: any) => {
        expect(profile).toHaveProperty("code");
        expect(profile).toHaveProperty("name");
        expect(profile).toHaveProperty("ratio");
        expect(typeof profile.name).toBe("string");
        expect(typeof profile.ratio).toBe("number");
      });
    });
  });

  describe("Data integrity", () => {
    it("todos los colaboradores deben mapear a perfiles válidos", () => {
      Object.entries(COLLABORATORS).forEach(([_name, profileCode]) => {
        expect(HBS_PROFILES).toHaveProperty(profileCode);
      });
    });

    it("todos los perfiles deben tener ratio positivo", () => {
      Object.values(HBS_PROFILES).forEach(({ ratio }: any) => {
        expect(ratio).toBeGreaterThan(0);
      });
    });
  });
});
