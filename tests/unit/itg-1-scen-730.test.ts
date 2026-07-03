import { validateSalesDataCompletenessAndAccuracy } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  // SCEN-730: [edge] 営業データ最終検証・レポート生成可否判定機能 - 確定済みデータに1つの異常値が境界値で検出され、生成を中止する
  test("確定済み営業データに境界値の異常値が検出された場合、レポート生成は中止され詳細エラーが返される", () => {
    const sales_data_set = {
      sales_data_id: "SD-001",
      customer_id: "CUST-101",
      service_id: "SVC-001",
      appointment_count: 5,
      contract_count: 2,
      customer_response: "positive",
      amount: 150000,
      amount_max_limit: 150000,
      status: "confirmed",
      created_at: new Date("2024-01-15T10:00:00Z"),
    };

    const validation_rules = [
      {
        rule_id: "rule_amount_max",
        field_name: "amount",
        rule_type: "max_value",
        max_value: 150000,
        is_boundary_critical: true,
      },
    ];

    const result = validateSalesDataCompletenessAndAccuracy(
      sales_data_set,
      validation_rules
    );

    expect(result.validation_passed).toBe(false);
    expect(result.error_detected).toBe(true);
    expect(result.error_details).toEqual(
      expect.objectContaining({
        field_name: "amount",
        detected_value: 150000,
        allowed_max: 150000,
        violation_type: "boundary_limit_exceeded",
      })
    );
    expect(result.report_generation_allowed).toBe(false);
    expect(result.error_message).toMatch(/金額|上限値|境界/);
    expect(result.incomplete_report_discarded).toBe(true);
    expect(result.database_record_created).toBe(false);
  });
});