import { validateReportQualityChecklistAndReturnRejectionDecision } from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレートの定義・管理機能 - 自動生成レポート品質チェック", () => {
  test("SCEN-668: チェックリスト項目の一部が不合格の場合、差戻し判定が正確に行われる", () => {
    // 背景: 自動生成レポートがテンプレートに基づき生成され、品質チェック検証が開始される段階
    // トリガー: チェックリスト内の複数項目の一部が不合格状態で品質チェック検証プロセスが実行される
    // 期待結果: 不合格項目が正確に特定され、差戻し判定フラグが true に設定され、差戻し理由に不合格項目がすべて明記される

    const checklistItems = [
      {
        id: "item_001",
        name: "顧客ごとの売上集計合計",
        status: "合格",
        validationRule: "必須項目・データ型・値の範囲チェック",
      },
      {
        id: "item_002",
        name: "サービス別売上の内訳",
        status: "不合格",
        validationRule: "必須項目チェック",
        failureReason: "サービス種別BのデータがNULL",
      },
      {
        id: "item_003",
        name: "割引額の計算根拠",
        status: "合格",
        validationRule: "計算式検証",
      },
      {
        id: "item_004",
        name: "請求期間の妥当性",
        status: "不合格",
        validationRule: "日付範囲チェック",
        failureReason: "請求開始日が請求終了日より後",
      },
      {
        id: "item_005",
        name: "異常値検出フラグ",
        status: "不合格",
        validationRule: "異常値判定",
        failureReason: "請求額が前月比で+250%（上限:+50%を超過）",
      },
    ];

    const reportData = {
      reportId: "report_20240131_cust_A",
      customerId: "customer_001",
      reportPeriod: {
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      },
      generatedBy: "automated_system",
      generatedAt: "2024-02-01T09:00:00Z",
      checklistItems: checklistItems,
    };

    // 品質チェック検証プロセスを実行
    const rejectionDecision = validateReportQualityChecklistAndReturnRejectionDecision(
      reportData
    );

    // 差戻し判定フラグが true に設定されていることを検証
    expect(rejectionDecision.isRejected).toBe(true);

    // 不合格項目数が正確に特定されていることを検証（期待値: 3項目）
    expect(rejectionDecision.failedItemCount).toBe(3);

    // 不合格項目のIDリストが正確に含まれていることを検証
    expect(rejectionDecision.failedItemIds).toEqual([
      "item_002",
      "item_004",
      "item_005",
    ]);

    // 合格項目数が正確に特定されていることを検証（期待値: 2項目）
    expect(rejectionDecision.passedItemCount).toBe(2);

    // 合格項目のIDリストが正確に含まれていることを検証
    expect(rejectionDecision.passedItemIds).toEqual(["item_001", "item_003"]);

    // 差戻し理由に不合格項目がすべて明記されていることを検証
    expect(rejectionDecision.rejectionReasons).toContain(
      "item_002: サービス別売上の内訳 - サービス種別BのデータがNULL"
    );
    expect(rejectionDecision.rejectionReasons).toContain(
      "item_004: 請求期間の妥当性 - 請求開始日が請求終了日より後"
    );
    expect(rejectionDecision.rejectionReasons).toContain(
      "item_005: 異常値検出フラグ - 請求額が前月比で+250%（上限:+50%を超過）"
    );

    // 不合格理由の個数が不合格項目数と一致することを検証
    expect(rejectionDecision.rejectionReasons.length).toBe(3);

    // 差戻し対象フラグが true に設定されていることを検証
    expect(rejectionDecision.isReturnTarget).toBe(true);

    // レポートID が正確に記録されていることを検証
    expect(rejectionDecision.reportId).toBe("report_20240131_cust_A");

    // 検証実行タイムスタンプが存在することを検証
    expect(rejectionDecision.validatedAt).toBeDefined();

    // 検証ステータスが「差戻し」に設定されていることを検証
    expect(rejectionDecision.validationStatus).toBe("差戻し");

    // 合格項目の詳細が保持されていることを検証（後続処理で利用可能にするため）
    expect(rejectionDecision.passedItems).toEqual([
      {
        id: "item_001",
        name: "顧客ごとの売上集計合計",
        status: "合格",
      },
      {
        id: "item_003",
        name: "割引額の計算根拠",
        status: "合格",
      },
    ]);

    // 不合格項目の詳細が保持されていることを検証
    expect(rejectionDecision.failedItems).toEqual([
      {
        id: "item_002",
        name: "サービス別売上の内訳",
        status: "不合格",
        failureReason: "サービス種別BのデータがNULL",
      },
      {
        id: "item_004",
        name: "請求期間の妥当性",
        status: "不合格",
        failureReason: "請求開始日が請求終了日より後",
      },
      {
        id: "item_005",
        name: "異常値検出フラグ",
        status: "不合格",
        failureReason: "請求額が前月比で+250%（上限:+50%を超過）",
      },
    ]);
  });
});