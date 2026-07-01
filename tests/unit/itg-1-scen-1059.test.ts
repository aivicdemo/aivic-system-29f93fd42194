import { extractAndAggregateChargeableItems } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能 - 請求対象項目自動抽出・集計", () => {
  // SCEN-1059: [edge] 請求ルールに合致する営業データが存在しない場合、請求額 0 が返される
  test("請求ルールに合致する営業データが存在しない場合、請求額として0が返されること", () => {
    // テストデータ: 営業データなし（空配列）
    const salesData = [];

    // 請求ルール定義
    const chargeRule = {
      customer_id: "CUST-001",
      service_id: "SVC-PREMIUM",
      period_start: new Date("2024-01-01T00:00:00Z"),
      period_end: new Date("2024-01-31T23:59:59Z"),
      customer_type: "enterprise",
    };

    // 請求対象項目自動抽出・集計機能を実行
    const result = extractAndAggregateChargeableItems(salesData, chargeRule);

    // 期待結果: 請求額が0で返されること
    expect(result.total_charge_amount).toBe(0);
    expect(result.charge_items).toEqual([]);
    expect(result.charge_count).toBe(0);
    expect(result.rule_matched).toBe(false);
  });
});