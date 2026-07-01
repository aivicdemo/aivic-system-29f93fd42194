import { describe, test, expect, beforeEach } from '@jest/globals';
import { compareStaffCalculationResults } from '../../src/logic/it-1781935279444-2-1-1';

describe('営業データ入力時の品質検証ルール定義・実行機能', () => {
  // SCEN-1000: [error] 複数スタッフ間の請求ルール理解度統一確認
  test('スタッフ間の算出結果が不一致の場合、差異が明確に識別・報告される', () => {
    // 同一の請求対象データ
    const customerId = 'CUST-001';
    const billingPeriod = '2024-01';
    const serviceType = 'SERVICE-A';

    // スタッフA、B、Cの算出結果
    const staffAResult = {
      staffId: 'STAFF-A',
      staffName: 'スタッフA',
      customerId,
      billingPeriod,
      serviceType,
      baseBillingAmount: 100000,
      taxAmount: 10000,
      handlingFeeAmount: 5000,
      totalAmount: 115000,
      calculatedAt: '2024-01-15T10:00:00Z'
    };

    const staffBResult = {
      staffId: 'STAFF-B',
      staffName: 'スタッフB',
      customerId,
      billingPeriod,
      serviceType,
      baseBillingAmount: 100000,
      taxAmount: 10000,
      handlingFeeAmount: 5500,
      totalAmount: 115500,
      calculatedAt: '2024-01-15T10:05:00Z'
    };

    const staffCResult = {
      staffId: 'STAFF-C',
      staffName: 'スタッフC',
      customerId,
      billingPeriod,
      serviceType,
      baseBillingAmount: 102000,
      taxAmount: 10200,
      handlingFeeAmount: 5000,
      totalAmount: 117200,
      calculatedAt: '2024-01-15T10:10:00Z'
    };

    const staffResults = [staffAResult, staffBResult, staffCResult];

    // システムの『スタッフ間算出結果比較機能』を実行
    const comparisonReport = compareStaffCalculationResults({
      customerId,
      billingPeriod,
      serviceType,
      staffResults
    });

    // 期待結果: (1) 差異のある項目が明確に識別される
    expect(comparisonReport.hasDiscrepancies).toBe(true);
    expect(comparisonReport.discrepancyItems).toContain('handlingFeeAmount');
    expect(comparisonReport.discrepancyItems).toContain('baseBillingAmount');
    expect(comparisonReport.discrepancyItems).toContain('taxAmount');
    expect(comparisonReport.discrepancyItems).toContain('totalAmount');

    // 期待結果: (2) 各スタッフの算出値が並べて表示される
    expect(comparisonReport.itemComparisons).toHaveLength(4);

    const handlingFeeComparison = comparisonReport.itemComparisons.find(
      (item) => item.itemName === 'handlingFeeAmount'
    );
    expect(handlingFeeComparison).toBeDefined();
    expect(handlingFeeComparison?.staffValues).toEqual({
      'STAFF-A': 5000,
      'STAFF-B': 5500,
      'STAFF-C': 5000
    });

    const baseBillingComparison = comparisonReport.itemComparisons.find(
      (item) => item.itemName === 'baseBillingAmount'
    );
    expect(baseBillingComparison).toBeDefined();
    expect(baseBillingComparison?.staffValues).toEqual({
      'STAFF-A': 100000,
      'STAFF-B': 100000,
      'STAFF-C': 102000
    });

    // 期待結果: (3) 差異金額と差異率が自動計算・表示される
    // 手数料の差異: 最大値5500 - 最小値5000 = 500
    expect(handlingFeeComparison?.maxValue).toBe(5500);
    expect(handlingFeeComparison?.minValue).toBe(5000);
    expect(handlingFeeComparison?.discrepancyAmount).toBe(500);
    expect(handlingFeeComparison?.discrepancyRate).toBe(10); // (500/5000)*100

    // 基本請求額の差異: 最大値102000 - 最小値100000 = 2000
    expect(baseBillingComparison?.maxValue).toBe(102000);
    expect(baseBillingComparison?.minValue).toBe(100000);
    expect(baseBillingComparison?.discrepancyAmount).toBe(2000);
    expect(baseBillingComparison?.discrepancyRate).toBe(2); // (2000/100000)*100

    // 合計金額の差異: 最大値117200 - 最小値115000 = 2200
    const totalAmountComparison = comparisonReport.itemComparisons.find(
      (item) => item.itemName === 'totalAmount'
    );
    expect(totalAmountComparison?.maxValue).toBe(117200);
    expect(totalAmountComparison?.minValue).toBe(115000);
    expect(totalAmountComparison?.discrepancyAmount).toBe(2200);
    expect(totalAmountComparison?.discrepancyRate).toBe(1.913); // 四捨五入

    // 期待結果: (4) 差異内容を含むレポートが自動生成される
    expect(comparisonReport.reportId).toBeDefined();
    expect(comparisonReport.reportId).toMatch(/^RPT-\d+$/);
    expect(comparisonReport.generatedAt).toBe('2024-01-15T10:15:00Z');
    expect(comparisonReport.reportContent).toBeDefined();
    expect(comparisonReport.reportContent).toContain('スタッフ間算出結果比較レポート');
    expect(comparisonReport.reportContent).toContain(customerId);
    expect(comparisonReport.reportContent).toContain(billingPeriod);

    // 期待結果: (5) 管理者へ速やかに通知される
    expect(comparisonReport.notificationStatus).toBe('sent');
    expect(comparisonReport.notifiedAt).toBe('2024-01-15T10:15:00Z');
    expect(comparisonReport.notificationRecipients).toEqual(['ADMIN-001', 'ADMIN-002']);
    expect(comparisonReport.notificationMethod).toBe('email');
  });
});