import { describe, it, expect } from '@jest/globals';
import { validateAggregationPeriod } from '../../src/logic/it-1-1-1';

describe('営業成果データの自動検証ルール定義と異常検出機能', () => {
  // SCEN-591: [error] 月次集計期間確定機能 - 集計対象期間未設定の場合にエラーが発生する
  it('集計対象期間が未設定のとき、エラーをスロー', () => {
    const input = {
      period_start_date: null,
      period_end_date: null,
      aggregation_target_count: 0,
    };

    expect(() => validateAggregationPeriod(input)).toThrow(/集計対象期間/);
  });

  it('集計対象期間の開始日のみ設定のとき、エラーをスロー', () => {
    const input = {
      period_start_date: '2024-01-01',
      period_end_date: null,
      aggregation_target_count: 0,
    };

    expect(() => validateAggregationPeriod(input)).toThrow(/集計対象期間/);
  });

  it('集計対象期間の終了日のみ設定のとき、エラーをスロー', () => {
    const input = {
      period_start_date: null,
      period_end_date: '2024-01-31',
      aggregation_target_count: 0,
    };

    expect(() => validateAggregationPeriod(input)).toThrow(/集計対象期間/);
  });

  it('集計対象期間が正常に設定されたとき、成功ステータスを返す', () => {
    const input = {
      period_start_date: '2024-01-01',
      period_end_date: '2024-01-31',
      aggregation_target_count: 150,
    };

    const result = validateAggregationPeriod(input);

    expect(result).toEqual({
      status: 'success',
      is_valid: true,
      period_start_date: '2024-01-01',
      period_end_date: '2024-01-31',
      aggregation_target_count: 150,
      validated_at: expect.any(String),
    });
  });

  it('集計対象期間の開始日が終了日より後のとき、エラーをスロー', () => {
    const input = {
      period_start_date: '2024-01-31',
      period_end_date: '2024-01-01',
      aggregation_target_count: 50,
    };

    expect(() => validateAggregationPeriod(input)).toThrow(/集計対象期間/);
  });

  it('集計対象期間が正常に設定され、集計対象データが存在するとき、検証成功を返す', () => {
    const input = {
      period_start_date: '2024-02-01',
      period_end_date: '2024-02-29',
      aggregation_target_count: 280,
    };

    const result = validateAggregationPeriod(input);

    expect(result.is_valid).toBe(true);
    expect(result.status).toBe('success');
    expect(result.aggregation_target_count).toBe(280);
  });
});