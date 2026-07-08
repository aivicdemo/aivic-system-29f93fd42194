import { describe, test, expect } from "@jest/globals";
import {
  classifyMonthlyVariationPattern,
  calculateRequiredStaffCount,
} from "../../src/logic/it-1-br-2-2-2-1";

describe("月次変動パターン分類・必要人員数算出機能", () => {
  // SCEN-1286
  test("全ヶ月の件数が同一の場合、通常期として分類され、必要人員数が正しく算出される", () => {
    // 準備: 12ヶ月間すべてで件数が同一値（100件）のデータセット
    const monthly_assessment_counts = [
      100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100,
    ];
    const average_processing_time_minutes = 30;

    // 月次変動パターン分類機能に入力
    const classification_result = classifyMonthlyVariationPattern(
      monthly_assessment_counts
    );

    // 分類結果が『通常期』として正しく分類されていることを確認
    expect(classification_result.pattern_classification).toBe("通常期");
    expect(classification_result.variation_coefficient).toBe(0);

    // 必要人員数算出機能に『通常期』の分類結果を入力
    const required_staff_calculation = calculateRequiredStaffCount(
      classification_result.pattern_classification,
      average_processing_time_minutes,
      100 // 通常期の基準件数（平均値）
    );

    // 算出された必要人員数が通常期の基準値に基づいて計算されていることを検証
    // 通常期: 平均件数 100件 ÷ (480分 ÷ 30分) = 100 ÷ 16 = 6.25 → 7名（切上）
    expect(required_staff_calculation.required_staff_count).toBe(7);
    expect(required_staff_calculation.busy_level).toBe("通常期");
    expect(required_staff_calculation.staffing_basis).toBe(
      "月次件数平均値に基づく通常期基準"
    );
  });
});