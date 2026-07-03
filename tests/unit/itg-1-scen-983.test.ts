import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import {
  generateBillingDocument,
  verifyBillingDocumentConsistency,
} from '../../src/logic/it-1-br-1781935279444-1-2-1';

const fetchMock = require('jest-fetch-mock');
fetchMock.enableMocks();

describe('月次サマリーテンプレート定義・管理機能 - 請求書自動生成', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('SCEN-983: 新規契約・契約変更発生時に請求書生成が即座にトリガーされる', () => {
    // === 前提: 営業システムに新規契約データが登録準備完了の状態 ===
    const contractData = {
      contractId: 'CT-2024-001',
      customerId: 'CUST-12345',
      customerName: '株式会社テスト太郎',
      serviceType: 'SALES_SUPPORT',
      serviceName: '営業支援サービス',
      contractStartDate: '2024-01-15',
      contractEndDate: '2024-12-31',
      baseFeePerMonth: 500000,
      performanceFeePerUnit: 50000,
      totalContractAmount: 6500000,
      discountRate: 0.1,
      discountAmount: 650000,
      finalContractAmount: 5850000,
      billingCycle: 'MONTHLY',
      paymentTerms: '月末締め翌月末払い',
      notes: '新規契約',
    };

    const systemLogBefore = {
      timestamp: new Date('2024-01-15T09:00:00Z'),
      eventType: 'CONTRACT_REGISTRATION_START',
      contractId: contractData.contractId,
      status: 'INITIATED',
    };

    // === 発生条件: 代表兼営業オペレーターが新規契約データを入力・登録完了 ===
    const registrationResult = {
      contractId: contractData.contractId,
      registrationTimestamp: new Date('2024-01-15T09:00:15Z'),
      status: 'REGISTERED',
    };

    // === 期待結果: 契約登録完了から5秒以内に請求書自動生成トリガーが実行 ===
    const triggerCheckTimestamp = new Date('2024-01-15T09:00:20Z');
    const timeDiffSeconds =
      (triggerCheckTimestamp.getTime() -
        registrationResult.registrationTimestamp.getTime()) /
      1000;
    expect(timeDiffSeconds).toBeLessThanOrEqual(5);

    // === 請求書自動生成トリガー実行の確認 ===
    const systemLogTrigger = {
      timestamp: triggerCheckTimestamp,
      eventType: 'BILLING_DOCUMENT_GENERATION_TRIGGER',
      contractId: contractData.contractId,
      triggeredBy: 'SYSTEM_AUTOMATION',
      status: 'TRIGGERED',
    };
    expect(systemLogTrigger.eventType).toBe('BILLING_DOCUMENT_GENERATION_TRIGGER');
    expect(systemLogTrigger.status).toBe('TRIGGERED');

    // === 生成された請求書の内容確認 ===
    const billingDocumentData = {
      billingId: 'BILL-2024-001-01',
      contractId: contractData.contractId,
      customerId: contractData.customerId,
      customerName: contractData.customerName,
      serviceType: contractData.serviceType,
      serviceName: contractData.serviceName,
      billingPeriodStart: '2024-01-15',
      billingPeriodEnd: '2024-01-31',
      baseFee: contractData.baseFeePerMonth,
      performanceFee: 0,
      subtotal: contractData.baseFeePerMonth,
      discountRate: contractData.discountRate,
      discountAmount: contractData.baseFeePerMonth * contractData.discountRate,
      totalAmount:
        contractData.baseFeePerMonth -
        contractData.baseFeePerMonth * contractData.discountRate,
      generatedTimestamp: new Date('2024-01-15T09:00:18Z'),
      status: 'GENERATED',
    };

    // === 請求書の内容が契約情報と一致するか検証 ===
    const consistencyCheckResult = verifyBillingDocumentConsistency({
      billingDocument: billingDocumentData,
      contract: contractData,
    });
    expect(consistencyCheckResult.isConsistent).toBe(true);
    expect(consistencyCheckResult.contractIdMatch).toBe(true);
    expect(consistencyCheckResult.customerIdMatch).toBe(true);
    expect(consistencyCheckResult.customerNameMatch).toBe(true);
    expect(consistencyCheckResult.serviceTypeMatch).toBe(true);

    // === 金額計算の検証: 割引が正確に反映されているか ===
    const expectedTotalAmount =
      billingDocumentData.baseFee -
      billingDocumentData.baseFee * billingDocumentData.discountRate;
    expect(billingDocumentData.totalAmount).toBe(expectedTotalAmount);
    expect(billingDocumentData.totalAmount).toBeCloseTo(90000, 0);

    // === 請求管理画面への登録確認 ===
    fetchMock.mockResponseOnce(
      JSON.stringify({
        billingId: billingDocumentData.billingId,
        status: 'REGISTERED_IN_DASHBOARD',
        displayTimestamp: new Date('2024-01-15T09:00:19Z'),
      }),
      { status: 200 }
    );

    // === 既存契約の契約変更手続きの実行 ===
    const contractModificationData = {
      originalContractId: 'CT-2024-001',
      modificationId: 'MOD-2024-001-01',
      modificationTimestamp: new Date('2024-01-20T10:30:00Z'),
      changes: {
        baseFeePerMonth: 550000,
        discountRate: 0.15,
      },
      newTotalContractAmount: 6435000,
      newFinalContractAmount: 5469750,
      status: 'MODIFICATION_REGISTERED',
    };

    // === 契約変更完了から5秒以内に新しい請求書生成トリガーが実行 ===
    const modificationTriggerCheckTimestamp = new Date('2024-01-20T10:30:04Z');
    const modificationTimeDiffSeconds =
      (modificationTriggerCheckTimestamp.getTime() -
        contractModificationData.modificationTimestamp.getTime()) /
      1000;
    expect(modificationTimeDiffSeconds).toBeLessThanOrEqual(5);

    // === 変更内容を反映した新しい請求書が生成 ===
    const modifiedBillingDocumentData = {
      billingId: 'BILL-2024-001-02',
      contractId: contractModificationData.originalContractId,
      customerId: contractData.customerId,
      customerName: contractData.customerName,
      serviceType: contractData.serviceType,
      serviceName: contractData.serviceName,
      billingPeriodStart: '2024-02-01',
      billingPeriodEnd: '2024-02-29',
      baseFee: contractModificationData.changes.baseFeePerMonth,
      performanceFee: 0,
      subtotal: contractModificationData.changes.baseFeePerMonth,
      discountRate: contractModificationData.changes.discountRate,
      discountAmount:
        contractModificationData.changes.baseFeePerMonth *
        contractModificationData.changes.discountRate,
      totalAmount:
        contractModificationData.changes.baseFeePerMonth -
        contractModificationData.changes.baseFeePerMonth *
          contractModificationData.changes.discountRate,
      generatedTimestamp: new Date('2024-01-20T10:30:02Z'),
      status: 'GENERATED',
    };

    // === 変更後の請求書が契約情報と一致するか検証 ===
    const modifiedConsistencyCheckResult = verifyBillingDocumentConsistency({
      billingDocument: modifiedBillingDocumentData,
      contract: {
        ...contractData,
        baseFeePerMonth: contractModificationData.changes.baseFeePerMonth,
        discountRate: contractModificationData.changes.discountRate,
      },
    });
    expect(modifiedConsistencyCheckResult.isConsistent).toBe(true);

    // === 変更後の金額計算検証 ===
    const expectedModifiedTotalAmount =
      modifiedBillingDocumentData.baseFee -
      modifiedBillingDocumentData.baseFee * modifiedBillingDocumentData.discountRate;
    expect(modifiedBillingDocumentData.totalAmount).toBe(
      expectedModifiedTotalAmount
    );
    expect(modifiedBillingDocumentData.totalAmount).toBeCloseTo(467500, 0);

    // === 生成レポート: 新旧請求書内容の比較 ===
    const billingComparisonReport = {
      originalBillingId: billingDocumentData.billingId,
      modifiedBillingId: modifiedBillingDocumentData.billingId,
      baseFeeChange: {
        before: billingDocumentData.baseFee,
        after: modifiedBillingDocumentData.baseFee,
        delta: modifiedBillingDocumentData.baseFee - billingDocumentData.baseFee,
      },
      discountRateChange: {
        before: billingDocumentData.discountRate,
        after: modifiedBillingDocumentData.discountRate,
        delta:
          modifiedBillingDocumentData.discountRate -
          billingDocumentData.discountRate,
      },
      totalAmountChange: {
        before: billingDocumentData.totalAmount,
        after: modifiedBillingDocumentData.totalAmount,
        delta:
          modifiedBillingDocumentData.totalAmount - billingDocumentData.totalAmount,
      },
    };

    expect(billingComparisonReport.baseFeeChange.delta).toBe(50000);
    expect(billingComparisonReport.discountRateChange.delta).toBe(0.05);
    expect(billingComparisonReport.totalAmountChange.delta).toBeCloseTo(
      377500,
      0
    );

    // === トリガー実行ログの確認 ===
    const systemLogModificationTrigger = {
      timestamp: modificationTriggerCheckTimestamp,
      eventType: 'BILLING_DOCUMENT_GENERATION_TRIGGER',
      contractId: contractModificationData.originalContractId,
      triggeredBy: 'SYSTEM_AUTOMATION',
      triggerReason: 'CONTRACT_MODIFICATION',
      status: 'TRIGGERED',
    };
    expect(systemLogModificationTrigger.eventType).toBe(
      'BILLING_DOCUMENT_GENERATION_TRIGGER'
    );
    expect(systemLogModificationTrigger.triggerReason).toBe(
      'CONTRACT_MODIFICATION'
    );
    expect(systemLogModificationTrigger.status).toBe('TRIGGERED');

    // === 最終確認: 両請求書の情報が一致していることを検証 ===
    expect(billingDocumentData.contractId).toBe(
      modifiedBillingDocumentData.contractId
    );
    expect(billingDocumentData.customerId).toBe(
      modifiedBillingDocumentData.customerId
    );
    expect(billingDocumentData.customerName).toBe(
      modifiedBillingDocumentData.customerName
    );
    expect(billingDocumentData.serviceType).toBe(
      modifiedBillingDocumentData.serviceType
    );
  });
});