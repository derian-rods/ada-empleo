import { defineStore } from "pinia";
import { ref } from "vue";

export const useNavigationStore = defineStore("navigation", () => {
  const isNavigating = ref(false);

  function setIsNavigating(value: boolean) {
    isNavigating.value = value;
  }

  return {
    isNavigating,
    setIsNavigating,
  };
});
