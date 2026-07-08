import { calculateDeviationRate, judgeNeedForPlanRevision } from "../../src/logic/it-6-2-2-2";

describe("査定員別の判定精度・乖離パターン分析ダッシュボード", () => {
  // SCEN-974: [normal] 月次実績と配置計画の乖離判定・修正要否自動判定 - 実績乖離率が±10%以内の場合、配置計画修正不要と判定される
  test("月次実績と配置計画の乖離率が±10%以内の場合、配置計画修正不要と判定される", () => {
    // 前提: 月次実績データと配置計画データが準備されている
    const monthly_actual_count = 100;
    const planned_count = 100;

    // 手順1: 乖離率を計算する（|月次実績 - 配置計画| / 配置計画 × 100）
    const deviation_rate = calculateDeviationRate({
      actual_count: monthly_actual_count,
      planned_count: planned_count,
    });

    // 期待結果: 乖離率が0%（0件の乖離）
    expect(deviation_rate).toBe(0);

    // 手順2: 配置計画修正要否判定機能を実行する
    const revision_needed = judgeNeedForPlanRevision({
      deviation_rate: deviation_rate,
      threshold_percentage: 10,
    });

    // 期待結果: 乖離率が±10%以内の場合、配置計画修正不要と判定される
    expect(revision_needed).toBe(false);

    // 追加検証: 乖離率が+5%の場合（計画100件に対し実績105件）
    const deviation_rate_positive = calculateDeviationRate({
      actual_count: 105,
      planned_count: 100,
    });

    expect(deviation_rate_positive).toBe(5);

    const revision_needed_positive = judgeNeedForPlanRevision({
      deviation_rate: deviation_rate_positive,
      threshold_percentage: 10,
    });

    expect(revision_needed_positive).toBe(false);

    // 追加検証: 乖離率が-8%の場合（計画100件に対し実績92件）
    const deviation_rate_negative = calculateDeviationRate({
      actual_count: 92,
      planned_count: 100,
    });

    expect(deviation_rate_negative).toBe(-8);

    const revision_needed_negative = judgeNeedForPlanRevision({
      deviation_rate: deviation_rate_negative,
      threshold_percentage: 10,
    });

    expect(revision_needed_negative).toBe(false);

    // 境界値検証: 乖離率がちょうど+10%の場合（計画100件に対し実績110件）
    const deviation_rate_boundary_positive = calculateDeviationRate({
      actual_count: 110,
      planned_count: 100,
    });

    expect(deviation_rate_boundary_positive).toBe(10);

    const revision_needed_boundary_positive = judgeNeedForPlanRevision({
      deviation_rate: deviation_rate_boundary_positive,
      threshold_percentage: 10,
    });

    expect(revision_needed_boundary_positive).toBe(false);

    // 境界値検証: 乖離率がちょうど-10%の場合（計画100件に対し実績90件）
    const deviation_rate_boundary_negative = calculateDeviationRate({
      actual_count: 90,
      planned_count: 100,
    });

    expect(deviation_rate_boundary_negative).toBe(-10);

    const revision_needed_boundary_negative = judgeNeedForPlanRevision({
      deviation_rate: deviation_rate_boundary_negative,
      threshold_percentage: 10,
    });

    expect(revision_needed_boundary_negative).toBe(false);

    // エラーケース検証: 計画件数が0の場合、エラーが発生する
    expect(() =>
      calculateDeviationRate({
        actual_count: 100,
        planned_count: 0,
      })
    ).toThrow(/計画件数/);

    // エラーケース検証: 乖離率が±10%を超える場合、配置計画修正が必要と判定される
    const deviation_rate_over = 12;
    const revision_needed_over = judgeNeedForPlanRevision({
      deviation_rate: deviation_rate_over,
      threshold_percentage: 10,
    });

    expect(revision_needed_over).toBe(true);

    const deviation_rate_under = -12;
    const revision_needed_under = judgeNeedForPlanRevision({
      deviation_rate: deviation_rate_under,
      threshold_percentage: 10,
    });

    expect(revision_needed_under).toBe(true);
  });
});