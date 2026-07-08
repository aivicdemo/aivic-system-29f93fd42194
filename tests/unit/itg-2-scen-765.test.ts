import { calculateRequiredStaffCount } from "../../src/logic/it-6-2-1-1";

describe("翌月必要人員数の自動計算・配置シナリオ生成機能", () => {
  // SCEN-765
  test("月次査定件数と平均処理時間から必要人員数が正確に計算される", () => {
    // 入力値
    const monthlyEstimateCount = 1000; // 月次査定件数: 1000件
    const avgProcessingTimeMinutes = 30; // 平均処理時間: 30分/件
    const dailyBusinessHours = 8; // 営業時間: 8時間/日
    const businessDaysPerMonth = 20; // 営業日数: 20営業日
    const marginRatio = 0.2; // 余裕率: 20% (0.2)

    // 計算式の検証
    // 総処理時間 = 1000件 × 30分 = 30000分
    const totalProcessingTimeMinutes = monthlyEstimateCount * avgProcessingTimeMinutes;
    // 利用可能労働時間 = 8時間/日 × 60分/時間 × 20営業日 = 9600分
    const availableWorkingTimeMinutes = dailyBusinessHours * 60 * businessDaysPerMonth;
    // 必要人員数 = 総処理時間 ÷ 利用可能労働時間 × (1 + 余裕率)
    // = 30000 ÷ 9600 × 1.2
    // = 3.125 × 1.2
    // = 3.75 → 切り上げて 4名
    const expectedRequiredStaff = Math.ceil(
      (totalProcessingTimeMinutes / availableWorkingTimeMinutes) * (1 + marginRatio)
    );

    // 関数呼び出し
    const result = calculateRequiredStaffCount({
      monthlyEstimateCount,
      avgProcessingTimeMinutes,
      dailyBusinessHours,
      businessDaysPerMonth,
      marginRatio,
    });

    // ①必要人員数が数式に基づいて正確に算出される
    expect(result.requiredStaffCount).toBe(expectedRequiredStaff);
    expect(result.requiredStaffCount).toBe(4);

    // ②計算結果が整数値で表示される
    expect(Number.isInteger(result.requiredStaffCount)).toBe(true);

    // ③計算結果がシステムに保存可能である（戻り値に必要な属性を持つ）
    expect(result).toHaveProperty("requiredStaffCount");
    expect(result).toHaveProperty("totalProcessingTimeMinutes");
    expect(result).toHaveProperty("availableWorkingTimeMinutes");
    expect(result).toHaveProperty("calculationDetails");

    // 計算詳細の検証
    expect(result.totalProcessingTimeMinutes).toBe(totalProcessingTimeMinutes);
    expect(result.availableWorkingTimeMinutes).toBe(availableWorkingTimeMinutes);

    // ④計算ロジックが入力値の変更に応じて動的に更新される - 異なる入力で再計算
    const result2 = calculateRequiredStaffCount({
      monthlyEstimateCount: 800, // 月次査定件数を 800件に減少
      avgProcessingTimeMinutes: 25, // 平均処理時間を 25分に短縮
      dailyBusinessHours: 8,
      businessDaysPerMonth: 20,
      marginRatio: 0.2,
    });

    // 新しい計算式: (800 × 25) ÷ (8 × 60 × 20) × 1.2
    // = 20000 ÷ 9600 × 1.2
    // = 2.0833... × 1.2
    // = 2.5 → 切り上げて 3名
    expect(result2.requiredStaffCount).toBe(3);

    // ⑤配置シナリオが必要人員数に基づいて自動生成されたことを確認する
    expect(result.scenarios).toBeDefined();
    expect(Array.isArray(result.scenarios)).toBe(true);
    expect(result.scenarios.length).toBeGreaterThan(0);

    // 生成されたシナリオの詳細内容を確認する
    result.scenarios.forEach((scenario) => {
      expect(scenario).toHaveProperty("scenarioName");
      expect(scenario).toHaveProperty("staffAllocation");
      expect(scenario).toHaveProperty("expectedCapacity");
      expect(scenario).toHaveProperty("riskLevel");

      // シナリオの staffAllocation は計算された必要人員数と関連していること
      expect(scenario.staffAllocation).toBeGreaterThan(0);
      expect(Number.isInteger(scenario.staffAllocation)).toBe(true);

      // expectedCapacity（期待処理能力）が定義されていること
      expect(scenario.expectedCapacity).toBeGreaterThanOrEqual(monthlyEstimateCount);

      // riskLevel が妥当な値であること
      expect(["Low", "Medium", "High"]).toContain(scenario.riskLevel);
    });

    // 計算詳細に計算ロジックの根拠が記録されていることを確認
    expect(result.calculationDetails).toHaveProperty("formula");
    expect(result.calculationDetails.formula).toContain("margin");
    expect(result.calculationDetails).toHaveProperty("timestamp");
  });
});