import { describe, it, expect } from "vitest";
import {
  mockTestSubmissionSchema,
  bulkFavoriteSchema,
  favoriteSettingsSchema,
  aiScoreSchema,
  apiKeySchema,
  recordAnswerSchema,
  toggleFavoriteSchema,
} from "../validations";

describe("mockTestSubmissionSchema", () => {
  it("accepts valid submission", () => {
    const result = mockTestSubmissionSchema.safeParse({
      answers: [{ questionId: 1, userAnswer: "A" }],
      examId: 1,
    });
    expect(result.success).toBe(true);
  });

  it("accepts optional timeSpent", () => {
    const result = mockTestSubmissionSchema.safeParse({
      answers: [{ questionId: 1, userAnswer: "A" }],
      examId: 1,
      timeSpent: 300,
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty answers", () => {
    const result = mockTestSubmissionSchema.safeParse({
      answers: [],
      examId: 1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing examId", () => {
    const result = mockTestSubmissionSchema.safeParse({
      answers: [{ questionId: 1, userAnswer: "A" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid answer structure", () => {
    const result = mockTestSubmissionSchema.safeParse({
      answers: [{ questionId: "not-a-number", userAnswer: "A" }],
      examId: 1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative questionId", () => {
    const result = mockTestSubmissionSchema.safeParse({
      answers: [{ questionId: -1, userAnswer: "A" }],
      examId: 1,
    });
    expect(result.success).toBe(false);
  });
});

describe("bulkFavoriteSchema", () => {
  it("accepts valid bulk favorite", () => {
    const result = bulkFavoriteSchema.safeParse({
      questionIds: [1, 2, 3],
      levels: [1, 2],
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty questionIds", () => {
    const result = bulkFavoriteSchema.safeParse({
      questionIds: [],
      levels: [1],
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid levels", () => {
    const result = bulkFavoriteSchema.safeParse({
      questionIds: [1],
      levels: [0, 4],
    });
    expect(result.success).toBe(false);
  });

  it("rejects level 0", () => {
    const result = bulkFavoriteSchema.safeParse({
      questionIds: [1],
      levels: [0],
    });
    expect(result.success).toBe(false);
  });

  it("rejects level 4", () => {
    const result = bulkFavoriteSchema.safeParse({
      questionIds: [1],
      levels: [4],
    });
    expect(result.success).toBe(false);
  });
});

describe("favoriteSettingsSchema", () => {
  it("accepts full settings", () => {
    const result = favoriteSettingsSchema.safeParse({
      favorite1Enabled: true,
      favorite2Enabled: false,
      favorite3Enabled: true,
      filterMode: "and",
    });
    expect(result.success).toBe(true);
  });

  it("accepts partial settings (all optional)", () => {
    const result = favoriteSettingsSchema.safeParse({
      filterMode: "or",
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty object", () => {
    const result = favoriteSettingsSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rejects invalid filterMode", () => {
    const result = favoriteSettingsSchema.safeParse({
      filterMode: "xor",
    });
    expect(result.success).toBe(false);
  });
});

describe("aiScoreSchema", () => {
  it("accepts valid scoring request", () => {
    const result = aiScoreSchema.safeParse({
      questionText: "問題文",
      correctAnswer: "正解",
      userAnswer: "回答",
    });
    expect(result.success).toBe(true);
  });

  it("accepts optional explanation", () => {
    const result = aiScoreSchema.safeParse({
      questionText: "問題文",
      correctAnswer: "正解",
      userAnswer: "回答",
      explanation: "解説",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty questionText", () => {
    const result = aiScoreSchema.safeParse({
      questionText: "",
      correctAnswer: "正解",
      userAnswer: "回答",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing userAnswer", () => {
    const result = aiScoreSchema.safeParse({
      questionText: "問題文",
      correctAnswer: "正解",
    });
    expect(result.success).toBe(false);
  });
});

describe("apiKeySchema", () => {
  it("accepts valid API key", () => {
    const result = apiKeySchema.safeParse({ apiKey: "AIzaSy..." });
    expect(result.success).toBe(true);
  });

  it("rejects empty API key", () => {
    const result = apiKeySchema.safeParse({ apiKey: "" });
    expect(result.success).toBe(false);
  });
});

describe("recordAnswerSchema", () => {
  it("accepts valid answer record", () => {
    const result = recordAnswerSchema.safeParse({
      questionId: 1,
      isCorrect: true,
    });
    expect(result.success).toBe(true);
  });

  it("accepts with optional fields", () => {
    const result = recordAnswerSchema.safeParse({
      questionId: 1,
      isCorrect: false,
      userAnswer: "B",
      sectionId: 5,
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-boolean isCorrect", () => {
    const result = recordAnswerSchema.safeParse({
      questionId: 1,
      isCorrect: "true",
    });
    expect(result.success).toBe(false);
  });
});

describe("toggleFavoriteSchema", () => {
  it("accepts valid level", () => {
    const result = toggleFavoriteSchema.safeParse({ level: 2 });
    expect(result.success).toBe(true);
  });

  it("defaults to level 1", () => {
    const result = toggleFavoriteSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.level).toBe(1);
    }
  });

  it("rejects level 0", () => {
    const result = toggleFavoriteSchema.safeParse({ level: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects level 4", () => {
    const result = toggleFavoriteSchema.safeParse({ level: 4 });
    expect(result.success).toBe(false);
  });
});
