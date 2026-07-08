import { describe, test, expect } from '@jest/globals';

// SCEN-881: [edge] 査定部署別判定基準統一・策定支援機能 - 月次件数変動が前月比19.9%の場合、基準統一指示が発行されない
describe('IT-6-2-1-1: 査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化', () => {
  test('前月比19.9%の月次件数変動では基準統一指示が発行されない', async () => {
    const { shouldIssueBenchmarkUnificationDirective } = await import('../../src/logic/it-6-2-1-1');

    // 前月の件数
    const previous_month_count = 100;

    // 当月の件数：前月比19.9%増
    const current_month_count = Math.floor(previous_month_count * (1 + 0.199));
    // = Math.floor(100 * 1.199) = Math.floor(119.9) = 119

    // 月次件数変動率を計算
    const variation_rate = (current_month_count - previous_month_count) / previous_month_count;
    // = (119 - 100) / 100 = 19 / 100 = 0.19

    // 変動率が0.199（19.9%）未満なので、基準統一指示は発行されない
    const result = shouldIssueBenchmarkUnificationDirective({
      previous_month_count,
      current_month_count,
    });

    // 期待値：指示が発行されない（false）
    expect(result).toBe(false);
  });
});