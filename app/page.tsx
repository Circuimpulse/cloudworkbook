import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Cloud } from "lucide-react";
import { getAllSections } from "@/lib/db/queries";

export default async function Home() {
  // セクション一覧を取得
  const sections = await getAllSections();

  return (
    <main className="min-h-screen bg-white">
      {/* Description Section */}
      <section className="border-b border-gray-200">
        <div className="container mx-auto px-12 py-8 max-w-7xl">
          <div className="flex items-center gap-3 mb-6">
            <Cloud className="h-10 w-10 text-black" />
            <h1 className="text-4xl font-extrabold text-black">
              CloudWorkBook
            </h1>
          </div>
          <div className="border-t border-gray-300 mb-6"></div>
          <div className="text-2xl text-black space-y-2">
            <p>本ページは学習サイトです。</p>
            <p>様々なIT分野の過去問を掲載しています。</p>
          </div>
        </div>
      </section>

      {/* Body Section - 掲載している過去問一覧 */}
      <section className="py-12">
        <div className="container mx-auto px-12 max-w-7xl">
          <h2 className="text-4xl font-extrabold text-black mb-8">
            掲載している過去問一覧
          </h2>
          <div className="border-t border-gray-300 mb-8"></div>

          {/* セクションカードグリッド */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sections.map((section) => (
              <Card
                key={section.id}
                className="border-2 border-black rounded-lg hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-8 w-8 text-black flex-shrink-0" />
                    <CardTitle className="text-3xl font-extrabold text-black">
                      {section.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-xl text-black">
                    {section.description || "・応用情報は～の資格"}
                  </CardDescription>
                  <div className="mt-6">
                    <Button asChild size="lg" className="w-full">
                      <Link href="/sign-in">学習を開始</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* セクションが空の場合のプレースホルダー */}
            {sections.length === 0 && (
              <>
                <Card className="border-2 border-black rounded-lg">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-8 w-8 text-black flex-shrink-0" />
                      <CardTitle className="text-3xl font-extrabold text-black">
                        応用情報試験：午前
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-xl text-black">
                      ・応用情報は～の資格
                    </CardDescription>
                    <div className="mt-6">
                      <Button asChild size="lg" className="w-full">
                        <Link href="/sign-in">学習を開始</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-black rounded-lg">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-8 w-8 text-black flex-shrink-0" />
                      <CardTitle className="text-3xl font-extrabold text-black">
                        応用情報試験：午後
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-xl text-black">
                      ・応用情報は～の資格
                    </CardDescription>
                    <div className="mt-6">
                      <Button asChild size="lg" className="w-full">
                        <Link href="/sign-in">学習を開始</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-black rounded-lg">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-8 w-8 text-black flex-shrink-0" />
                      <CardTitle className="text-3xl font-extrabold text-black">
                        Fp3級：午前
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-xl text-black">
                      ・応用情報は～の資格
                    </CardDescription>
                    <div className="mt-6">
                      <Button asChild size="lg" className="w-full">
                        <Link href="/sign-in">学習を開始</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-black rounded-lg">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-8 w-8 text-black flex-shrink-0" />
                      <CardTitle className="text-3xl font-extrabold text-black">
                        Fp3級：午後
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-xl text-black">
                      ・応用情報は～の資格
                    </CardDescription>
                    <div className="mt-6">
                      <Button asChild size="lg" className="w-full">
                        <Link href="/sign-in">学習を開始</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-12 max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-4">今すぐ学習を始めましょう</h2>
          <p className="text-xl text-muted-foreground mb-8">
            無料でアカウントを作成して、すべての問題にアクセスできます
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/sign-up">新規登録</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/sign-in">ログイン</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
