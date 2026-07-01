import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { confirmMonthlyAggregationPeriod } from '../../src/logic/it-1-1-1';

describe('営業成果データの自動検証ルール定義と異常検出機能', () => {
  // SCEN-583: [error] 月次集計対象期間の確定 - 月次締め日が未設定の場合、エラーが発生して集計対象期間の確定が失敗する
  test('月次締め日が未設定の場合、適切なエラーが発生する', () => {
    const systemConfig = {
      monthlyClosingDay: null,
      fiscalYearStartMonth: 1,
    };

    expect(() => {
      confirmMonthlyAggregationPeriod(systemConfig);
    }).toThrow(/月次締め日/);
  });

  test('月次締め日が0以下の場合、適切なエラーが発生する', () => {
    const systemConfig = {
      monthlyClosingDay: 0,
      fiscalYearStartMonth: 1,
    };

    expect(() => {
      confirmMonthlyAggregationPeriod(systemConfig);
    }).toThrow(/月次締め日/);
  });

  test('月次締め日が32以上の場合、適切なエラーが発生する', () => {
    const systemConfig = {
      monthlyClosingDay: 32,
      fiscalYearStartMonth: 1,
    };

    expect(() => {
      confirmMonthlyAggregationPeriod(systemConfig);
    }).toThrow(/月次締め日/);
  });

  test('月次締め日が正常に設定されている場合、集計対象期間が確定される', () => {
    const systemConfig = {
      monthlyClosingDay: 25,
      fiscalYearStartMonth: 1,
    };
    const currentDate = new Date('2024-12-10T09:00:00Z');

    const result = confirmMonthlyAggregationPeriod(systemConfig, currentDate);

    expect(result).toEqual({
      aggregationStartDate: new Date('2024-11-26T00:00:00Z'),
      aggregationEndDate: new Date('2024-12-25T23:59:59Z'),
      status: 'confirmed',
      closingDay: 25,
    });
  });

  test('月次締め日が月末日の場合、集計対象期間が正確に確定される', () => {
    const systemConfig = {
      monthlyClosingDay: 31,
      fiscalYearStartMonth: 1,
    };
    const currentDate = new Date('2024-11-15T14:30:00Z');

    const result = confirmMonthlyAggregationPeriod(systemConfig, currentDate);

    expect(result).toEqual({
      aggregationStartDate: new Date('2024-10-01T00:00:00Z'),
      aggregationEndDate: new Date('2024-10-31T23:59:59Z'),
      status: 'confirmed',
      closingDay: 31,
    });
  });

  test('月次締め日が月初の場合、集計対象期間が正確に確定される', () => {
    const systemConfig = {
      monthlyClosingDay: 1,
      fiscalYearStartMonth: 1,
    };
    const currentDate = new Date('2024-01-05T10:00:00Z');

    const result = confirmMonthlyAggregationPeriod(systemConfig, currentDate);

    expect(result).toEqual({
      aggregationStartDate: new Date('2023-12-02T00:00:00Z'),
      aggregationEndDate: new Date('2024-01-01T23:59:59Z'),
      status: 'confirmed',
      closingDay: 1,
    });
  });
});