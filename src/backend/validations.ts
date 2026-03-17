import { z } from "zod";

// ==================== 模擬テスト ====================

export const mockTestSubmissionSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.number().int().positive(),
        userAnswer: z.string(),
      }),
    )
    .min(1, "answers must not be empty"),
  examId: z.number().int().positive(),
  timeSpent: z.number().int().nonnegative().optional(),
});

export const mockTestQuestionsSchema = z.object({
  examId: z.number().int().positive(),
  count: z.number().int().positive().max(200).optional(),
  sectionIds: z.array(z.number().int().positive()).optional(),
});

// ==================== お気に入り ====================

export const toggleFavoriteSchema = z.object({
  level: z.number().int().min(1).max(3).optional().default(1),
});

export const bulkFavoriteSchema = z.object({
  questionIds: z.array(z.number().int().positive()).min(1),
  levels: z
    .array(z.number().int().min(1).max(3))
    .min(1, "levels must not be empty"),
});

export const favoriteSettingsSchema = z.object({
  favorite1Enabled: z.boolean().optional(),
  favorite2Enabled: z.boolean().optional(),
  favorite3Enabled: z.boolean().optional(),
  filterMode: z.enum(["or", "and"]).optional(),
});

// ==================== AI採点 ====================

export const aiScoreSchema = z.object({
  questionText: z.string().min(1),
  correctAnswer: z.string().min(1),
  userAnswer: z.string().min(1),
  explanation: z.string().optional(),
});

// ==================== API Key ====================

export const apiKeySchema = z.object({
  apiKey: z.string().min(1),
});

// ==================== 学習記録 ====================

export const recordAnswerSchema = z.object({
  questionId: z.number().int().positive(),
  isCorrect: z.boolean(),
  userAnswer: z.string().optional(),
  sectionId: z.number().int().positive().optional(),
});
