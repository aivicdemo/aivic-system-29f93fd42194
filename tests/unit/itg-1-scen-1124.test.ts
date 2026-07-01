import { describe, test, expect, beforeEach } from '@jest/globals';
import { validateBillingRecordCompleteness } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1124: [edge] 入力データ完全性・正確性自動検証機能 - 金額が0円の場合、正当な値として受け入れられ検証が継続される
  test('should accept zero amount as valid value and continue validation of other required fields', () => {
    const billingRecord = {
      customerId: 'CUST-00001',
      billingDate: '2024-01-15',
      billingType: 'service_charge',
      amount: 0,
      serviceName: 'consulting',
      period: '2024-01',
    };

    const validationResult = validateBillingRecordCompleteness(billingRecord);

    // 金額が0円でも正当な値として受け入れられることを確認
    expect(validationResult.isValid).toBe(true);

    // 金額フィールドがバリデーションエラーで拒否されないことを確認
    expect(validationResult.errors).not.toContain(
      expect.objectContaining({
        field: 'amount',
        message: expect.stringMatching(/金額/),
      })
    );

    // 他の必須フィールドの検証が継続されたことを確認
    expect(validationResult.fieldValidationStatus).toEqual(
      expect.objectContaining({
        customerId: 'valid',
        billingDate: 'valid',
        billingType: 'valid',
        amount: 'valid',
        serviceName: 'valid',
        period: 'valid',
      })
    );

    // 最終的な検証ステータスが合格で返却されることを確認
    expect(validationResult.status).toBe('passed');

    // エラーが発生していないことを確認
    expect(validationResult.errors).toHaveLength(0);

    // 警告メッセージが存在しないか、あれば金額に関連しないことを確認
    const amountWarnings = validationResult.warnings?.filter(w =>
      w.toLowerCase().includes('금액') || w.toLowerCase().includes('amount')
    ) ?? [];
    expect(amountWarnings).toHaveLength(0);

    // 後続の請求処理へ進行可能な状態であることを確認
    expect(validationResult.canProceedToNextStep).toBe(true);
  });
});