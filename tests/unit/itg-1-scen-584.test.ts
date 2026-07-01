import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import {
  confirmMonthlyAggregationPeriod,
  ConfirmMonthlyAggregationPeriodInput,
  ConfirmMonthlyAggregationPeriodOutput,
} from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  // SCEN-584: [edge] 月次集計対象期間の確定 - 月の最終日が28日の2月において、集計対象期間が正しく末日までで確定される
  test("should correctly confirm monthly aggregation period for February with 28 days in non-leap year", () => {
    // テスト環境のシステム日付を平年の2月28日に設定
    const currentDateNonLeap = new Date("2023-02-28T09:00:00Z");

    // 月次集計対象期間の確定機能を呼び出す
    const inputNonLeap: ConfirmMonthlyAggregationPeriodInput = {
      systemDate: currentDateNonLeap,
      targetYear: 2023,
      targetMonth: 2,
    };

    const resultNonLeap: ConfirmMonthlyAggregationPeriodOutput =
      confirmMonthlyAggregationPeriod(inputNonLeap);

    // 確定処理が正常に完了することを確認
    expect(resultNonLeap).toBeDefined();
    expect(resultNonLeap.status).toBe("completed");

    // 集計対象期間の開始日が2月1日であることをアサート
    expect(resultNonLeap.aggregationStartDate).toBe("2023-02-01");

    // 集計対象期間の終了日が2月28日であることをアサート
    expect(resultNonLeap.aggregationEndDate).toBe("2023-02-28");

    // 2月の日数が正しく28日として計算されていることをアサート
    expect(resultNonLeap.daysInMonth).toBe(28);

    // 確定された集計対象期間がデータベースに正しく保存されていることを確認
    expect(resultNonLeap.isPersisted).toBe(true);
    expect(resultNonLeap.persistenceTimestamp).toBeDefined();
  });

  test("should correctly confirm monthly aggregation period for February with 29 days in leap year", () => {
    // テスト環境のシステム日付を閏年の2月29日に設定
    const currentDateLeap = new Date("2024-02-29T09:00:00Z");

    // 月次集計対象期間の確定機能を呼び出す
    const inputLeap: ConfirmMonthlyAggregationPeriodInput = {
      systemDate: currentDateLeap,
      targetYear: 2024,
      targetMonth: 2,
    };

    const resultLeap: ConfirmMonthlyAggregationPeriodOutput =
      confirmMonthlyAggregationPeriod(inputLeap);

    // 確定処理が正常に完了することを確認
    expect(resultLeap).toBeDefined();
    expect(resultLeap.status).toBe("completed");

    // 集計対象期間の開始日が2月1日であることをアサート
    expect(resultLeap.aggregationStartDate).toBe("2024-02-01");

    // 集計対象期間の終了日が2月29日であることをアサート
    expect(resultLeap.aggregationEndDate).toBe("2024-02-29");

    // 2月の日数が正しく29日として計算されていることをアサート
    expect(resultLeap.daysInMonth).toBe(29);

    // 確定された集計対象期間がデータベースに正しく保存されていることを確認
    expect(resultLeap.isPersisted).toBe(true);
    expect(resultLeap.persistenceTimestamp).toBeDefined();
  });

  test("should validate that aggregation period is correctly stored in database for February non-leap year", () => {
    const currentDateNonLeap = new Date("2023-02-28T09:00:00Z");

    const inputNonLeap: ConfirmMonthlyAggregationPeriodInput = {
      systemDate: currentDateNonLeap,
      targetYear: 2023,
      targetMonth: 2,
    };

    const resultNonLeap: ConfirmMonthlyAggregationPeriodOutput =
      confirmMonthlyAggregationPeriod(inputNonLeap);

    // 集計対象期間がデータベースに正しく保存されたか確認
    expect(resultNonLeap.persistedAggregationId).toBeDefined();
    expect(resultNonLeap.persistedAggregationId).toMatch(/^agg_2023_02_/);

    // 保存されたレコードの内容が正確であることを確認
    expect(resultNonLeap.persistedStartDate).toBe("2023-02-01");
    expect(resultNonLeap.persistedEndDate).toBe("2023-02-28");
    expect(resultNonLeap.persistedDaysCount).toBe(28);
  });

  test("should validate that aggregation period is correctly stored in database for February leap year", () => {
    const currentDateLeap = new Date("2024-02-29T09:00:00Z");

    const inputLeap: ConfirmMonthlyAggregationPeriodInput = {
      systemDate: currentDateLeap,
      targetYear: 2024,
      targetMonth: 2,
    };

    const resultLeap: ConfirmMonthlyAggregationPeriodOutput =
      confirmMonthlyAggregationPeriod(inputLeap);

    // 集計対象期間がデータベースに正しく保存されたか確認
    expect(resultLeap.persistedAggregationId).toBeDefined();
    expect(resultLeap.persistedAggregationId).toMatch(/^agg_2024_02_/);

    // 保存されたレコードの内容が正確であることを確認
    expect(resultLeap.persistedStartDate).toBe("2024-02-01");
    expect(resultLeap.persistedEndDate).toBe("2024-02-29");
    expect(resultLeap.persistedDaysCount).toBe(29);
  });

  test("should throw error when invalid target month is provided", () => {
    const currentDate = new Date("2023-02-28T09:00:00Z");

    const invalidInput: ConfirmMonthlyAggregationPeriodInput = {
      systemDate: currentDate,
      targetYear: 2023,
      targetMonth: 13,
    };

    expect(() => confirmMonthlyAggregationPeriod(invalidInput)).toThrow(/月/);
  });

  test("should throw error when invalid target year is provided", () => {
    const currentDate = new Date("2023-02-28T09:00:00Z");

    const invalidInput: ConfirmMonthlyAggregationPeriodInput = {
      systemDate: currentDate,
      targetYear: 9999,
      targetMonth: 2,
    };

    expect(() => confirmMonthlyAggregationPeriod(invalidInput)).toThrow(/年/);
  });
});