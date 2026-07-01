import { defineMonthlyAggregationPeriod } from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  // SCEN-582
  test("月次集計対象期間の確定 - 月次締め日が正しく設定されている場合、その日付から逆算して集計対象期間が正確に確定される", () => {
    // 前提: 月次締め日が月末日（2024年1月31日）に設定されている
    const closingDate = new Date("2024-01-31T00:00:00Z");

    // 実行: 集計対象期間の確定処理
    const result = defineMonthlyAggregationPeriod({
      closingDate,
    });

    // 期待値の計算
    // 集計対象期間の開始日 = 前月末日の翌日（2023年12月31日の翌日 = 2024年1月1日）
    const expectedStartDate = new Date("2024-01-01T00:00:00Z");
    // 集計対象期間の終了日 = 設定された締め日（2024年1月31日）
    const expectedEndDate = new Date("2024-01-31T00:00:00Z");

    // 検証: 開始日と終了日が正確に計算されている
    expect(result.startDate).toEqual(expectedStartDate);
    expect(result.endDate).toEqual(expectedEndDate);

    // 検証: 確定された期間がシステムに記録されている
    expect(result.status).toBe("confirmed");

    // 検証: 集計対象期間の日数が正確（1月1日～1月31日 = 31日）
    const dayCount =
      (result.endDate.getTime() - result.startDate.getTime()) /
        (1000 * 60 * 60 * 24) +
      1;
    expect(dayCount).toBe(31);

    // 検証: 期間ID が生成されている
    expect(result.periodId).toBeDefined();
    expect(typeof result.periodId).toBe("string");
    expect(result.periodId.length).toBeGreaterThan(0);

    // 検証: 集計対象期間が記録されたタイムスタンプが存在
    expect(result.confirmedAt).toBeDefined();
    expect(result.confirmedAt instanceof Date).toBe(true);

    // 検証: 集計対象データの抽出条件が確定している
    expect(result.filterCriteria).toEqual({
      startDate: expectedStartDate,
      endDate: expectedEndDate,
      inclusive: true,
    });
  });
});