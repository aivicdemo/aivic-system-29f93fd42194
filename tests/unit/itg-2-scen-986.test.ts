import { describe, it, expect, beforeEach } from '@jest/globals';
import { confirmMonthlyAggregationPeriod } from '../../src/logic/it-6-3-1';

describe('月次データ集計対象期間の確定 - 集計粒度デフォルト適用', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-986
  it('集計粒度が指定されていない場合、デフォルト値（月次）が適用される', () => {
    const input = {
      startDate: '2024-01-01',
      endDate: '2024-03-31',
      granularity: undefined,
    };

    const result = confirmMonthlyAggregationPeriod(input);

    expect(result).toEqual({
      startDate: '2024-01-01',
      endDate: '2024-03-31',
      granularity: 'monthly',
      aggregationPeriods: [
        {
          periodStart: '2024-01-01',
          periodEnd: '2024-01-31',
          label: '2024年1月',
        },
        {
          periodStart: '2024-02-01',
          periodEnd: '2024-02-29',
          label: '2024年2月',
        },
        {
          periodStart: '2024-03-01',
          periodEnd: '2024-03-31',
          label: '2024年3月',
        },
      ],
      appliedGranularity: 'monthly',
      displayGranularityLabel: '粒度：月次',
    });

    expect(result.granularity).toBe('monthly');
    expect(result.appliedGranularity).toBe('monthly');
    expect(result.displayGranularityLabel).toBe('粒度：月次');
    expect(result.aggregationPeriods.length).toBe(3);
    expect(result.aggregationPeriods[0].periodStart).toBe('2024-01-01');
    expect(result.aggregationPeriods[0].periodEnd).toBe('2024-01-31');
    expect(result.aggregationPeriods[1].periodStart).toBe('2024-02-01');
    expect(result.aggregationPeriods[1].periodEnd).toBe('2024-02-29');
    expect(result.aggregationPeriods[2].periodStart).toBe('2024-03-01');
    expect(result.aggregationPeriods[2].periodEnd).toBe('2024-03-31');
  });

  it('集計粒度が null で指定された場合も、デフォルト値（月次）が適用される', () => {
    const input = {
      startDate: '2024-06-01',
      endDate: '2024-06-30',
      granularity: null,
    };

    const result = confirmMonthlyAggregationPeriod(input);

    expect(result.granularity).toBe('monthly');
    expect(result.appliedGranularity).toBe('monthly');
    expect(result.displayGranularityLabel).toBe('粒度：月次');
    expect(result.aggregationPeriods.length).toBe(1);
    expect(result.aggregationPeriods[0].periodStart).toBe('2024-06-01');
    expect(result.aggregationPeriods[0].periodEnd).toBe('2024-06-30');
  });

  it('明示的に集計粒度が指定された場合、その値が優先される', () => {
    const input = {
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      granularity: 'daily',
    };

    const result = confirmMonthlyAggregationPeriod(input);

    expect(result.granularity).toBe('daily');
    expect(result.appliedGranularity).toBe('daily');
    expect(result.displayGranularityLabel).toBe('粒度：日次');
  });

  it('開始日と終了日が同一月の場合、1つの集計期間が生成される', () => {
    const input = {
      startDate: '2024-05-10',
      endDate: '2024-05-25',
      granularity: undefined,
    };

    const result = confirmMonthlyAggregationPeriod(input);

    expect(result.aggregationPeriods.length).toBe(1);
    expect(result.aggregationPeriods[0].periodStart).toBe('2024-05-01');
    expect(result.aggregationPeriods[0].periodEnd).toBe('2024-05-31');
    expect(result.aggregationPeriods[0].label).toBe('2024年5月');
  });

  it('開始日と終了日が複数月にまたがる場合、複数の集計期間が生成される', () => {
    const input = {
      startDate: '2024-01-15',
      endDate: '2024-03-20',
      granularity: undefined,
    };

    const result = confirmMonthlyAggregationPeriod(input);

    expect(result.aggregationPeriods.length).toBe(3);
    expect(result.aggregationPeriods[0].label).toBe('2024年1月');
    expect(result.aggregationPeriods[1].label).toBe('2024年2月');
    expect(result.aggregationPeriods[2].label).toBe('2024年3月');
  });

  it('閏年の2月を含む場合、正しく集計期間が生成される', () => {
    const input = {
      startDate: '2024-01-01',
      endDate: '2024-02-29',
      granularity: undefined,
    };

    const result = confirmMonthlyAggregationPeriod(input);

    expect(result.aggregationPeriods.length).toBe(2);
    expect(result.aggregationPeriods[1].periodEnd).toBe('2024-02-29');
  });

  it('集計粒度がデフォルト値で適用されない場合、エラーをスロー', () => {
    const input = {
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      granularity: undefined,
      forceError: true,
    };

    expect(() => confirmMonthlyAggregationPeriod(input)).toThrow(/デフォルト値適用/);
  });

  it('開始日が終了日より後の場合、エラーをスロー', () => {
    const input = {
      startDate: '2024-03-31',
      endDate: '2024-01-01',
      granularity: undefined,
    };

    expect(() => confirmMonthlyAggregationPeriod(input)).toThrow(/期間/);
  });

  it('集計対象期間が確定し、システムが適用した集計粒度の値が返される', () => {
    const input = {
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      granularity: undefined,
    };

    const result = confirmMonthlyAggregationPeriod(input);

    expect(result.aggregationPeriods.length).toBe(12);
    expect(result.displayGranularityLabel).toBe('粒度：月次');
    expect(result.aggregationPeriods.every((p) => p.label.includes('年'))).toBe(
      true,
    );
  });
});