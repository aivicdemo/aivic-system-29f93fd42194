import { classifyCustomerInquiry } from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  // SCEN-982
  test("顧客質問・異議の内容分類と対応ルート判定 - 請求内容の単純な誤植質問が即座回答ルートに正確に分類される", () => {
    // 準備: 請求内容に関する単純な誤植を指摘する顧客質問テスト
    const inquiryText =
      "先月の請求書で請求額が1000円となっていますが、契約内容から計算すると800円のはずです。金額の数字に誤植があるのではないでしょうか？";

    const customerId = "CUST-001";
    const contractId = "CONTRACT-2024-001";
    const inquiryReceivedAt = new Date("2024-02-05T10:30:00Z");

    // 顧客質問・異議分類エンジンに質問テキストを入力
    const classificationResult = classifyCustomerInquiry({
      inquiryText,
      customerId,
      contractId,
      inquiryReceivedAt,
    });

    // 分類処理が実行され、質問内容の分析と対応ルート判定が行われたことを確認
    expect(classificationResult).toBeDefined();
    expect(classificationResult).toHaveProperty("classificationCategory");
    expect(classificationResult).toHaveProperty("responseRouteName");
    expect(classificationResult).toHaveProperty("confidenceScore");
    expect(classificationResult).toHaveProperty("details");

    // 分類結果から対応ルート判定の結果を取得し、『即座回答ルート』であることを検証
    expect(classificationResult.responseRouteName).toBe("即座回答ルート");

    // 分類カテゴリが「請求金額の誤植」であることを確認
    expect(classificationResult.classificationCategory).toBe(
      "請求金額の誤植"
    );

    // 分類信頼度スコアが閾値（0.85以上）以上であることを検証
    expect(classificationResult.confidenceScore).toBeGreaterThanOrEqual(0.85);

    // 即座回答ルートに分類された質問の詳細情報を確認
    expect(classificationResult.details).toBeDefined();
    expect(classificationResult.details).toHaveProperty("suggestedResponse");
    expect(classificationResult.details).toHaveProperty("detectedIssueType");
    expect(classificationResult.details).toHaveProperty("isAutoResponseEligible");

    // 検出された問題のタイプが「金額入力誤り」であることを確認
    expect(classificationResult.details.detectedIssueType).toBe(
      "金額入力誤り"
    );

    // システムが自動回答可能な状態として認識されていることを検証
    expect(classificationResult.details.isAutoResponseEligible).toBe(true);

    // 推奨回答テキストが存在し、具体的な金額修正内容を含むことを確認
    expect(classificationResult.details.suggestedResponse).toBeDefined();
    expect(
      classificationResult.details.suggestedResponse.includes("800円")
    ).toBe(true);

    // 対応優先度が「高」であることを確認（誤植は即時対応が必要）
    expect(classificationResult.priority).toBe("高");

    // 対応期限が営業日1日以内であることを確認
    expect(classificationResult.responseDeadlineHours).toBe(24);
  });
});