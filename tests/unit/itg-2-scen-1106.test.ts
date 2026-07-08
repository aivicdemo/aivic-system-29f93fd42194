import { analyzeMonthlyCompletionStatus } from "../../src/logic/it-6-2-2-2";

describe("査定員別の判定精度・乖離パターン分析ダッシュボード", () => {
  test("SCEN-1106: 月次分析サイクル完了判定機能 - 月次分析完了までの時間が4営業日23時間59分の境界値で、完了と判定される", () => {
    // 月次分析サイクル開始時刻を設定
    // 2024年1月1日（月）9:00:00 を開始時刻とする
    const cycle_start_at = new Date("2024-01-01T09:00:00Z");

    // 現在時刻を開始時刻から4営業日23時間59分経過した時点に設定
    // 営業日: 2024-01-01(月), 2024-01-02(火), 2024-01-03(水), 2024-01-04(木)
    // 4営業日23時間59分 = 4日 + 23時間59分
    // 開始: 2024-01-01 09:00:00
    // 経過: 4日 23時間59分 = 119時間59分
    // 終了: 2024-01-06 08:59:00 (日本時間 UTC+0)
    const current_time_at = new Date("2024-01-06T08:59:00Z");

    // 月次分析サイクル完了判定機能を実行
    const result = analyzeMonthlyCompletionStatus({
      cycle_start_at,
      current_time_at,
      business_day_threshold_hours: 119 + 59 / 60, // 4営業日23時間59分
    });

    // 完了判定の結果を取得し、「完了」と判定されることを検証
    expect(result.is_completed).toBe(true);
    expect(result.status).toBe("completed");
    expect(result.elapsed_hours).toBeCloseTo(119.9833, 3);
  });
});