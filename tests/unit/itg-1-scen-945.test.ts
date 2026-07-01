import { validateSalesDataQuality } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  test("SCEN-945: 必須項目の欠落が0件の場合、品質チェック合格と判定される", () => {
    // 必須項目（顧客名、金額、日付、営業担当者、契約状況）がすべて入力された営業データ
    const salesData = {
      customer_name: "テスト顧客A",
      amount: 150000,
      contact_date: "2024-01-15",
      sales_person: "営業太郎",
      contract_status: "confirmed",
    };

    // 品質チェック処理を実行
    const result = validateSalesDataQuality(salesData);

    // 必須項目の欠落が0件であることを確認
    expect(result.missing_field_count).toBe(0);

    // 品質チェック結果が「合格」と判定されることを確認
    expect(result.validation_status).toBe("passed");

    // エラーメッセージが出力されないことを確認
    expect(result.error_messages).toEqual([]);

    // システムが当該営業データを正常なデータとして次の処理に進めることを確認
    expect(result.can_proceed_to_next_step).toBe(true);

    // 追加検証: 異常値や矛盾がないことを確認
    expect(result.has_anomalies).toBe(false);
    expect(result.has_contradictions).toBe(false);
  });
});