"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";

interface FavoriteStatus {
  isFavorite1: boolean;
  isFavorite2: boolean;
  isFavorite3: boolean;
  isFavorite?: boolean;
}

interface FavoriteTogglesProps {
  questionId: number;
  initialStatus: FavoriteStatus;
  onUpdate?: (status: FavoriteStatus) => void;
  className?: string;
  size?: "sm" | "md";
}

export default function FavoriteToggles({
  questionId,
  initialStatus,
  onUpdate,
  className,
  size = "md",
}: FavoriteTogglesProps) {
  const [status, setStatus] = useState<FavoriteStatus>(initialStatus);

  // Reset state when question changes
  // Note: Component is remounted via key prop in parent, but this ensures sync
  useEffect(() => {
    setStatus(initialStatus);
  }, [questionId, initialStatus.isFavorite1, initialStatus.isFavorite2, initialStatus.isFavorite3]);

  const handleToggle = async (level: number) => {
    // Optimistic Update: Calculate new state immediately
    const prevStatus = { ...status };
    const newStatus = { ...status };

    if (level === 1) newStatus.isFavorite1 = !newStatus.isFavorite1;
    if (level === 2) newStatus.isFavorite2 = !newStatus.isFavorite2;
    if (level === 3) newStatus.isFavorite3 = !newStatus.isFavorite3;

    // Update UI immediately
    setStatus(newStatus);
    if (onUpdate) {
      onUpdate(newStatus);
    }

    try {
      const response = await fetch(`/api/questions/${questionId}/favorite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ level }),
      });

      if (response.ok) {
        // Prevent setting state if questionId changed during await (shouldn't happen with key prop, but safe)
        // Actually, with key prop, component unmounts. But if not using key properly?
        // Let's rely on standard unmounting behavior.

        const data = await response.json();
        // Confirm with server data (optional, but good for consistency)
        const serverStatus = {
          isFavorite1: data.isFavorite1,
          isFavorite2: data.isFavorite2,
          isFavorite3: data.isFavorite3,
          isFavorite: data.isFavorite,
        };
        setStatus(serverStatus);
        if (onUpdate) {
          onUpdate(serverStatus);
        }
      } else {
        throw new Error("API error");
      }
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
      // Revert on error
      setStatus(prevStatus);
      if (onUpdate) {
        onUpdate(prevStatus);
      }
    }
  };

  const buttonSize = size === "sm" ? "w-6 h-6 text-xs" : "w-8 h-8 text-sm";

  return (
    <div className={cn("flex flex-col gap-1 items-end", className)}>
      <span className="text-xs text-muted-foreground">お気に入り登録</span>
      <div className="flex gap-1">
        {[1, 2, 3].map((level) => {
          const isLevelFavorite =
            level === 1
              ? status.isFavorite1
              : level === 2
                ? status.isFavorite2
                : status.isFavorite3;

          // Define colors for each level: 1=yellow, 2=red, 3=blue
          const activeColors =
            level === 1
              ? "bg-yellow-100 border-yellow-400 text-yellow-600"
              : level === 2
                ? "bg-red-100 border-red-400 text-red-600"
                : "bg-blue-100 border-blue-400 text-blue-600";

          return (
            <button
              key={level}
              onClick={(e) => {
                e.stopPropagation(); // Prevent card click in list view
                handleToggle(level);
              }}
              className={cn(
                "flex items-center justify-center rounded-full border transition-colors",
                buttonSize,
                isLevelFavorite
                  ? activeColors
                  : "bg-white border-gray-200 text-gray-400 hover:bg-gray-50 search-result-fav-btn", // Add class for potential debugging
              )}
              title={`お気に入り${level}`}
              aria-label={`お気に入り${level}${isLevelFavorite ? " (登録済み)" : ""}`}
            >
              <span className="font-bold">{level}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
