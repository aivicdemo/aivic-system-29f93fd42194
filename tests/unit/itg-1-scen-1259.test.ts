import { describe, test, expect, beforeEach } from '@jest/globals';
import { calculateContractChangeWithBilling } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1259
  test('SLA時間内契約変更反映機能 - 複雑な請求額計算を伴う契約変更がSLA時間内に完了する', () => {
    const contractChangeInput = {
      contractId: 'CTR-2024-001',
      customerId: 'CUST-A001',
      serviceId: 'SVC-PREMIUM',
      changeType: 'plan_change',
      previousPlan: {
        basePricePerMonth: 100000,
        quantity: 5,
        unitPrice: 20000,
        discountRate: 0.1
      },
      newPlan: {
        basePricePerMonth: 150000,
        quantity: 8,
        unitPrice: 18750,
        discountRate: 0.15
      },
      additionalOptions: [
        { optionId: 'OPT-001', price: 10000 },
        { optionId: 'OPT-002', price: 5000 }
      ],
      campaignDiscount: 0.05,
      effectiveDate: '2024-02-01',
      slaBoundaryMs: 300000,
      startTimestampMs: 1706774400000,
      auditUser: 'ops-manager-001'
    };

    const result = calculateContractChangeWithBilling(contractChangeInput);

    // 新しい請求額の計算検証
    // 基本計算: (basePricePerMonth + (quantity * unitPrice)) * (1 - discountRate) * (1 - campaignDiscount) + additionalOptions合計
    // = (150000 + (8 * 18750)) * (1 - 0.15) * (1 - 0.05) + 15000
    // = (150000 + 150000) * 0.85 * 0.95 + 15000
    // = 300000 * 0.85 * 0.95 + 15000
    // = 300000 * 0.8075 + 15000
    // = 242250 + 15000
    // = 257250
    expect(result.calculatedBillingAmount).toBe(257250);

    // 前月との差分計算
    // 前月: (100000 + (5 * 20000)) * (1 - 0.1) * (1 - 0.05) = 200000 * 0.9 * 0.95 = 171000
    // 差分: 257250 - 171000 = 86250
    expect(result.monthlyDifference).toBe(86250);

    // SLA時間内での完了確認
    expect(result.processingTimeMs).toBeLessThanOrEqual(contractChangeInput.slaBoundaryMs);
    expect(result.slaMet).toBe(true);

    // 処理完了時刻がスタート時刻より後であることを確認
    expect(result.endTimestampMs).toBeGreaterThan(contractChangeInput.startTimestampMs);

    // 変更前後のプラン情報が正確に記録されていることを確認
    expect(result.changeDetails).toEqual({
      previousBasePricePerMonth: 100000,
      newBasePricePerMonth: 150000,
      previousQuantity: 5,
      newQuantity: 8,
      previousUnitPrice: 20000,
      newUnitPrice: 18750,
      previousDiscountRate: 0.1,
      newDiscountRate: 0.15
    });

    // 追加オプション合計が正確に計算されていることを確認
    expect(result.additionalOptionsTotal).toBe(15000);

    // 監査ログの記録が完全であることを確認
    expect(result.auditLog).toEqual({
      contractId: 'CTR-2024-001',
      customerId: 'CUST-A001',
      serviceId: 'SVC-PREMIUM',
      changeType: 'plan_change',
      initiatedBy: 'ops-manager-001',
      initiatedAt: new Date(contractChangeInput.startTimestampMs).toISOString(),
      completedAt: result.completedAtIso,
      oldBillingAmount: 171000,
      newBillingAmount: 257250,
      processingDurationMs: result.processingTimeMs,
      slaBoundaryMs: 300000,
      slaMet: true,
      status: 'completed'
    });

    // 生成されたドキュメント情報の確認
    expect(result.generatedDocuments).toEqual({
      invoiceGenerated: true,
      invoiceId: expect.stringMatching(/^INV-/),
      contractConfirmationGenerated: true,
      contractConfirmationId: expect.stringMatching(/^CC-/),
      documentGeneratedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/)
    });

    // ステータスが完了を示していることを確認
    expect(result.status).toBe('completed');

    // 変更の有効日付が正確に記録されていることを確認
    expect(result.effectiveDate).toBe('2024-02-01');

    // 顧客ごと・サービスごとの請求情報が正確に集計されていることを確認
    expect(result.billingByServiceAndCustomer).toEqual({
      customerId: 'CUST-A001',
      serviceId: 'SVC-PREMIUM',
      billingAmount: 257250,
      currency: 'JPY',
      billingCycle: 'monthly'
    });
  });
});