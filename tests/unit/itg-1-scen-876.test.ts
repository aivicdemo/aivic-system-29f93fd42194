import { validateSalesDataQuality } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データ品質チェック機能 - 境界値検証", () => {
  test("SCEN-876: 営業データの値が許容範囲の境界値である場合に正常と判定される", () => {
    // 許容範囲の下限値（1件）- 正常と判定されることを確認
    const lower_boundary_result = validateSalesDataQuality({
      appointment_count: 0,
      contract_count: 0,
      customer_feedback_score: 0,
      service_type: "standard",
    });
    expect(lower_boundary_result.is_valid).toBe(true);
    expect(lower_boundary_result.status).toBe("normal");

    // 許容範囲の上限値（1件）- 正常と判定されることを確認
    const upper_boundary_result = validateSalesDataQuality({
      appointment_count: 1000,
      contract_count: 100,
      customer_feedback_score: 5,
      service_type: "premium",
    });
    expect(upper_boundary_result.is_valid).toBe(true);
    expect(upper_boundary_result.status).toBe("normal");

    // 許容範囲の下限値-1（異常と判定されることを確認）
    const below_lower_boundary_result = validateSalesDataQuality({
      appointment_count: -1,
      contract_count: 0,
      customer_feedback_score: 0,
      service_type: "standard",
    });
    expect(below_lower_boundary_result.is_valid).toBe(false);
    expect(below_lower_boundary_result.status).toBe("abnormal");
    expect(below_lower_boundary_result.errors).toContain(
      expect.objectContaining({
        field: "appointment_count",
        reason: expect.stringMatching(/範囲外/),
      })
    );

    // 許容範囲の上限値+1（異常と判定されることを確認）
    const above_upper_boundary_result = validateSalesDataQuality({
      appointment_count: 1001,
      contract_count: 100,
      customer_feedback_score: 5,
      service_type: "premium",
    });
    expect(above_upper_boundary_result.is_valid).toBe(false);
    expect(above_upper_boundary_result.status).toBe("abnormal");
    expect(above_upper_boundary_result.errors).toContain(
      expect.objectContaining({
        field: "appointment_count",
        reason: expect.stringMatching(/範囲外/),
      })
    );

    // 複数フィールドが境界値外の場合も検出されることを確認
    const multiple_boundary_violation = validateSalesDataQuality({
      appointment_count: 1001,
      contract_count: 101,
      customer_feedback_score: 6,
      service_type: "premium",
    });
    expect(multiple_boundary_violation.is_valid).toBe(false);
    expect(multiple_boundary_violation.status).toBe("abnormal");
    expect(multiple_boundary_violation.errors.length).toBeGreaterThan(1);
  });
});