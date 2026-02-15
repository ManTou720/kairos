import { Card, TestQuestion, TestConfig, QuestionType } from "./types";
import { generateId, shuffle } from "./utils";

function generateMultipleChoice(card: Card, allCards: Card[]): TestQuestion {
  const others = allCards.filter((c) => c.id !== card.id);
  const distractors = shuffle(others)
    .slice(0, 3)
    .map((c) => c.definition);
  const options = shuffle([card.definition, ...distractors]);

  return {
    id: generateId(),
    type: "multiple-choice",
    cardId: card.id,
    prompt: card.term,
    correctAnswer: card.definition,
    options,
  };
}

function generateTrueFalse(card: Card, allCards: Card[]): TestQuestion {
  const showCorrect = Math.random() > 0.5;
  let shownDefinition: string;

  if (showCorrect) {
    shownDefinition = card.definition;
  } else {
    const others = allCards.filter((c) => c.id !== card.id);
    shownDefinition = shuffle(others)[0].definition;
  }

  return {
    id: generateId(),
    type: "true-false",
    cardId: card.id,
    prompt: `"${card.term}" = "${shownDefinition}"`,
    correctAnswer: showCorrect ? "True" : "False",
    options: ["True", "False"],
  };
}

function generateWritten(card: Card): TestQuestion {
  return {
    id: generateId(),
    type: "written",
    cardId: card.id,
    prompt: card.term,
    correctAnswer: card.definition,
  };
}

export function generateTest(
  cards: Card[],
  config: TestConfig
): TestQuestion[] {
  const { questionTypes, questionCount } = config;
  const selectedCards = shuffle(cards).slice(0, questionCount);
  const questions: TestQuestion[] = [];

  for (let i = 0; i < selectedCards.length; i++) {
    const card = selectedCards[i];
    const type = questionTypes[i % questionTypes.length];

    switch (type) {
      case "multiple-choice":
        questions.push(generateMultipleChoice(card, cards));
        break;
      case "true-false":
        questions.push(generateTrueFalse(card, cards));
        break;
      case "written":
        questions.push(generateWritten(card));
        break;
    }
  }

  return shuffle(questions);
}

export function gradeWritten(userAnswer: string, correctAnswer: string): boolean {
  return userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
}
