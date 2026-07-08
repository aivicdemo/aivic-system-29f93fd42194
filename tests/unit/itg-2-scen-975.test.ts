import { calculateDeviationRate, shouldReviseAllocationPlan } from "../../src/logic/it-6-2-2-2";

describe("査定員別の判定精度・乖離パターン分析ダッシュボード", () => {
  test("SCEN-975: 月次実績と配置計画の乖離判定・修正要否自動判定 - 実績乖離率がプラス15%の場合、配置計画修正が必須と判定される", () => {
    // テストデータ設定：月次実績と配置計画の基準値を設定
    const baseline_count = 100; // 配置計画の基準査定件数
    const baseline_hours = 500; // 配置計画の基準処理時間（時間）
    const baseline_precision = 0.95; // 配置計画の基準精度指標（95%）

    // 月次実績の値を配置計画の基準値の115%（プラス15%）の値に設定
    const actual_count = Math.round(baseline_count * 1.15); // 115件
    const actual_hours = Math.round(baseline_hours * 1.15); // 575時間
    const actual_precision = baseline_precision * 0.95; // 精度が5%低下

    // 入力データ構造
    const monthly_plan = {
      baseline_count: baseline_count,
      baseline_hours: baseline_hours,
      baseline_precision: baseline_precision,
    };

    const monthly_actual = {
      actual_count: actual_count,
      actual_hours: actual_hours,
      actual_precision: actual_precision,
    };

    // 乖離判定・修正要否自動判定機能を実行
    const deviation_rate = calculateDeviationRate(monthly_plan, monthly_actual);

    // 期待値：乖離率が15%（0.15）であることを確認
    expect(deviation_rate).toBe(0.15);

    // 修正要否フラグが『修正必須』（true）であることを確認
    const revision_required = shouldReviseAllocationPlan(deviation_rate);
    expect(revision_required).toBe(true);
  });
});