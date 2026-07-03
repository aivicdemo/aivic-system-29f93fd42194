import { structureHearingResult } from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  // SCEN-1321
  test("ヒアリング内容にレポート形式の記載がない場合、該当項目が空として記録される", () => {
    const hearingInput = {
      customer_name: "テスト顧客A",
      hearing_datetime: "2024-01-15T10:00:00Z",
      requirement_overview: "月次営業成果データの標準化が必要",
      data_items: ["appointment_count", "contract_count", "customer_feedback"],
      calculation_logic: "合計値",
      report_format: "",
      required_kpis: ["conversion_rate", "deal_value"],
    };

    const result = structureHearingResult(hearingInput);

    expect(result).toEqual({
      customer_name: "テスト顧客A",
      hearing_datetime: "2024-01-15T10:00:00Z",
      requirement_overview: "月次営業成果データの標準化が必要",
      data_items: ["appointment_count", "contract_count", "customer_feedback"],
      calculation_logic: "合計値",
      report_format: "",
      required_kpis: ["conversion_rate", "deal_value"],
      is_report_format_empty: true,
      validation_status: "success_with_missing_optional_field",
      recorded_at: result.recorded_at,
    });

    expect(result.validation_status).toBe("success_with_missing_optional_field");
    expect(result.is_report_format_empty).toBe(true);
    expect(result.report_format).toBe("");
    expect(result.customer_name).toBe("テスト顧客A");
    expect(result.hearing_datetime).toBe("2024-01-15T10:00:00Z");
    expect(result.requirement_overview).toBe(
      "月次営業成果データの標準化が必要"
    );
    expect(result.data_items).toEqual([
      "appointment_count",
      "contract_count",
      "customer_feedback",
    ]);
    expect(result.calculation_logic).toBe("合計値");
    expect(result.required_kpis).toEqual(["conversion_rate", "deal_value"]);
    expect(typeof result.recorded_at).toBe("string");
  });
});