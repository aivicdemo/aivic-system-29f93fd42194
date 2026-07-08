import { describe, test, expect } from '@jest/globals';
import { calculateMonthlyProcessingCapacity } from '../../src/logic/it-6-2-1-1';

describe('査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化', () => {
  test('SCEN-953: 全データが外れ値として判定される極端なケースでエラーを返す', () => {
    // テストデータ: すべてのデータポイントが統計的外れ値判定基準（平均値±3σ以上）に該当
    const processingTimeDataSet = [
      {
        assessorId: 'A001',
        processingTimeMinutes: 1000,
        processingDatetime: new Date('2024-01-01T09:00:00Z'),
        workType: '建築',
        priceRangeCode: 'P1',
      },
      {
        assessorId: 'A002',
        processingTimeMinutes: 1050,
        processingDatetime: new Date('2024-01-02T09:00:00Z'),
        workType: '建築',
        priceRangeCode: 'P1',
      },
      {
        assessorId: 'A003',
        processingTimeMinutes: 1100,
        processingDatetime: new Date('2024-01-03T09:00:00Z'),
        workType: '建築',
        priceRangeCode: 'P1',
      },
      {
        assessorId: 'A004',
        processingTimeMinutes: 2000,
        processingDatetime: new Date('2024-01-04T09:00:00Z'),
        workType: '建築',
        priceRangeCode: 'P1',
      },
      {
        assessorId: 'A005',
        processingTimeMinutes: 2050,
        processingDatetime: new Date('2024-01-05T09:00:00Z'),
        workType: '建築',
        priceRangeCode: 'P1',
      },
    ];

    // 関数が適切なエラーを返すことを検証
    expect(() =>
      calculateMonthlyProcessingCapacity({
        processingDataSet: processingTimeDataSet,
        outlierThreshold: 3,
        aggregationPeriodStart: new Date('2024-01-01T00:00:00Z'),
        aggregationPeriodEnd: new Date('2024-01-31T23:59:59Z'),
      })
    ).toThrow(/データ不足/);
  });
});