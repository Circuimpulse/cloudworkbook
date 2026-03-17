/**
 * Clerk privateMetadata の型定義
 */
export interface ClerkPrivateMetadata {
  geminiApiKey?: string;
}

/**
 * Clerk privateMetadata を型安全にアクセスする
 */
export function getPrivateMetadata(
  metadata: Record<string, unknown> | unknown,
): ClerkPrivateMetadata {
  if (typeof metadata === "object" && metadata !== null) {
    return metadata as ClerkPrivateMetadata;
  }
  return {};
}
