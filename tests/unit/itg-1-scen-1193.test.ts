import { describe, test, expect } from '@jest/globals';
import { validateResponseApproval } from '../../src/logic/it-1781935279444-2-2-1';

describe('月次レポート配信後の顧客問い合わせ対応と検証 - 回答内容の最終確認・承認', () => {
  test('SCEN-1193: 回答内容が契約条件、営業データ、請求ルール、根拠資料と矛盾していない場合、承認が返される', () => {
    // テストデータ準備: 契約条件、営業データ、請求ルール、根拠資料が一貫性を持つシナリオ
    const contractData = {
      contractId: 'C001',
      customerId: 'CUS001',
      serviceType: 'appointment_management',
      billingUnit: 'per_appointment',
      unitPrice: 5000,
      discountRate: 0.1,
      minimumBillingAmount: 10000,
      maximumBillingAmount: 500000,
      billingStartDate: '2024-01-01',
      billingEndDate: '2024-12-31',
    };

    const salesData = {
      salesDataId: 'SD001',
      customerId: 'CUS001',
      period: '2024-01',
      appointmentCount: 25,
      contractCount: 5,
      customerResponse: 'positive',
      serviceType: 'appointment_management',
      salesAmount: 125000,
    };

    const billingRule = {
      ruleId: 'BR001',
      customerId: 'CUS001',
      serviceType: 'appointment_management',
      calculationMethod: 'per_unit',
      basePrice: 5000,
      discountApplicable: true,
      discountPercentage: 10,
      minimumCharge: 10000,
      maximumCharge: 500000,
    };

    const supportingDocuments = {
      documentId: 'DOC001',
      salesDataReference: 'SD001',
      contractReference: 'C001',
      billingCalculation: {
        appointmentCount: 25,
        unitPrice: 5000,
        subtotal: 125000,
        discountAmount: 12500,
        finalAmount: 112500,
      },
      calculationLogic: 'appointmentCount * unitPrice - discount',
      createdDate: '2024-02-01T09:00:00Z',
      verifiedBy: 'OP001',
    };

    const responseContent = {
      responseId: 'RESP001',
      inquiryId: 'INQ001',
      customerId: 'CUS001',
      responseText: '2024年1月分の請求額は、契約書に基づくアポイント管理サービス25件@5,000円=125,000円から、契約条件の10%割引12,500円を控除した112,500円です。詳細は別紙営業データ及び請求計算表をご確認ください。',
      claimedBillingAmount: 112500,
      supportingDocumentIds: ['DOC001'],
      responseDate: '2024-02-05T10:30:00Z',
      respondentId: 'OP001',
    };

    // 回答内容を入力し、最終確認・承認機能を実行
    const approvalResult = validateResponseApproval({
      responseContent,
      contractData,
      salesData,
      billingRule,
      supportingDocuments,
    });

    // システムが回答内容と契約条件の整合性を検証
    expect(approvalResult.contractConsistency).toBe(true);
    expect(approvalResult.contractConsistencyDetails).toEqual({
      serviceTypeMatch: true,
      billingUnitMatch: true,
      discountRateMatch: true,
    });

    // システムが回答内容と営業データの整合性を検証
    expect(approvalResult.salesDataConsistency).toBe(true);
    expect(approvalResult.salesDataConsistencyDetails).toEqual({
      periodMatch: true,
      appointmentCountMatch: true,
      customerMatch: true,
    });

    // システムが回答内容と請求ルールの整合性を検証
    expect(approvalResult.billingRuleConsistency).toBe(true);
    expect(approvalResult.billingRuleConsistencyDetails).toEqual({
      calculationMethodMatch: true,
      discountApplicabilityMatch: true,
      minimumChargeCheck: true,
      maximumChargeCheck: true,
    });

    // システムが回答内容と根拠資料の整合性を検証
    expect(approvalResult.supportingDocumentsConsistency).toBe(true);
    expect(approvalResult.supportingDocumentsConsistencyDetails).toEqual({
      documentReferenceValid: true,
      calculationAmountMatch: true,
      calculationLogicMatch: true,
    });

    // すべての検証が完了するまで待機 → システムからの承認結果を確認
    expect(approvalResult.allValidationsComplete).toBe(true);
    expect(approvalResult.approvalStatus).toBe('approved');
    expect(approvalResult.approvalTimestamp).toBe('2024-02-05T10:30:00Z');
    expect(approvalResult.contradictionsDetected).toEqual([]);
    expect(approvalResult.failureReasons).toEqual([]);

    // 承認ステータスが返されることを確認
    expect(approvalResult.statusCode).toBe(200);
    expect(approvalResult.message).toBe('回答内容は契約条件、営業データ、請求ルール、根拠資料と一致しており、承認されました。');
  });
});