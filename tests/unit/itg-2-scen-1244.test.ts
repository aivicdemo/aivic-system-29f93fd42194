import { describe, test, expect } from "@jest/globals";
import { generateStakeholderCustomizedReport } from "../../src/logic/it-1-br-2-2-2-1";

describe("査定員ごとの判定結果と根拠の月次集計・分析ダッシュボード", () => {
  test("SCEN-1244: ステークホルダー区分が未定義の場合、カスタマイズレポート生成がエラーとなる", () => {
    // ステークホルダー区分が空文字列（未定義）の場合
    const invalidInput = {
      stakeholder_category: "",
      report_month: "2024-01",
      appraiser_ids: ["APP001", "APP002"],
      include_metrics: ["processing_time", "accuracy", "consistency"],
    };

    expect(() => generateStakeholderCustomizedReport(invalidInput)).toThrow(
      /ステークホルダー区分/
    );
  });

  test("SCEN-1244: ステークホルダー区分が null の場合、カスタマイズレポート生成がエラーとなる", () => {
    // ステークホルダー区分が null（未定義）の場合
    const invalidInputNull = {
      stakeholder_category: null as any,
      report_month: "2024-01",
      appraiser_ids: ["APP001", "APP002"],
      include_metrics: ["processing_time", "accuracy", "consistency"],
    };

    expect(() =>
      generateStakeholderCustomizedReport(invalidInputNull)
    ).toThrow(/ステークホルダー区分/);
  });

  test("SCEN-1244: ステークホルダー区分が undefined の場合、カスタマイズレポート生成がエラーとなる", () => {
    // ステークホルダー区分が undefined（未定義）の場合
    const invalidInputUndefined = {
      stakeholder_category: undefined as any,
      report_month: "2024-01",
      appraiser_ids: ["APP001", "APP002"],
      include_metrics: ["processing_time", "accuracy", "consistency"],
    };

    expect(() =>
      generateStakeholderCustomizedReport(invalidInputUndefined)
    ).toThrow(/ステークホルダー区分/);
  });

  test("SCEN-1244: ステークホルダー区分が有効な場合、レポート生成が成功する", () => {
    // ステークホルダー区分が定義されている場合
    const validInput = {
      stakeholder_category: "executive",
      report_month: "2024-01",
      appraiser_ids: ["APP001", "APP002"],
      include_metrics: ["processing_time", "accuracy", "consistency"],
    };

    const result = generateStakeholderCustomizedReport(validInput);

    expect(result).toHaveProperty("stakeholder_category", "executive");
    expect(result).toHaveProperty("report_month", "2024-01");
    expect(result).toHaveProperty("status", "generated");
    expect(result).toHaveProperty("generated_at");
    expect(typeof result.generated_at).toBe("string");
  });

  test("SCEN-1244: 複数のステークホルダー区分で検証", () => {
    const validCategories = ["executive", "manager", "operational"];

    validCategories.forEach((category) => {
      const input = {
        stakeholder_category: category,
        report_month: "2024-02",
        appraiser_ids: ["APP001"],
        include_metrics: ["accuracy"],
      };

      const result = generateStakeholderCustomizedReport(input);
      expect(result.stakeholder_category).toBe(category);
      expect(result.status).toBe("generated");
    });
  });
});