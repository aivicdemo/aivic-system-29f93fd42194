import { determineMonthlyAggregationPeriod } from '../../src/logic/it-6-3-1';

describe('査定判定ロジックの適用履歴と根拠の記録・検索機能', () => {
  // SCEN-982
  test('月次データ集計対象期間の確定 - 月初に翌月の人員配置計画立案トリガーで、当月1日から末日までが集計対象期間として確定される', () => {
    // 前提: システムで月初日（1日）になったことを確認する
    const trigger_date = new Date('2024-02-01T09:00:00Z');
    
    // 翌月の人員配置計画立案トリガーを実行する → 月次データ集計対象期間の確定処理が自動的に開始される
    const result = determineMonthlyAggregationPeriod({
      trigger_date: trigger_date,
      trigger_type: 'monthly_personnel_planning'
    });

    // 確定された集計対象期間を取得する
    expect(result).toBeDefined();
    expect(result).toHaveProperty('aggregation_period_start');
    expect(result).toHaveProperty('aggregation_period_end');
    expect(result).toHaveProperty('aggregation_target_month');

    // 集計対象期間の開始日が当月1日であることを検証する
    // 2024年2月1日が trigger_date なので、集計対象期間は2024年2月1日～2月29日
    const expected_start = new Date('2024-02-01');
    const expected_end = new Date('2024-02-29');

    expect(result.aggregation_period_start).toEqual(expected_start);
    expect(result.aggregation_period_end).toEqual(expected_end);
    expect(result.aggregation_target_month).toBe('2024-02');

    // 成功ケース：入力日が月初でない場合、月初に正規化される
    const mid_month_trigger = new Date('2024-03-15T14:30:00Z');
    const result_mid = determineMonthlyAggregationPeriod({
      trigger_date: mid_month_trigger,
      trigger_type: 'monthly_personnel_planning'
    });

    expect(result_mid.aggregation_period_start).toEqual(new Date('2024-03-01'));
    expect(result_mid.aggregation_period_end).toEqual(new Date('2024-03-31'));
    expect(result_mid.aggregation_target_month).toBe('2024-03');

    // 境界値テスト：年末月（12月）
    const year_end_trigger = new Date('2024-12-01T09:00:00Z');
    const result_year_end = determineMonthlyAggregationPeriod({
      trigger_date: year_end_trigger,
      trigger_type: 'monthly_personnel_planning'
    });

    expect(result_year_end.aggregation_period_start).toEqual(new Date('2024-12-01'));
    expect(result_year_end.aggregation_period_end).toEqual(new Date('2024-12-31'));
    expect(result_year_end.aggregation_target_month).toBe('2024-12');

    // 境界値テスト：閏年2月
    const leap_year_trigger = new Date('2024-02-01T09:00:00Z');
    const result_leap = determineMonthlyAggregationPeriod({
      trigger_date: leap_year_trigger,
      trigger_type: 'monthly_personnel_planning'
    });

    expect(result_leap.aggregation_period_start).toEqual(new Date('2024-02-01'));
    expect(result_leap.aggregation_period_end).toEqual(new Date('2024-02-29'));

    // エラーケース：trigger_type が不正な場合
    expect(() => {
      determineMonthlyAggregationPeriod({
        trigger_date: trigger_date,
        trigger_type: 'invalid_trigger'
      });
    }).toThrow(/トリガー/);

    // エラーケース：trigger_date が null または undefined の場合
    expect(() => {
      determineMonthlyAggregationPeriod({
        trigger_date: null as any,
        trigger_type: 'monthly_personnel_planning'
      });
    }).toThrow(/日付/);

    // 期待結果の総合検証
    expect(result.aggregation_period_start.getDate()).toBe(1);
    expect(result.aggregation_period_end.getDate()).toBe(29);
    expect(result.aggregation_period_start.getMonth()).toBe(result.aggregation_period_end.getMonth());
    expect(result.aggregation_period_start.getFullYear()).toBe(result.aggregation_period_end.getFullYear());
  });
});