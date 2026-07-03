import { classifyCustomerInquiry } from "../../src/logic/it-1-2-1";

describe("顧客質問内容分類・優先度判定機能", () => {
  test("SCEN-1017: 複数キーワードを含む質問内容が最も優先度の高い分類に正確に割り当てられる", () => {
    // テストデータ: 複数の優先度レベルに対応する分類カテゴリを定義
    const classificationCategories = [
      {
        id: "cat_001",
        name: "緊急・システム障害",
        keywords: ["緊急", "システム障害", "本番環境"],
        priorityLevel: 1,
        priorityScore: 100,
      },
      {
        id: "cat_002",
        name: "請求内容確認",
        keywords: ["請求", "金額", "請求額"],
        priorityLevel: 2,
        priorityScore: 50,
      },
      {
        id: "cat_003",
        name: "一般問い合わせ",
        keywords: ["確認", "質問", "情報"],
        priorityLevel: 3,
        priorityScore: 10,
      },
    ];

    // 複数キーワードを含む顧客質問テキスト: 『緊急』『システム障害』『本番環境』
    const customerInquiryText =
      "本番環境でシステム障害が発生しました。緊急対応をお願いします。請求に関する確認もあります。";

    // 質問内容分類エンジンにテキストを送信し、キーワード抽出と優先度判定処理を実行
    const classificationResult = classifyCustomerInquiry(
      customerInquiryText,
      classificationCategories
    );

    // 抽出されたキーワードを検証
    expect(classificationResult.extractedKeywords).toContain("緊急");
    expect(classificationResult.extractedKeywords).toContain(
      "システム障害"
    );
    expect(classificationResult.extractedKeywords).toContain("本番環境");
    expect(classificationResult.extractedKeywords).toContain("請求");

    // 各分類の優先度レベルを確認: 複数の優先度が検出された場合
    expect(classificationResult.detectedPriorities).toEqual([
      { categoryId: "cat_001", priorityLevel: 1, priorityScore: 100 },
      { categoryId: "cat_002", priorityLevel: 2, priorityScore: 50 },
    ]);

    // 最も優先度の高い分類が選定されているか検証
    expect(classificationResult.selectedCategory.id).toBe("cat_001");
    expect(classificationResult.selectedCategory.name).toBe(
      "緊急・システム障害"
    );
    expect(classificationResult.selectedCategory.priorityLevel).toBe(1);

    // 判定根拠となるキーワードが正しく記録されているか確認
    expect(classificationResult.matchedKeywords).toEqual([
      "緊急",
      "システム障害",
      "本番環境",
    ]);

    // 判定スコア値が正しく適用されているか確認
    expect(classificationResult.finalPriorityScore).toBe(100);

    // 判定ロジックが正しく適用されているか確認: 最高優先度スコアが記録される
    expect(classificationResult.reasonForSelection).toBe(
      "最高優先度(1)のキーワード[緊急, システム障害, 本番環境]が検出されました"
    );

    // 同一優先度の分類が複数存在する場合のテスト
    const sameScoreCategories = [
      {
        id: "cat_high_1",
        name: "システム問題A",
        keywords: ["障害", "エラー"],
        priorityLevel: 1,
        priorityScore: 100,
      },
      {
        id: "cat_high_2",
        name: "システム問題B",
        keywords: ["障害", "ダウン"],
        priorityLevel: 1,
        priorityScore: 100,
      },
      {
        id: "cat_low",
        name: "一般問い合わせ",
        keywords: ["質問"],
        priorityLevel: 3,
        priorityScore: 10,
      },
    ];

    const inquiryWithHighPriority = "システム障害が発生しました。";

    const sameScoreResult = classifyCustomerInquiry(
      inquiryWithHighPriority,
      sameScoreCategories
    );

    // 同一優先度が複数存在する場合、最初にマッチした最高優先度カテゴリが選定される
    expect(sameScoreResult.selectedCategory.priorityLevel).toBe(1);
    expect(sameScoreResult.selectedCategory.priorityScore).toBe(100);
    expect(sameScoreResult.finalPriorityScore).toBe(100);

    // 複数のキーワードを含む分類が複数存在する複雑なテスト
    const complexCategories = [
      {
        id: "cat_urgent",
        name: "緊急対応",
        keywords: ["緊急", "即座に", "今すぐ"],
        priorityLevel: 1,
        priorityScore: 150,
      },
      {
        id: "cat_billing",
        name: "請求関連",
        keywords: ["請求", "金額", "料金"],
        priorityLevel: 2,
        priorityScore: 75,
      },
      {
        id: "cat_scheduling",
        name: "スケジューリング",
        keywords: ["日程", "予定", "納期"],
        priorityLevel: 2,
        priorityScore: 75,
      },
    ];

    const complexInquiry =
      "請求額の計算が間違っている可能性があります。緊急に確認をお願いしたいのですが、いつ対応可能でしょうか？";

    const complexResult = classifyCustomerInquiry(
      complexInquiry,
      complexCategories
    );

    // 複数の優先度が検出された場合、最も優先度の高い分類が確実に選定される
    expect(complexResult.selectedCategory.id).toBe("cat_urgent");
    expect(complexResult.selectedCategory.priorityLevel).toBe(1);
    expect(complexResult.selectedCategory.priorityScore).toBe(150);
    expect(complexResult.finalPriorityScore).toBe(150);

    // 複数の優先度が検出された詳細情報を確認
    expect(complexResult.detectedPriorities.length).toBeGreaterThanOrEqual(2);
    expect(complexResult.detectedPriorities[0].priorityLevel).toBeLessThan(
      complexResult.detectedPriorities[1].priorityLevel
    );

    // エラーケース: 空の質問テキスト
    expect(() => {
      classifyCustomerInquiry("", classificationCategories);
    }).toThrow(/質問内容/);

    // エラーケース: 空の分類カテゴリ配列
    expect(() => {
      classifyCustomerInquiry(customerInquiryText, []);
    }).toThrow(/分類/);

    // エラーケース: null値の質問テキスト
    expect(() => {
      classifyCustomerInquiry(null as any, classificationCategories);
    }).toThrow(/質問内容/);
  });
});