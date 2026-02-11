/**
 * アプリケーション全体の文言定義
 * 画面表示テキストはここで一元管理
 */

export const APP_TEXTS = {
  // アプリ共通
  app: {
    name: "CloudWorkbook",
    tagline: "効率的な学習で資格試験合格を目指す",
  },

  // トップページ
  top: {
    title: "CloudWorkBook",
    description: {
      line1: "本ページは学習サイトです。",
      line2: "様々なIT分野の過去問を掲載しています。",
    },
    sectionListTitle: "掲載している過去問一覧",
    sections: [
      { title: "応用情報試験：午前", description: "・応用情報は〜の資格" },
      { title: "応用情報試験：午後", description: "・応用情報は〜の資格" },
      { title: "Fp3級：午前", description: "・応用情報は〜の資格" },
      { title: "Fp3級：午後", description: "・応用情報は〜の資格" },
    ],
  },

  // セクション選択ページ
  section: {
    title: "応用情報技術者試験：午前問題",
    description: "説明。。。。",
    qualificationTitle: "本試験の受験資格/推奨",
    qualificationDescription: "説明。。。。",
    courseSectionTitle: "コースセクション",
    sectionCountSuffix: "セクション",
    note: "※ セクションは10件刻みで表示され、総登録データ数に合わせて最大セクション範囲が決まります。",
    noSections: "まだセクションが登録されていません。",
  },

  // クイズ画面
  quizes: {
    backToSections: "セクション一覧に戻る",
    questionLabel: (current: number, total: number) => `問題 ${current} / ${total}`,
    progress: (percentage: number) => `${Math.round(percentage)}%`,
    submitAnswer: "解答する",
    nextQuestion: "次の問題",
    previousQuestion: "前の問題",
    finishQuiz: "結果を保存",
    correctAnswer: "正解です！",
    incorrectAnswer: "不正解",
    currentScore: "現在の成績",
    correctCount: "正解",
    incorrectCount: "不正解",
    accuracyRate: "正答率",
  },

  // 進捗リスト画面
  list: {
    title: "学習進捗一覧",
    description: "各セクションの進捗状況を確認できます",
    totalSections: "総セクション数",
    studiedSections: "学習済み",
    completedSections: "完了済み",
    progressStatus: "進捗状況",
    correctAnswers: (correct: number, total: number) => `${correct} / ${total} 問正解`,
    accuracyRate: (rate: number) => `正答率: ${rate}%`,
    notStarted: "まだ学習を開始していません",
    continueStudy: "続きから学習",
    startStudy: "学習を開始",
    noSections: "セクションがありません",
    noSectionsDescription: "管理者に問い合わせて、セクションを追加してもらってください。",
    backToDashboard: "ダッシュボードへ戻る",
  },

  // ダッシュボード
  dashboard: {
    title: "ダッシュボード",
    description: "学習の進捗を確認して、次のステップに進みましょう",
    stats: {
      totalSections: "総セクション数",
      studiedSections: "学習済み",
      completedSections: "完了済み",
      mockTestAverage: "模擬テスト平均",
      availableSections: "利用可能なセクション",
      completedPercentage: (percentage: number) => `${percentage}% 完了`,
      perfectSections: "全問正解したセクション",
      testsTaken: (count: number) => `${count}回受験`,
    },
    features: {
      sectionLearning: {
        title: "セクション学習",
        description: "7問1セットの問題で効率的に学習しましょう。各セクションをマスターして、着実に実力をつけていきます。",
        action: "セクション一覧へ",
      },
      mockTest: {
        title: "模擬テスト",
        description: "ランダム50問で本番さながらの演習。実力を試して、弱点を見つけましょう。",
        action: "模擬テストを開始",
      },
      learningHistory: {
        title: "学習履歴",
        description: "あなたの学習進捗を確認できます",
        action: "すべての履歴を見る",
        recentTests: "最近の模擬テスト",
        correctCount: (score: number, total: number) => `${score} / ${total} 問正解`,
        noTests: "まだ模擬テストを受験していません。最初のテストに挑戦してみましょう！",
      },
    },
  },

  // 認証関連
  auth: {
    login: "ログイン",
    signUp: "新規登録",
    signOut: "ログアウト",
    dashboard: "ダッシュボード",
  },

  // 共通アクション
  actions: {
    back: "戻る",
    next: "次へ",
    previous: "前へ",
    save: "保存",
    cancel: "キャンセル",
    confirm: "確認",
    close: "閉じる",
  },

  // エラーメッセージ
  errors: {
    unauthorized: "認証が必要です",
    notFound: "ページが見つかりません",
    serverError: "サーバーエラーが発生しました",
    saveFailed: "保存に失敗しました。もう一度お試しください。",
  },
} as const;

// 型定義のエクスポート
export type AppTexts = typeof APP_TEXTS;
