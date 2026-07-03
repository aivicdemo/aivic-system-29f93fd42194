import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { calculateBillingAmount } from '../../src/logic/it-1781935279444-2-1-1';

describe('営業データ入力時の品質検証ルール定義・実行機能', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-979: [normal] 請求額算出・検証機能 - 複数スタッフの請求額算出結果が同一基準で完全に一致する
  test('複数スタッフの請求額算出結果が同一基準で完全に一致する', () => {
    // 共通の売上条件を定義
    const commonSalesData = {
      appointmentCount: 12,
      contractCount: 5,
      serviceType: 'standard',
      saleAmount: 500000,
    };

    // 手数料率と割引条件を定義
    const billingRules = {
      commissionRate: 0.1,
      discountRate: 0.05,
      taxRate: 0.1,
      minimumBillingAmount: 10000,
    };

    // スタッフ 1 の請求額計算
    const staff1Result = calculateBillingAmount({
      staffId: 'staff-001',
      salesData: commonSalesData,
      billingRules,
      executionDate: new Date('2024-01-15T09:00:00Z'),
    });

    // スタッフ 2 の請求額計算 (同一条件)
    const staff2Result = calculateBillingAmount({
      staffId: 'staff-002',
      salesData: commonSalesData,
      billingRules,
      executionDate: new Date('2024-01-15T09:00:00Z'),
    });

    // スタッフ 3 の請求額計算 (同一条件)
    const staff3Result = calculateBillingAmount({
      staffId: 'staff-003',
      salesData: commonSalesData,
      billingRules,
      executionDate: new Date('2024-01-15T09:00:00Z'),
    });

    // 基本計算ロジック: (売上額 × 手数料率 - 割引額) × (1 + 税率)
    // 割引額 = 売上額 × 割引率
    // = (500000 × 0.1 - 500000 × 0.05) × (1 + 0.1)
    // = (50000 - 25000) × 1.1
    // = 25000 × 1.1
    // = 27500
    const expectedBillingAmount = 27500;

    // 複数スタッフの結果が完全に一致することを検証
    expect(staff1Result.billingAmount).toBe(expectedBillingAmount);
    expect(staff2Result.billingAmount).toBe(expectedBillingAmount);
    expect(staff3Result.billingAmount).toBe(expectedBillingAmount);

    // 各スタッフの詳細情報が正確に記録されていることを検証
    expect(staff1Result.staffId).toBe('staff-001');
    expect(staff2Result.staffId).toBe('staff-002');
    expect(staff3Result.staffId).toBe('staff-003');

    // 計算根拠の詳細が各スタッフで一致していることを検証
    expect(staff1Result.calculationDetails.commission).toBe(50000); // 500000 × 0.1
    expect(staff2Result.calculationDetails.commission).toBe(50000);
    expect(staff3Result.calculationDetails.commission).toBe(50000);

    expect(staff1Result.calculationDetails.discount).toBe(25000); // 500000 × 0.05
    expect(staff2Result.calculationDetails.discount).toBe(25000);
    expect(staff3Result.calculationDetails.discount).toBe(25000);

    expect(staff1Result.calculationDetails.taxAmount).toBe(2500); // 25000 × 0.1
    expect(staff2Result.calculationDetails.taxAmount).toBe(2500);
    expect(staff3Result.calculationDetails.taxAmount).toBe(2500);

    // 最小請求額と比較
    expect(staff1Result.billingAmount).toBeGreaterThanOrEqual(billingRules.minimumBillingAmount);
    expect(staff2Result.billingAmount).toBeGreaterThanOrEqual(billingRules.minimumBillingAmount);
    expect(staff3Result.billingAmount).toBeGreaterThanOrEqual(billingRules.minimumBillingAmount);

    // タイムスタンプと計算ルールバージョンの一貫性を検証
    expect(staff1Result.executionTimestamp).toEqual(new Date('2024-01-15T09:00:00Z'));
    expect(staff2Result.executionTimestamp).toEqual(new Date('2024-01-15T09:00:00Z'));
    expect(staff3Result.executionTimestamp).toEqual(new Date('2024-01-15T09:00:00Z'));

    expect(staff1Result.billingRuleVersion).toBe(staff2Result.billingRuleVersion);
    expect(staff2Result.billingRuleVersion).toBe(staff3Result.billingRuleVersion);

    // エラーやログが存在しないことを検証
    expect(staff1Result.errors).toEqual([]);
    expect(staff2Result.errors).toEqual([]);
    expect(staff3Result.errors).toEqual([]);

    expect(staff1Result.warnings).toEqual([]);
    expect(staff2Result.warnings).toEqual([]);
    expect(staff3Result.warnings).toEqual([]);

    // ステータスが成功であることを検証
    expect(staff1Result.status).toBe('success');
    expect(staff2Result.status).toBe('success');
    expect(staff3Result.status).toBe('success');

    // 複数回実行の一貫性検証 (同一スタッフで再度実行)
    const staff1ResultRetry = calculateBillingAmount({
      staffId: 'staff-001',
      salesData: commonSalesData,
      billingRules,
      executionDate: new Date('2024-01-15T09:00:00Z'),
    });

    // 同一スタッフの再実行でも同じ結果が得られることを検証
    expect(staff1ResultRetry.billingAmount).toBe(expectedBillingAmount);
    expect(staff1ResultRetry.calculationDetails.commission).toBe(50000);
    expect(staff1ResultRetry.calculationDetails.discount).toBe(25000);
    expect(staff1ResultRetry.calculationDetails.taxAmount).toBe(2500);
    expect(staff1ResultRetry.status).toBe('success');
    expect(staff1ResultRetry.errors).toEqual([]);
    expect(staff1ResultRetry.warnings).toEqual([]);
  });
});