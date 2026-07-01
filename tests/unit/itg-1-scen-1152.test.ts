import { validateReportCompleteness } from "../../src/logic/it-1781935279444-2-2-1";

describe("レポート完全性・正確性の自動検証 - 負数検出エラーハンドリング", () => {
  test("SCEN-1152: 顧客別成果指標に不正な負数が検出された場合、検証エラーが返される", () => {
    // テストデータ準備：顧客別成果指標に負数を含むレポート
    const reportData = {
      report_id: "report_202401_001",
      customer_id: "cust_12345",
      service_id: "svc_sales",
      reporting_period: "2024-01",
      indicators: {
        appointment_count: 5,
        contract_count: 2,
        revenue_amount: -50000, // 不正な負数
        customer_response_score: 8.5,
      },
      generation_timestamp: "2024-01-31T23:59:59Z",
    };

    // レポート完全性・正確性の自動検証機能を実行
    const result = validateReportCompleteness(reportData);

    // 検証エラーが返されたことを確認
    expect(result.is_valid).toBe(false);
    expect(result.validation_status).toBe("failed");

    // エラーレスポンスに必要な情報が含まれていることを確認
    expect(result.errors).toBeDefined();
    expect(Array.isArray(result.errors)).toBe(true);
    expect(result.errors.length).toBeGreaterThan(0);

    // エラーコードを確認
    expect(result.errors[0].error_code).toBe("NEGATIVE_VALUE_DETECTED");

    // エラーメッセージに検出された負数フィールドの特定情報を含むことを確認
    expect(result.errors[0].error_message).toMatch(/revenue_amount/);
    expect(result.errors[0].error_message).toMatch(/負数/);

    // 該当する顧客識別子がエラーレスポンスに含まれることを確認
    expect(result.errors[0].customer_id).toBe("cust_12345");

    // どの顧客のどの指標に問題があるかが明確に特定できることを確認
    expect(result.errors[0].affected_field).toBe("revenue_amount");
    expect(result.errors[0].affected_value).toBe(-50000);

    // エラーレスポンスの構造を検証
    expect(result.errors[0]).toHaveProperty("error_code");
    expect(result.errors[0]).toHaveProperty("error_message");
    expect(result.errors[0]).toHaveProperty("customer_id");
    expect(result.errors[0]).toHaveProperty("affected_field");
    expect(result.errors[0]).toHaveProperty("affected_value");

    // エラーメッセージが具体的で、対応に必要な情報を含むことを確認
    expect(result.errors[0].error_message).toContain("cust_12345");
  });
});