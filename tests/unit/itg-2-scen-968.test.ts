import { calculateSupportRequestNecessity } from "../../src/logic/it-6-2-1-1";

describe("査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  // SCEN-968: [edge] 翌月応援要請の必要性判定・配置シナリオ選択 - 翌月繁忙度予測が現員配置処理能力の95%以下の場合、応援要請不要と判定される
  test("翌月繁忙度予測が現員配置処理能力の95%以下の場合、応援要請不要と判定される", () => {
    const currentMonthCapacity = 100; // 現員配置処理能力: 100件/月
    const nextMonthForecast = 95; // 翌月繁忙度予測: 95件/月

    const result = calculateSupportRequestNecessity({
      currentMonthCapacity,
      nextMonthForecast,
    });

    // 繁忙度 = 95 ÷ 100 = 0.95 (95%)
    const expectedBusyRatio = 0.95;

    expect(result.supportRequestRequired).toBe(false);
    expect(result.busyRatio).toBe(expectedBusyRatio);
    expect(result.reason).toBe("繁忙度95%は処理能力範囲内");
    expect(result.judgmentDetail).toEqual({
      forecastCapacityUsage: 95,
      availableCapacity: 100,
      utilizationPercentage: 95,
      supportRequired: false,
    });
  });
});