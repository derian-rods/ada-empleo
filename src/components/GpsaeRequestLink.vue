<script setup lang="ts">
import { buildGpsaeRequestUrl, isValidRequestCode } from "../domain/gpsae";

interface GpsaeRequestLinkProps {
  code?: string;
  text?: string;
}

withDefaults(defineProps<GpsaeRequestLinkProps>(), {
  text: undefined, // If undefined, uses code as text
});

function getDisplayText(
  code: string | undefined,
  text: string | undefined,
): string {
  return text || code || "—";
}

function getUrl(code: string | undefined): string {
  return buildGpsaeRequestUrl(code);
}

function isValid(code: string | undefined): boolean {
  return isValidRequestCode(code);
}
</script>

<template>
  <span v-if="!isValid(code)" class="request-code-plain">
    {{ getDisplayText(code, text) }}
  </span>
  <a
    v-else
    :href="getUrl(code)"
    target="_blank"
    rel="noopener noreferrer"
    class="request-code-link"
    :title="`Abrir petición ${code} en GPSAE`"
  >
    {{ getDisplayText(code, text) }}
  </a>
</template>

<style scoped>
.request-code-plain {
  color: var(--text-secondary);
  font-family: "Courier New", monospace;
  font-size: 0.9rem;
}

.request-code-link {
  color: var(--color-primary);
  text-decoration: none;
  font-family: "Courier New", monospace;
  font-size: 0.9rem;
  font-weight: 500;
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
  transition: all 0.2s ease;
}

.request-code-link:hover {
  background-color: var(--color-primary);
  color: white;
  text-decoration: underline;
}

.request-code-link:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
</style>
