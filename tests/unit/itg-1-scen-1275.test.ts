import { describe, test, expect, beforeEach } from '@jest/globals';
import { validateSalesData } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データ品質チェック - 許容範囲の境界値検証', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1275
  test('許容範囲の上限値・下限値と一致するデータは正常と判定される', () => {
    // 上限値のテストケース
    const salesDataAtUpperLimit = {
      appointmentCount: 50,
      contractCount: 30,
      customerResponseRate: 100,
      serviceType: 'standard',
      contactDate: '2024-01-15',
      qualityScore: 5
    };

    const upperLimitResult = validateSalesData(salesDataAtUpperLimit);

    expect(upperLimitResult.status).toBe('normal');
    expect(upperLimitResult.hasAnomalyFlag).toBe(false);
    expect(upperLimitResult.errors).toEqual([]);
    expect(upperLimitResult.notificationRequired).toBe(false);

    // 下限値のテストケース
    const salesDataAtLowerLimit = {
      appointmentCount: 0,
      contractCount: 0,
      customerResponseRate: 0,
      serviceType: 'standard',
      contactDate: '2024-01-15',
      qualityScore: 1
    };

    const lowerLimitResult = validateSalesData(salesDataAtLowerLimit);

    expect(lowerLimitResult.status).toBe('normal');
    expect(lowerLimitResult.hasAnomalyFlag).toBe(false);
    expect(lowerLimitResult.errors).toEqual([]);
    expect(lowerLimitResult.notificationRequired).toBe(false);

    // 上限値・下限値で異常フラグが立たないことを確認
    expect(upperLimitResult.hasAnomalyFlag).toBe(false);
    expect(lowerLimitResult.hasAnomalyFlag).toBe(false);

    // 通知が送信されていないことを確認
    expect(upperLimitResult.notificationRequired).toBe(false);
    expect(lowerLimitResult.notificationRequired).toBe(false);
  });
});