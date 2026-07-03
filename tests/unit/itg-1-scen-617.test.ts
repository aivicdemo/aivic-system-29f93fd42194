import { extractAndAggregateChargeableItems } from "../../src/logic/it-1-2-1";

describe("請求対象項目自動抽出・請求額集計", () => {
  test("SCEN-617: 請求対象項目として定義されていない項目のみ存在する場合、請求額集計がスキップされる", () => {
    // 準備: 請求対象項目定義マスタ
    const chargeableItemDefinitions = [
      { itemId: "item_001", itemName: "アポイント数", unit: "回" },
      { itemId: "item_002", itemName: "成約数", unit: "件" },
      { itemId: "item_003", itemName: "顧客反応", unit: "点" },
    ];

    // 準備: 営業成果データ（請求対象項目として定義されていない項目のみ）
    const salesPerformanceData = {
      customerId: "cust_001",
      serviceId: "svc_001",
      performancePeriod: "2024-01-01",
      undefinedField1: "value1",
      undefinedField2: "value2",
      undefinedField3: "value3",
    };

    // 準備: 既存の請求額集計テーブル（処理前）
    const aggregationTableBefore: Array<{
      customerId: string;
      serviceId: string;
      chargeAmount: number;
    }> = [];

    // 実行
    const result = extractAndAggregateChargeableItems(
      salesPerformanceData,
      chargeableItemDefinitions
    );

    // 検証1: 処理ログにスキップ通知があることを確認
    expect(result.isSkipped).toBe(true);

    // 検証2: エラーが発生していないことを確認
    expect(result.hasError).toBe(false);

    // 検証3: 請求額集計テーブルへの追加がないことを確認
    const aggregationTableAfter = result.aggregationRecords;
    expect(aggregationTableAfter).toEqual([]);

    // 検証4: 抽出された請求対象項目が空であることを確認
    expect(result.extractedChargeableItems).toEqual([]);

    // 検証5: 集計結果の請求額がゼロまたは未設定であることを確認
    expect(result.aggregatedChargeAmount).toBe(0);

    // 検証6: スキップ理由が正確に記録されていることを確認
    expect(result.skipReason).toBe("請求対象項目が見つかりません");
  });
});