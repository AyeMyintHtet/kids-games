import type { MathOperation } from '@/features/progression/model/progression';

export type MathQuestion = {
  question: string;
  answer: number;
  choices: number[];
};

export type GenerateMathQuestionOptions = {
  minOperand?: number;
  maxOperand?: number;
  operations?: MathOperation[];
  choicesCount?: number;
};

const shuffle = <T,>(items: T[]): T[] => {
  const cloned = [...items];
  for (let i = cloned.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
  }
  return cloned;
};

const randomInRange = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const pickOperation = (operations: MathOperation[]): MathOperation =>
  operations[Math.floor(Math.random() * operations.length)] ?? 'add';

export const generateMathQuestion = (
  params: GenerateMathQuestionOptions = {}
): MathQuestion => {
  const minOperand = Math.max(1, Math.round(params.minOperand ?? 1));
  const maxOperand = Math.max(minOperand, Math.round(params.maxOperand ?? 10));
  const operations: MathOperation[] = params.operations?.length
    ? params.operations
    : ['add'];
  const choicesCount = Math.max(4, Math.round(params.choicesCount ?? 6));

  const operation = pickOperation(operations);

  let num1 = randomInRange(minOperand, maxOperand);
  let num2 = randomInRange(minOperand, maxOperand);
  let answer = 0;
  let question = '';

  if (operation === 'subtract') {
    if (num2 > num1) {
      [num1, num2] = [num2, num1];
    }
    answer = num1 - num2;
    question = `${num1} - ${num2} =`;
  } else if (operation === 'multiply') {
    // Keep multiplication kid-friendly by limiting factors.
    const factorMax = Math.max(2, Math.min(maxOperand, 12));
    num1 = randomInRange(Math.min(minOperand, factorMax), factorMax);
    num2 = randomInRange(1, Math.min(12, factorMax));
    answer = num1 * num2;
    question = `${num1} × ${num2} =`;
  } else if (operation === 'modulo') {
    // Modulo for kids: keep divisor small and non-zero.
    const divisorMax = Math.max(2, Math.min(maxOperand, 12));
    num2 = randomInRange(2, divisorMax);
    num1 = randomInRange(Math.max(num2, minOperand), Math.max(num2 + 1, maxOperand));
    answer = num1 % num2;
    question = `${num1} % ${num2} =`;
  } else {
    answer = num1 + num2;
    question = `${num1} + ${num2} =`;
  }

  const choiceSet = new Set<number>([answer]);
  let spread = Math.max(4, Math.ceil(Math.abs(answer) * 0.35));
  let attempts = 0;
  while (choiceSet.size < choicesCount && attempts < 300) {
    attempts += 1;
    if (attempts % 60 === 0) {
      spread += 2;
    }
    const distractor = Math.max(0, answer + randomInRange(-spread, spread));
    if (distractor !== answer) {
      choiceSet.add(distractor);
    }
  }
  let fallback = Math.max(1, answer + spread);
  while (choiceSet.size < choicesCount) {
    if (fallback !== answer) {
      choiceSet.add(fallback);
    }
    fallback += 1;
  }

  return {
    question,
    answer,
    choices: shuffle(Array.from(choiceSet)),
  };
};
