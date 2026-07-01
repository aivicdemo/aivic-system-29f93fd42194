import { validateSalesData } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  // SCEN-712: [normal] 営業データ完全性・正確性検証 - 必須項目充足・形式妥当性・ステータス矛盾が全て合格し検証OK判定となる
  test("すべての必須項目が入力され、形式が妥当で、ステータス矛盾がない営業データは検証OK判定となる", () => {
    // テストデータ: すべての必須項目が入力された営業データレコード
    const salesData = {
      customer_name: "株式会社テスト商事",
      contact_date: "2024-01-15",
      sales_amount: 150000,
      appointment_status: "confirmed",
      billing_status: "pending",
      shipment_status: "not_shipped",
      contact_email: "sales@test-company.jp",
      product_service_type: "service_A",
      notes: "初回打ち合わせ完了",
    };

    const result = validateSalesData(salesData);

    // 検証結果が「OK」と判定される
    expect(result.validation_result).toBe("OK");

    // 必須項目充足の検証項目が合格ステータスで返却される
    expect(result.required_fields_check).toEqual({
      status: "passed",
      details: "すべての必須項目が入力されています。",
    });

    // 形式妥当性の検証項目が合格ステータスで返却される
    expect(result.format_validation_check).toEqual({
      status: "passed",
      details: "すべての項目の形式が妥当です。",
    });

    // ステータス矛盾の検証項目が合格ステータスで返却される
    expect(result.status_consistency_check).toEqual({
      status: "passed",
      details: "ステータス間の矛盾はありません。",
    });

    // 全体の検証サマリー
    expect(result.passed_count).toBe(3);
    expect(result.failed_count).toBe(0);
    expect(result.warnings).toEqual([]);
  });
});