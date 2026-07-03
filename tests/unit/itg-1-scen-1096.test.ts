import { describe, test, expect } from '@jest/globals';
import { validateSalesDataQuality } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データ品質検証 - 金額妥当性検証機能', () => {
  // SCEN-1096: [edge] バックオフィス業務データ品質検証機能 - 金額の妥当性検証で上限値に達した異常値が検出される
  test('上限値を超える異常な金額値が正確に検出され、エラーメッセージが表示され、当該データが請求自動化処理から除外されること', () => {
    // 前提: 営業システムに記録されたデータに対して品質検証が実行される状態
    // トリガー: 上限値を超える金額データを含むテストデータで検証プロセスを実行
    
    const salesData = {
      customerId: 'CUST001',
      serviceType: 'PREMIUM',
      appointmentCount: 5,
      contractAmount: 1500000,
      discountRate: 0.1,
      finalAmount: 1350000,
      maxAllowedAmount: 1000000,
      dataEntryDate: '2024-01-15T09:00:00Z',
    };

    const validationRules = {
      maxAllowedAmount: 1000000,
      minAllowedAmount: 1000,
      allowedServiceTypes: ['STANDARD', 'PREMIUM', 'ENTERPRISE'],
      requireFields: ['customerId', 'serviceType', 'appointmentCount', 'finalAmount'],
    };

    // 検証実行
    const result = validateSalesDataQuality(salesData, validationRules);

    // 期待結果の検証

    // 1. 上限値超過が正確に検出される
    expect(result.isValid).toBe(false);
    expect(result.hasAmountAnomaly).toBe(true);

    // 2. 上限値超過に関するエラーメッセージが出力されている
    expect(result.validationErrors).toContainEqual(
      expect.objectContaining({
        fieldName: 'finalAmount',
        errorCode: 'AMOUNT_EXCEEDS_LIMIT',
      })
    );
    expect(result.validationErrors[0].message).toMatch(/金額/);

    // 3. 検出された異常値の詳細情報が記録されている
    expect(result.anomalyDetails).toBeDefined();
    expect(result.anomalyDetails.detectedAmount).toBe(1350000);
    expect(result.anomalyDetails.maxThreshold).toBe(1000000);
    expect(result.anomalyDetails.excessAmount).toBe(350000);

    // 4. 異常値フラグが適切に設定されている
    expect(result.shouldSkipBillingAutomation).toBe(true);

    // 5. 請求自動化処理がスキップされることを検証
    expect(result.billingProcessStatus).toBe('SKIPPED');

    // 6. 検証結果ログに異常値の詳細情報が記録されている
    expect(result.validationLog).toBeDefined();
    expect(result.validationLog.timestamp).toBeDefined();
    expect(result.validationLog.validatedFields).toContain('finalAmount');
    expect(result.validationLog.anomaliesDetected).toBe(1);

    // 7. オペレータが目視確認可能な形式で記録されている
    expect(result.operatorReviewRequired).toBe(true);
    expect(result.reviewPriority).toBe('HIGH');
  });
});