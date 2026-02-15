import { getStore } from "./storage";
import { createDeck } from "./storage";
import { STORAGE_KEY } from "./constants";

const SAMPLE_LOADED_KEY = "kairos_sample_loaded";

export function loadSampleData() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(SAMPLE_LOADED_KEY)) return;

  const store = getStore();
  if (store.decks.length > 0) {
    localStorage.setItem(SAMPLE_LOADED_KEY, "true");
    return;
  }

  createDeck("Common Spanish Phrases", "Essential Spanish phrases for beginners", [
    { term: "Hola", definition: "Hello" },
    { term: "Gracias", definition: "Thank you" },
    { term: "Por favor", definition: "Please" },
    { term: "Lo siento", definition: "I'm sorry" },
    { term: "Buenos días", definition: "Good morning" },
    { term: "Buenas noches", definition: "Good night" },
    { term: "¿Cómo estás?", definition: "How are you?" },
    { term: "Adiós", definition: "Goodbye" },
  ]);

  localStorage.setItem(SAMPLE_LOADED_KEY, "true");
}
