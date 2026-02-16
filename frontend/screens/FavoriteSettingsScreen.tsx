"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer } from "@/frontend/components/common/page-container";
import { SectionHeader } from "@/frontend/components/common/section-header";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface FavoriteSettings {
  favorite1Enabled: boolean;
  favorite2Enabled: boolean;
  favorite3Enabled: boolean;
  filterMode: "or" | "and";
}

export default function FavoriteSettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState<FavoriteSettings>({
    favorite1Enabled: true,
    favorite2Enabled: true,
    favorite3Enabled: true,
    filterMode: "or",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 設定を読み込む
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch("/api/settings/favorite");
        if (response.ok) {
          const data = await response.json();
          setSettings(data);
        }
      } catch (error) {
        console.error("Failed to load favorite settings:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  // 設定を保存する
  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/settings/favorite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        // 保存成功後、前のページに戻る
        router.back();
      } else {
        alert("設定の保存に失敗しました");
      }
    } catch (error) {
      console.error("Failed to save favorite settings:", error);
      alert("設定の保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">読み込み中...</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <SectionHeader
        title="お気に入り設定"
        subtitle="お気に入り問題の表示条件を設定できます"
      />

      <Card className="mt-6">
        <CardHeader>
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="w-20"
          >
            戻る
          </Button>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* お気に入りレベルのトグル */}
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b">
              <Label htmlFor="favorite1" className="text-base">
                お気に入り①
              </Label>
              <Switch
                id="favorite1"
                checked={settings.favorite1Enabled}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, favorite1Enabled: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between py-3 border-b">
              <Label htmlFor="favorite2" className="text-base">
                お気に入り②
              </Label>
              <Switch
                id="favorite2"
                checked={settings.favorite2Enabled}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, favorite2Enabled: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between py-3 border-b">
              <Label htmlFor="favorite3" className="text-base">
                お気に入り③
              </Label>
              <Switch
                id="favorite3"
                checked={settings.favorite3Enabled}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, favorite3Enabled: checked })
                }
              />
            </div>
          </div>

          {/* 注意書き */}
          <div className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
            ※この設定画面で「お気に入り①」を有効にすると、3つのお気に入りのうち、どれか1つ該当すれば表示されます。複数のお気に入りを同時に有効にすると、それらの問題が全て表示されます。「学習モード」の「お気に入り」対象となります。
          </div>

          {/* 検索条件 */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base">検索条件</h3>
            <RadioGroup
              value={settings.filterMode}
              onValueChange={(value: "or" | "and") =>
                setSettings({ ...settings, filterMode: value })
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="or" id="or" />
                <Label htmlFor="or" className="font-normal cursor-pointer">
                  or
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="and" id="and" />
                <Label htmlFor="and" className="font-normal cursor-pointer">
                  and
                </Label>
              </div>
            </RadioGroup>

            <div className="text-sm text-red-600 bg-red-50 p-4 rounded-lg border border-red-200">
              ※「or」（いずれか1つのお気に入りが有効であれば表示される）を選択すると、例えば、お気に入り①とお気に入り②を同時に押した場合に、お気に入り①に登録されている問題が表示されます。また、お気に入り②のみに登録されている問題も表示されます。「学習モード」の「お気に入り」対象となる全ての問題が表示されます。
            </div>
          </div>

          {/* 保存ボタン */}
          <div className="pt-4">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              size="lg"
            >
              {saving ? "保存中..." : "保存する"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}

