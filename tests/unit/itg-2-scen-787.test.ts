import { describe, test, expect } from "@jest/globals";
import {
  formatMarketDeviationForDisplay,
} from "../../src/logic/it-6-3-1";

describe("相場乖離可視化機能 - 統一表示フォーマット", () => {
  // SCEN-787: [normal] 相場乖離可視化機能 - 相場乖離率・乖離額・参照案件件数・物価本出典・補正係数が統一表示される
  test("相場乖離率、乖離額、参照案件件数、物価本出典、補正係数が統一フォーマットで表示される", () => {
    // 入力: 相場乖離の基本データセット
    const deviationData = {
      deviation_rate: 12.5,
      deviation_amount: 450000,
      reference_case_count: 8,
      material_price_source: "2024年度建設物価",
      correction_coefficient: 1.05,
    };

    const result = formatMarketDeviationForDisplay(deviationData);

    // 期待結果: 相場乖離率が「%」単位で小数第1位まで表示される
    expect(result.formatted_deviation_rate).toBe("12.5%");

    // 期待結果: 相場乖離額が「円」単位で3桁カンマ区切り表示される
    expect(result.formatted_deviation_amount).toBe("450,000円");

    // 期待結果: 参照案件件数が整数で表示される
    expect(result.formatted_reference_case_count).toBe("8件");

    // 期待結果: 物価本出典が年号付きで表示される
    expect(result.formatted_material_price_source).toBe("2024年度建設物価");

    // 期待結果: 補正係数が小数第2位まで表示される
    expect(result.formatted_correction_coefficient).toBe("1.05");
  });

  test("複数の査定データで異なる数値が同じフォーマット規則で表示される", () => {
    const dataset1 = {
      deviation_rate: 8.33,
      deviation_amount: 125000,
      reference_case_count: 15,
      material_price_source: "2023年度建設物価",
      correction_coefficient: 0.98,
    };

    const result1 = formatMarketDeviationForDisplay(dataset1);

    // 相場乖離率: 小数第1位
    expect(result1.formatted_deviation_rate).toBe("8.3%");
    // 相場乖離額: 3桁カンマ区切り
    expect(result1.formatted_deviation_amount).toBe("125,000円");
    // 参照案件件数: 整数
    expect(result1.formatted_reference_case_count).toBe("15件");
    // 物価本出典: 年号付き
    expect(result1.formatted_material_price_source).toBe("2023年度建設物価");
    // 補正係数: 小数第2位
    expect(result1.formatted_correction_coefficient).toBe("0.98");

    const dataset2 = {
      deviation_rate: -5.67,
      deviation_amount: -280000,
      reference_case_count: 3,
      material_price_source: "2022年度建設物価",
      correction_coefficient: 1.15,
    };

    const result2 = formatMarketDeviationForDisplay(dataset2);

    // 負の相場乖離率も小数第1位で表示
    expect(result2.formatted_deviation_rate).toBe("-5.7%");
    // 負の相場乖離額も3桁カンマ区切りで表示
    expect(result2.formatted_deviation_amount).toBe("-280,000円");
    // 参照案件件数が少ない場合も整数で表示
    expect(result2.formatted_reference_case_count).toBe("3件");
    // 異なる年度の物価本も同じ形式で表示
    expect(result2.formatted_material_price_source).toBe("2022年度建設物価");
    // 1.0を超える補正係数も小数第2位で表示
    expect(result2.formatted_correction_coefficient).toBe("1.15");
  });

  test("ページ遷移後も表示フォーマットが維持される", () => {
    const baseData = {
      deviation_rate: 15.44,
      deviation_amount: 1250000,
      reference_case_count: 22,
      material_price_source: "2024年度建設物価",
      correction_coefficient: 1.02,
    };

    // 最初のページで表示
    const initialDisplay = formatMarketDeviationForDisplay(baseData);
    expect(initialDisplay.formatted_deviation_rate).toBe("15.4%");
    expect(initialDisplay.formatted_deviation_amount).toBe("1,250,000円");
    expect(initialDisplay.formatted_reference_case_count).toBe("22件");
    expect(initialDisplay.formatted_material_price_source).toBe(
      "2024年度建設物価"
    );
    expect(initialDisplay.formatted_correction_coefficient).toBe("1.02");

    // ページ遷移後も同じデータを再度表示
    const afterNavigationDisplay = formatMarketDeviationForDisplay(baseData);
    expect(afterNavigationDisplay.formatted_deviation_rate).toBe("15.4%");
    expect(afterNavigationDisplay.formatted_deviation_amount).toBe(
      "1,250,000円"
    );
    expect(afterNavigationDisplay.formatted_reference_case_count).toBe("22件");
    expect(afterNavigationDisplay.formatted_material_price_source).toBe(
      "2024年度建設物価"
    );
    expect(afterNavigationDisplay.formatted_correction_coefficient).toBe(
      "1.02"
    );
  });

  test("端数値で四捨五入ルールが正しく適用される", () => {
    const roundingData = {
      deviation_rate: 12.649,
      deviation_amount: 449999,
      reference_case_count: 8,
      material_price_source: "2024年度建設物価",
      correction_coefficient: 1.045,
    };

    const result = formatMarketDeviationForDisplay(roundingData);

    // 相場乖離率: 12.649 → 12.6% (小数第2位を四捨五入)
    expect(result.formatted_deviation_rate).toBe("12.6%");
    // 相場乖離額: 449999 → 450,000円 (3桁カンマ区切り)
    expect(result.formatted_deviation_amount).toBe("450,000円");
    // 補正係数: 1.045 → 1.05 (小数第3位を四捨五入)
    expect(result.formatted_correction_coefficient).toBe("1.05");
  });

  test("100万円超える大金額でも3桁カンマ区切りが正しく表示される", () => {
    const largeAmountData = {
      deviation_rate: 3.2,
      deviation_amount: 12500000,
      reference_case_count: 45,
      material_price_source: "2024年度建設物価",
      correction_coefficient: 1.0,
    };

    const result = formatMarketDeviationForDisplay(largeAmountData);

    expect(result.formatted_deviation_amount).toBe("12,500,000円");
    expect(result.formatted_reference_case_count).toBe("45件");
  });

  test("0件や小数点以下のない値でも形式が統一される", () => {
    const edgeCaseData = {
      deviation_rate: 0.0,
      deviation_amount: 0,
      reference_case_count: 0,
      material_price_source: "2024年度建設物価",
      correction_coefficient: 1.0,
    };

    const result = formatMarketDeviationForDisplay(edgeCaseData);

    expect(result.formatted_deviation_rate).toBe("0.0%");
    expect(result.formatted_deviation_amount).toBe("0円");
    expect(result.formatted_reference_case_count).toBe("0件");
    expect(result.formatted_material_price_source).toBe("2024年度建設物価");
    expect(result.formatted_correction_coefficient).toBe("1.00");
  });

  test("入力値が存在しない場合は例外が発生する", () => {
    const incompleteData = {
      deviation_rate: 10.5,
      deviation_amount: 250000,
      // reference_case_count が欠落
      material_price_source: "2024年度建設物価",
      correction_coefficient: 1.05,
    };

    expect(() =>
      formatMarketDeviationForDisplay(incompleteData as any)
    ).toThrow(/参照案件件数/);
  });

  test("物価本出典が異なる形式でも統一フォーマットで正規化される", () => {
    const sourceData1 = {
      deviation_rate: 5.0,
      deviation_amount: 100000,
      reference_case_count: 10,
      material_price_source: "令和6年度建設物価",
      correction_coefficient: 1.0,
    };

    const result1 = formatMarketDeviationForDisplay(sourceData1);
    // 「令和」表記も「年度」を含めて統一形式で保持
    expect(result1.formatted_material_price_source).toMatch(/年度.*物価/);

    const sourceData2 = {
      deviation_rate: 5.0,
      deviation_amount: 100000,
      reference_case_count: 10,
      material_price_source: "2024建設物価",
      correction_coefficient: 1.0,
    };

    const result2 = formatMarketDeviationForDisplay(sourceData2);
    expect(result2.formatted_material_price_source).toBe("2024建設物価");
  });
});