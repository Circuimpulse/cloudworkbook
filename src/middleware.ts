import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// 認証が必要なルート
const isProtectedRoute = createRouteMatcher([
  "/sections(.*)",
  "/mock-test(.*)",
  "/api(.*)",
]);

// 公開ルート（認証不要）
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)", // Clerk webhooks
]);

export default clerkMiddleware(async (auth, req) => {
  // 公開ルートはスキップ
  if (isPublicRoute(req)) {
    return;
  }

  // 保護されたルートは認証を要求
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Next.jsの内部ファイルを除外
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // APIルートを含める
    "/(api|trpc)(.*)",
  ],
};
