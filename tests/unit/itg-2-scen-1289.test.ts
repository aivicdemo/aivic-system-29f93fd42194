import { analyzeMonthlyVariationPattern } from "../../src/logic/it-1-br-2-2-2-1";

describe("月次件数変動パターン分析と人員配置シナリオ自動生成", () => {
  // SCEN-1289
  test("月次件数が0件またはNullの月が存在する場合、その月を除外して分析を継続する", () => {
    // テストデータ: 12ヶ月のデータに0件とNullを含む
    const monthlyCountData = [
      { month: "2023-01", count: 120 },
      { month: "2023-02", count: 0 },      // 除外対象
      { month: "2023-03", count: 135 },
      { month: "2023-04", count: null },   // 除外対象
      { month: "2023-05", count: 150 },
      { month: "2023-06", count: 0 },      // 除外対象
      { month: "2023-07", count: 180 },
      { month: "2023-08", count: 165 },
      { month: "2023-09", count: null },   // 除外対象
      { month: "2023-10", count: 140 },
      { month: "2023-11", count: 155 },
      { month: "2023-12", count: 175 }
    ];

    const avgProcessingTime = 25; // 平均処理時間（分）
    const capacityPerEmployee = 1152; // 1従業員の月間処理能力（件数）

    // 分析実行
    const result = analyzeMonthlyVariationPattern({
      monthlyCountData,
      avgProcessingTime,
      capacityPerEmployee
    });

    // 有効データ: 8ヶ月（0件3月 + Null2月を除外）
    const validCounts = [120, 135, 150, 180, 165, 140, 155, 175];
    const validMonthCount = 8;

    // 統計値計算
    const sumCount = validCounts.reduce((a, b) => a + b, 0);
    const avgCount = sumCount / validMonthCount; // (120+135+150+180+165+140+155+175)/8 = 1160/8 = 145
    
    // 標準偏差計算
    const variance = validCounts.reduce((sum, val) => sum + Math.pow(val - avgCount, 2), 0) / validMonthCount;
    const stdDev = Math.sqrt(variance);
    
    // 変動係数
    const coefficientOfVariation = (stdDev / avgCount) * 100;

    // 忙しさレベル判定
    // 平均 145 なので、±1標準偏差の範囲を計算
    // 通常期: avgCount ± 0.5*stdDev
    // 繁忙期: avgCount + stdDev以上
    const normalRangeMin = Math.round(avgCount * 0.8);
    const normalRangeMax = Math.round(avgCount * 1.2);
    
    const normalMonths = validCounts.filter(c => c >= normalRangeMin && c <= normalRangeMax).length;
    const busyMonths = validCounts.filter(c => c > normalRangeMax).length;
    const quietMonths = validCounts.filter(c => c < normalRangeMin).length;

    // 必要人員数計算（通常期ベース）
    const requiredEmployeesNormal = Math.ceil(avgCount / capacityPerEmployee * 1.0);
    const requiredEmployeesBusy = Math.ceil(avgCount / capacityPerEmployee * 1.5);

    // 期待値の検証

    // 1. 除外された月数の確認
    expect(result.excludedMonthCount).toBe(5); // 0件3月 + Null2月

    // 2. 分析対象月数の確認
    expect(result.analyzedMonthCount).toBe(8);

    // 3. 平均件数の検証
    expect(result.averageMonthlyCount).toBe(145);

    // 4. 標準偏差の検証（小数第1位まで）
    expect(Math.round(result.standardDeviation * 10) / 10).toBeCloseTo(stdDev, 1);

    // 5. 変動係数の検証
    expect(Math.round(result.coefficientOfVariation * 10) / 10).toBeCloseTo(coefficientOfVariation, 1);

    // 6. 忙しさレベル分類の検証
    expect(result.normalPeriodMonths).toBe(normalMonths);
    expect(result.busyPeriodMonths).toBe(busyMonths);
    expect(result.quietPeriodMonths).toBe(quietMonths);

    // 7. 必要人員数の検証
    expect(result.requiredEmployeesNormalPeriod).toBe(requiredEmployeesNormal);
    expect(result.requiredEmployeesBusyPeriod).toBe(requiredEmployeesBusy);

    // 8. 生成されたシナリオが存在すること
    expect(result.scenarios).toBeDefined();
    expect(Array.isArray(result.scenarios)).toBe(true);
    expect(result.scenarios.length).toBeGreaterThan(0);

    // 9. 各シナリオに0件またはNullのデータが含まれないことを確認
    result.scenarios.forEach(scenario => {
      scenario.monthlyAllocation.forEach(allocation => {
        expect(allocation.count).not.toBe(0);
        expect(allocation.count).not.toBeNull();
        expect(allocation.count).toBeGreaterThan(0);
      });
    });

    // 10. 分析対象月数と実際の月数が一致すること
    expect(result.analyzedMonthCount + result.excludedMonthCount).toBe(12);

    // 11. エラーフラグがないことを確認
    expect(result.hasError).toBe(false);
    expect(result.errorMessage).toBeUndefined();

    // 12. 分析結果の完全性確認
    expect(result.analysisCompletionFlag).toBe(true);
  });
});