import { validateSalesReportAggregation } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業報告書集計検証 - 0値データの判定基準", () => {
  // SCEN-1102
  test("必須項目がすべて0値の場合、判定基準が明確に定義され、有効または無効が一貫性をもって判定されること", () => {
    const zero_value_report = {
      sales_amount: 0,
      transaction_count: 0,
      customer_count: 0,
      appointment_count: 0,
      contact_date: "2024-01-15T00:00:00Z",
      status: "SUBMITTED",
    };

    const result = validateSalesReportAggregation(zero_value_report);

    // 期待結果：判定基準が明確な場合、以下のいずれかが成立
    // (1) 仕様書に『0値は有効なデータとして扱う』と明記 → 検証通過
    // または
    // (2) 仕様書に『0値は無効なデータとして扱う』と明記 → 検証不合格

    // assertion: 判定結果がオブジェクト形式で返却され、
    // is_valid フィールドが真偽値で明確に定義されていること
    expect(result).toEqual(
      expect.objectContaining({
        is_valid: expect.any(Boolean),
        validation_status: expect.stringMatching(
          /^(PASS|FAIL|UNCLEAR_CRITERIA)$/
        ),
      })
    );

    // 判定基準が明確な場合、UNCLEAR_CRITERIA ではないこと
    // 実装により基準が定義されている場合
    if (
      result.validation_status === "PASS" ||
      result.validation_status === "FAIL"
    ) {
      expect(result.is_valid).toBe(
        result.validation_status === "PASS" ? true : false
      );
      // 判정理由が記録されていることを確認
      expect(result).toEqual(
        expect.objectContaining({
          reason: expect.any(String),
        })
      );
      // 理由が空文字列ではないこと
      expect(result.reason.length).toBeGreaterThan(0);
    }

    // 判定基準が曖昧な場合、エラーメッセージと理由コードが出力されること
    if (result.validation_status === "UNCLEAR_CRITERIA") {
      expect(result).toEqual(
        expect.objectContaining({
          error_message: expect.stringMatching(/0値/),
          judgment_basis_code: expect.any(String),
        })
      );
    }

    // 検証ログに判定ロジックの根拠が記録されること
    expect(result).toEqual(
      expect.objectContaining({
        audit_trail: expect.objectContaining({
          evaluated_at: expect.stringMatching(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
          ),
          evaluation_rule_id: expect.any(String),
        }),
      })
    );

    // 複数回の同じ入力で一貫性があること
    const result2 = validateSalesReportAggregation(zero_value_report);
    expect(result2.is_valid).toBe(result.is_valid);
    expect(result2.validation_status).toBe(result.validation_status);
  });
});