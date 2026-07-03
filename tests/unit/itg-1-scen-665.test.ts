import { validateReportApprovalCriteria } from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレートの定義・管理機能", () => {
  // SCEN-665: [error] レポート承認基準検証機能 - 複数の承認基準違反が同時に発生した場合、すべての違反理由が返される
  test("複数の承認基準違反を同時に検出し、すべての違反理由を配列で返却する", () => {
    const reportData = {
      reportId: "REPORT-2024-001",
      generatedDate: "2024-02-31",
      totalAmount: 150000,
      requiredFieldA: "",
      requiredFieldB: "valid_value",
      amountUpperLimit: 100000,
      dateFormat: "invalid-date",
      summary: null,
      approvalStatus: "pending",
    };

    const expectedViolations = [
      {
        code: "INVALID_DATE_FORMAT",
        field: "generatedDate",
        message: "日付形式が不正です。YYYY-MM-DD形式で入力してください。",
        expectedValue: "YYYY-MM-DD",
        actualValue: "2024-02-31",
      },
      {
        code: "REQUIRED_FIELD_MISSING",
        field: "requiredFieldA",
        message: "必須項目が未入力です。",
        expectedValue: "not_empty",
        actualValue: "",
      },
      {
        code: "AMOUNT_OUT_OF_RANGE",
        field: "totalAmount",
        message: "金額が上限を超えています。",
        expectedValue: "≤ 100000",
        actualValue: 150000,
      },
      {
        code: "NULL_VALUE_NOT_ALLOWED",
        field: "summary",
        message: "サマリーがnullです。",
        expectedValue: "string_value",
        actualValue: null,
      },
    ];

    const result = validateReportApprovalCriteria(reportData);

    expect(result).toBeDefined();
    expect(result.isValid).toBe(false);
    expect(result.violations).toBeDefined();
    expect(Array.isArray(result.violations)).toBe(true);
    expect(result.violations.length).toBe(4);

    expect(result.violations).toContainEqual(expectedViolations[0]);
    expect(result.violations).toContainEqual(expectedViolations[1]);
    expect(result.violations).toContainEqual(expectedViolations[2]);
    expect(result.violations).toContainEqual(expectedViolations[3]);

    expect(result.violations[0]).toHaveProperty("code");
    expect(result.violations[0]).toHaveProperty("field");
    expect(result.violations[0]).toHaveProperty("message");
    expect(result.violations[0]).toHaveProperty("expectedValue");
    expect(result.violations[0]).toHaveProperty("actualValue");

    expect(result.errorCode).toBe("MULTIPLE_VALIDATION_FAILURES");
    expect(result.statusCode).toBe(400);
    expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});