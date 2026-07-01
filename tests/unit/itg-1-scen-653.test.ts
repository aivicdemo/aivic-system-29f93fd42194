import { validateReportAmountAccuracy } from "../../src/logic/it-1781935279444-2-1-1";

describe("レポート内容承認基準判定機能 - 金額集計の正確性チェック", () => {
  // SCEN-653
  test("金額集計の正確性チェックで誤差が検出された場合に差戻し理由が明示される", () => {
    const report_data = {
      report_id: "RPT-2024-01-001",
      customer_id: "CUST-001",
      service_id: "SVC-A",
      period_start: "2024-01-01",
      period_end: "2024-01-31",
      items: [
        {
          item_id: "ITEM-001",
          item_name: "アポイント件数",
          unit: "件",
          quantity: 10,
          unit_price: 5000,
          expected_amount: 50000,
          actual_amount: 49500,
        },
        {
          item_id: "ITEM-002",
          item_name: "成約件数",
          unit: "件",
          quantity: 3,
          unit_price: 20000,
          expected_amount: 60000,
          actual_amount: 60000,
        },
        {
          item_id: "ITEM-003",
          item_name: "顧客反応スコア",
          unit: "ポイント",
          quantity: 150,
          unit_price: 100,
          expected_amount: 15000,
          actual_amount: 14850,
        },
      ],
      total_expected_amount: 125000,
      total_actual_amount: 124350,
    };

    const result = validateReportAmountAccuracy(report_data);

    // 誤差検出の確認
    expect(result.status).toBe("REJECTED");

    // 差戻し理由が存在することの確認
    expect(result.rejection_reason).toBeDefined();
    expect(typeof result.rejection_reason).toBe("string");

    // 誤差検出通知の確認
    expect(result.rejection_reason).toMatch(/誤差/);

    // 誤差額の確認 (125000 - 124350 = 650)
    expect(result.rejection_reason).toMatch(/650/);

    // 誤差率の確認 (650 / 125000 = 0.52%)
    expect(result.rejection_reason).toMatch(/0\.52|0\.5%/);

    // 誤差項目の特定確認
    expect(result.rejection_reason).toMatch(/ITEM-001/);
    expect(result.rejection_reason).toMatch(/ITEM-003/);

    // 対象項目名の確認
    expect(result.rejection_reason).toMatch(/アポイント件数|成約件数|顧客反応スコア/);

    // 誤差詳細情報の構造確認
    expect(result.error_details).toBeDefined();
    expect(Array.isArray(result.error_details)).toBe(true);
    expect(result.error_details.length).toBe(2);

    // 各誤差項目の詳細確認
    const error_item_1 = result.error_details.find(
      (e: any) => e.item_id === "ITEM-001"
    );
    expect(error_item_1).toBeDefined();
    expect(error_item_1.item_name).toBe("アポイント件数");
    expect(error_item_1.expected_amount).toBe(50000);
    expect(error_item_1.actual_amount).toBe(49500);
    expect(error_item_1.discrepancy_amount).toBe(500);
    expect(error_item_1.discrepancy_rate).toBe(1.0);

    const error_item_2 = result.error_details.find(
      (e: any) => e.item_id === "ITEM-003"
    );
    expect(error_item_2).toBeDefined();
    expect(error_item_2.item_name).toBe("顧客反応スコア");
    expect(error_item_2.expected_amount).toBe(15000);
    expect(error_item_2.actual_amount).toBe(14850);
    expect(error_item_2.discrepancy_amount).toBe(150);
    expect(error_item_2.discrepancy_rate).toBeCloseTo(1.0, 1);

    // 対応方法の提示確認
    expect(result.rejection_reason).toMatch(/確認|修正|確定|入力|営業/);

    // ユーザーが理解しやすい形式の確認
    expect(result.rejection_reason.length).toBeGreaterThan(0);
    expect(result.formatted_message).toBeDefined();

    // 日本語による明確な説明
    expect(result.formatted_message).toMatch(/誤差が検出されました/);
    expect(result.formatted_message).toMatch(/誤差額/);
    expect(result.formatted_message).toMatch(/誤差率/);
  });
});