"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Key, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ApiKeySettingsScreen() {
  const router = useRouter();
  const [apiKey, setApiKey] = useState("");
  const [savedMaskedKey, setSavedMaskedKey] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [testStatus, setTestStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [testMessage, setTestMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Clerk privateMetadata からAPIキーの状態を取得
  useEffect(() => {
    const fetchApiKeyStatus = async () => {
      try {
        const response = await fetch("/api/settings/api-key");
        if (response.ok) {
          const data = await response.json();
          setHasApiKey(data.hasApiKey);
          setSavedMaskedKey(data.maskedKey);
        }
      } catch (error) {
        console.error("Failed to fetch API key status:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchApiKeyStatus();
  }, []);

  // APIキーをClerk privateMetadataに保存
  const handleSave = async () => {
    const trimmedKey = apiKey.trim();
    setIsSaving(true);

    try {
      const response = await fetch("/api/settings/api-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: trimmedKey || null }),
      });

      if (response.ok) {
        const data = await response.json();
        setHasApiKey(data.hasApiKey);
        setSavedMaskedKey(data.maskedKey || null);
        setApiKey(""); // 入力フィールドをクリア（セキュリティ）
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setTestStatus("error");
        setTestMessage(errorData.error || "保存に失敗しました");
      }
    } catch (error) {
      setTestStatus("error");
      setTestMessage("接続エラー: サーバーに接続できませんでした");
    } finally {
      setIsSaving(false);
    }
  };

  // APIキーの有効性テスト（サーバー経由でGemini APIを呼び出し）
  const handleTest = async () => {
    // まだ保存していない場合は先に保存を促す
    if (apiKey.trim() && !hasApiKey) {
      setTestStatus("error");
      setTestMessage("先に「保存」ボタンでAPIキーを保存してください");
      return;
    }

    if (!hasApiKey && !apiKey.trim()) {
      setTestStatus("error");
      setTestMessage("APIキーを入力して保存してください");
      return;
    }

    setTestStatus("loading");
    setTestMessage("APIキーを検証中...");

    try {
      const response = await fetch("/api/ai/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionText: "1+1は何ですか？",
          userAnswer: "2",
          correctAnswer: "2",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTestStatus("success");
        setTestMessage(`✓ APIキーは有効です！テスト採点結果: スコア ${data.score}/100`);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setTestStatus("error");
        setTestMessage(
          errorData.error || `APIエラー (${response.status}): キーが無効な可能性があります`
        );
      }
    } catch (error) {
      setTestStatus("error");
      setTestMessage("接続エラー: サーバーに接続できませんでした");
    }
  };

  // APIキーを削除
  const handleDelete = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/settings/api-key", {
        method: "DELETE",
      });

      if (response.ok) {
        setHasApiKey(false);
        setSavedMaskedKey(null);
        setApiKey("");
        setTestStatus("idle");
        setTestMessage("");
      }
    } catch (error) {
      setTestStatus("error");
      setTestMessage("削除に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 font-sans text-slate-800">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* ヘッダー */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
            aria-label="戻る"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-md">
              <Key className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">AI採点 設定</h1>
          </div>
        </div>

        {/* 説明カード */}
        <div className="rounded-2xl border border-blue-200/60 bg-blue-50/50 p-5 mb-8">
          <h2 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Gemini APIキーについて
          </h2>
          <p className="text-sm text-blue-800 leading-relaxed">
            AI採点機能を利用するには、Google Gemini APIキーが必要です。
            キーは安全にサーバー側（Clerk）に保存され、ブラウザには保持されません。
          </p>
          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-3 text-sm font-semibold text-blue-600 hover:text-blue-800 underline underline-offset-2 transition-colors"
          >
            Google AI Studio でAPIキーを取得 →
          </a>
        </div>

        {/* APIキー入力フォーム */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 mb-6">
          <label className="block text-sm font-semibold text-slate-700 mb-3">
            Gemini APIキー
          </label>

          <div className="relative">
            <input
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setTestStatus("idle");
              }}
              placeholder={hasApiKey ? "新しいキーで更新する場合に入力" : "AIza..."}
              className="w-full px-4 py-3 pr-12 border-2 border-slate-200 rounded-xl text-base font-mono focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label={showKey ? "キーを隠す" : "キーを表示"}
            >
              {showKey ? (
                <EyeOff className="w-4 h-4 text-slate-500" />
              ) : (
                <Eye className="w-4 h-4 text-slate-500" />
              )}
            </button>
          </div>

          {/* 保存状態表示 */}
          {hasApiKey && savedMaskedKey && (
            <div className="mt-3 text-xs text-slate-500 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
              保存済み（Clerkに安全に保管）: {savedMaskedKey}
            </div>
          )}

          {/* ボタン群 */}
          <div className="flex gap-3 mt-5">
            <Button
              onClick={handleSave}
              disabled={!apiKey.trim() || isSaving}
              className={cn(
                "flex-1 rounded-xl py-3 font-bold text-base transition-all",
                isSaved
                  ? "bg-green-500 hover:bg-green-600"
                  : "bg-indigo-600 hover:bg-indigo-700"
              )}
            >
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  保存中...
                </span>
              ) : isSaved ? (
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  保存しました
                </span>
              ) : (
                "保存"
              )}
            </Button>

            <Button
              onClick={handleTest}
              disabled={(!hasApiKey && !apiKey.trim()) || testStatus === "loading"}
              variant="outline"
              className="flex-1 rounded-xl py-3 font-bold text-base border-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50 transition-all"
            >
              {testStatus === "loading" ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  テスト中...
                </span>
              ) : (
                "テスト送信"
              )}
            </Button>

            {hasApiKey && (
              <Button
                onClick={handleDelete}
                disabled={isSaving}
                variant="outline"
                className="rounded-xl py-3 font-bold text-base border-2 border-red-200 text-red-600 hover:bg-red-50 transition-all px-6"
              >
                削除
              </Button>
            )}
          </div>
        </div>

        {/* テスト結果 */}
        {testMessage && (
          <div
            className={cn(
              "rounded-2xl border p-5 mb-6 transition-all animate-in fade-in slide-in-from-bottom-2 duration-300",
              testStatus === "success"
                ? "border-green-200 bg-green-50/80 text-green-800"
                : testStatus === "error"
                  ? "border-red-200 bg-red-50/80 text-red-800"
                  : "border-blue-200 bg-blue-50/80 text-blue-800"
            )}
          >
            <div className="flex items-start gap-3">
              {testStatus === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
              ) : testStatus === "error" ? (
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
              ) : (
                <Loader2 className="w-5 h-5 text-blue-600 mt-0.5 shrink-0 animate-spin" />
              )}
              <p className="text-sm font-medium leading-relaxed">{testMessage}</p>
            </div>
          </div>
        )}

        {/* セキュリティ情報 */}
        <div className="rounded-2xl border border-green-200/60 bg-green-50/30 p-5 mb-6">
          <h3 className="font-bold text-green-900 mb-2 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            セキュリティ
          </h3>
          <ul className="text-sm text-green-800 space-y-1.5">
            <li>• APIキーはClerkのサーバーに暗号化して保存されます</li>
            <li>• ブラウザ（localStorage等）には一切保持されません</li>
            <li>• サーバーサイドからのみアクセス可能です</li>
            <li>• AI採点時、キーはサーバー内で使用されクライアントには送信されません</li>
          </ul>
        </div>

        {/* 使い方ガイド */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
          <h3 className="font-bold text-slate-800 mb-4">使い方</h3>
          <ol className="space-y-3 text-sm text-slate-600">
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
                1
              </span>
              <span>
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 font-semibold hover:underline"
                >
                  Google AI Studio
                </a>
                でAPIキーを作成（無料枠あり）
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
                2
              </span>
              <span>上のフォームにAPIキーを入力して「保存」をクリック</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
                3
              </span>
              <span>「テスト送信」で接続確認（任意）</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
                4
              </span>
              <span>記述式問題で回答後、「AI採点」ボタンが表示されます</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
