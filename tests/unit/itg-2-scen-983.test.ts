import { confirmMonthlyAggregationPeriod } from '../../src/logic/it-6-3-1';

describe('月次データ集計対象期間の確定', () => {
  // SCEN-983
  test('日次粒度での集計指定時、指定期間内のすべての営業日データが集計対象に含まれる', () => {
    // 入力: 2024年1月1日～2024年1月31日、粒度は日次、営業日のみ
    const input = {
      start_date: '2024-01-01',
      end_date: '2024-01-31',
      aggregation_granularity: 'daily',
      include_weekday_type: 'business_days_only',
    };

    const result = confirmMonthlyAggregationPeriod(input);

    // 期待値: 2024年1月の営業日は以下の通り
    // 1月1日(月)～1月31日(水)の31日間のうち、土日祝を除く営業日数は23日
    // 2024年1月の祝日: 1月1日(元日)、1月8日(成人の日)
    // したがって営業日は: 2, 3, 4, 5, 9, 10, 11, 12, 15, 16, 17, 18, 19, 22, 23, 24, 25, 26, 29, 30, 31 (21日)
    // ※ 2024年1月1日は月曜日で元日のため祝日、1月8日は月曜日で成人の日
    // 計算: 1-7(月-日)で月1,2,3,4,5,金,土 → 5営業日
    //      8-14(月-日)で祝,9,10,11,12,金,土 → 4営業日
    //      15-21(月-日)で月,火,水,木,金,土,日 → 5営業日
    //      22-28(月-日)で月,火,水,木,金,土,日 → 5営業日
    //      29-31(月-火-水) → 3営業日
    // 合計: 5+4+5+5+3 = 22営業日

    expect(result.aggregation_period.start_date).toBe('2024-01-01');
    expect(result.aggregation_period.end_date).toBe('2024-01-31');
    expect(result.aggregation_period.granularity).toBe('daily');
    expect(result.aggregation_period.weekday_filter).toBe('business_days_only');
    expect(result.target_data_count).toBe(22);
    expect(result.excluded_dates.length).toBeGreaterThan(0);
    expect(result.target_dates).toContain('2024-01-02');
    expect(result.target_dates).toContain('2024-01-03');
    expect(result.target_dates).toContain('2024-01-04');
    expect(result.target_dates).toContain('2024-01-05');
    expect(result.target_dates).toContain('2024-01-09');
    expect(result.target_dates).toContain('2024-01-10');
    expect(result.target_dates).toContain('2024-01-31');
    expect(result.excluded_dates).toContain('2024-01-01');
    expect(result.excluded_dates).toContain('2024-01-06');
    expect(result.excluded_dates).toContain('2024-01-07');
    expect(result.excluded_dates).toContain('2024-01-08');
    expect(result.excluded_dates).toContain('2024-01-13');
    expect(result.excluded_dates).toContain('2024-01-14');
    expect(result.status).toBe('confirmed');
  });
});