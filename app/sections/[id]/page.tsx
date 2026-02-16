import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {
  getSectionWithExam,
  getSectionProgress,
  getSectionQuestionsProgress,
  getQuestionsBySection,
  getAdjacentSections,
  getFavoriteQuestionIds,
  getIncorrectQuestionIds,
} from "@/backend/db/queries";
import StudySessionScreen from "@/frontend/screens/StudySessionScreen";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ retry?: string; question?: string; mode?: string }>;
}

// キャッシュを無効化して、常に最新のデータを取得
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page({ params, searchParams }: PageProps) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const { id } = await params;
  const sectionId = parseInt(id, 10);

  if (isNaN(sectionId)) {
    redirect("/");
  }

  // searchParamsを取得
  const search = await searchParams;
  const mode = search.mode; // "incorrect" or "favorite"
  // sectionIdとretryパラメータを組み合わせてキーを生成
  const retryKey = `${sectionId}-${search.retry || "default"}-${mode || "normal"}`;

  // セクション情報を取得（試験情報含む）
  const sectionData = await getSectionWithExam(sectionId);

  if (!sectionData || !sectionData.section) {
    redirect("/");
  }

  const { section, exam } = sectionData;

  // セクションの問題を取得
  const allQuestions = await getQuestionsBySection(sectionId);

  let questions = allQuestions;

  // モードに応じて問題をフィルタリング
  if (mode === "favorite") {
    // お気に入り問題のみにフィルタリング
    // getFavoriteQuestionsBySection というのもあるが、ここでは既存の allQuestions からフィルタする方式をとる
    // (問題の順序などを保持するため、あるいは再利用のため)
    // ただし、getFavoriteQuestionIds でIDリストを取得してフィルタするのが確実。
    const favIds = await getFavoriteQuestionIds(userId);
    const favIdSet = new Set(favIds);
    questions = allQuestions.filter((q) => favIdSet.has(q.id));

    // お気に入りが0件なら、通常モードに戻すか、空で表示するか？
    // 空だと困るので、何もしない（全件表示）かリダイレクト？
    // ここではそのまま空リストになる可能性があるが、StudySessionScreenがどう振る舞うか。
    // お気に入りがないのに「お気に入りモード」で来た場合、空になる。
  } else if (mode === "incorrect") {
    // 間違えた問題のみにフィルタリング
    // getIncorrectQuestionIds を使う
    const incorrectIds = await getIncorrectQuestionIds(userId, sectionId);
    const incorrectIdSet = new Set(incorrectIds);
    // 間違えた問題のみ
    questions = allQuestions.filter((q) => incorrectIdSet.has(q.id));
  }

  // 進捗状況を取得
  let progress = await getSectionProgress(userId, sectionId);

  // questionsProgressは、フィルタリングされたquestionsに対応するものだけが必要か？
  // StudySessionScreenは questionsProgress を使って初期状態（回答済みかどうか）を表示する。
  // mode=incorrect の場合、リセットされているはずなので、progressはないはず（あるいはリセット処理が必要）。
  // しかし、リセットはAPIで行われている前提か、ここで行うか。
  // IncorrectQuestionsScreenでは `/api/learning/units/${section.id}/reset?incorrectOnly=true` を叩いてから遷移してくる。
  // なので、DB上の progress (sectionQuestionProgress) は削除されているはず。
  // そのため、getSectionQuestionsProgress は空（または正解済みのもの以外）を返すはず。

  // mode=favorite の場合、進捗は残っているかもしれない。
  // 「解きなおし」ということは、進捗を無視して（あるいはリセットして）挑むのか？
  // ユーザー要望「お気に入り問題の再挑戦はソートされた対象の問題のみ解きなおしできるようにしてください」
  // 「解きなおし」= 進捗リセット状態でのスタート、と解釈できる。
  // しかし、DBの実データを消すと「学習履歴」自体が消える（正解履歴も消える）。
  // お気に入りの場合、正解履歴を消すべきか？
  // 「間違えた問題も...間違えた問題が正解に上書きされるので学習履歴から対象の問題が書き換わります」
  // -> 間違えた問題は書き換わってOK（正解になるから）。
  // お気に入り問題の場合も、解きなおして正解したら「正解」として記録されるべき？
  // もし既にお気に入り問題が「正解済み」だった場合、それを「未回答」として扱い、再度解いて「正解/不正解」を更新する。
  // これは StudySessionScreen 側で「進捗を無視して未回答として扱う」モードがあればよい。
  // あるいは、Page側で progress を渡さない（空にする）ことで未回答として扱わせる。
  // ただし、DB更新時にどうなるか。
  // StudySessionScreen は回答時に API `/api/learning/progress` (POST) を叩く。
  // APIは `upsertUserQuestionRecord` と `updateSectionProgress` を行う。
  // upsertなので上書きされる。
  // つまり、フロントエンドで「未回答」として見せかければ、ユーザーは回答でき、結果はDBに上書き保存される。これで要件を満たす。

  // したがって、mode が指定されている場合は questionsProgress を空にして渡す（あるいはフィルタリングされた問題の分だけ空にする）。
  // progress (セクション全体進捗) も、表示上の整合性をとるために調整が必要かもしれないが、
  // StudySessionScreen は progress を使って「達成率」などを出す。
  // 解きなおしモードの場合、達成率の分母が変わる（全問中ではなく、対象問題中）。
  // StudySessionScreen のロジックによる。

  const questionsProgress = await getSectionQuestionsProgress(
    userId,
    sectionId,
  );

  // コンソールログ
  console.log(
    `[Page] sectionId: ${sectionId}, retryKey: ${retryKey}, mode: ${mode}`,
  );
  console.log(`[Page] questions count: ${questions.length}`);

  // 進捗がない場合は初期値を作成（DBには保存しない）
  if (!progress) {
    progress = {
      userId,
      sectionId,
      correctCount: 0,
      totalCount: 0,
      lastStudiedAt: new Date(),
      updatedAt: new Date(),
    };
  }

  // モードに応じて進捗をフィルタリング
  let filteredQuestionsProgress = questionsProgress;
  if (mode === "favorite") {
    // お気に入りモードの場合
    // フィルター対象の問題IDセット
    const targetQuestionIds = new Set(questions.map((q) => q.id));
    
    // お気に入り問題の進捗のみをリセット（空にする）
    // それ以外の問題の進捗は保持する
    filteredQuestionsProgress = questionsProgress.filter(
      (qp) => !targetQuestionIds.has(qp.questionId)
    );
  } else if (mode === "incorrect") {
    // 間違えた問題モードの場合
    // 間違えた問題の進捗のみをリセット（空にする）
    // 正解した問題の進捗は保持する（表示される）
    const targetQuestionIds = new Set(questions.map((q) => q.id));
    
    // 正解した問題の進捗は保持、間違えた問題の進捗は除外
    filteredQuestionsProgress = questionsProgress.filter(
      (qp) => {
        // フィルター対象外の問題（このセクションの他の問題）は全て保持
        if (!targetQuestionIds.has(qp.questionId)) {
          return true;
        }
        // フィルター対象の問題の場合、正解済みのみ保持
        return qp.isCorrect === true;
      }
    );
  }

  // 隣接セクションを取得
  const { prevSection, nextSection } = await getAdjacentSections(sectionId);

  return (
    <StudySessionScreen
      key={retryKey}
      section={section}
      exam={exam || undefined}
      questions={questions}
      progress={progress} // modeがある場合、このprogress表示はあまり意味がないかもしれない（全問対象の進捗なので）
      questionsProgress={filteredQuestionsProgress} // フィルター対象の問題のみ進捗をリセット、それ以外は保持
      userId={userId}
      prevSection={prevSection}
      nextSection={nextSection}
      mode={mode as "incorrect" | "favorite" | undefined} // モードを渡す（画面表示や挙動の制御用）
    />
  );
}
