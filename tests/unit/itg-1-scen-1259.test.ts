import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { matchDiscountAndVerify } from '../../src/logic/it-1781935279444-2-1-1';

describe('割引判定・照合機能', () => {
  // SCEN-1259: [normal] 割引判定・照合機能 - 請求情報が契約内容と一致し、適用割引が正確に判定される
  test('割引判定・照合機能は契約情報と請求情報を照合して正確に割引を計算する', () => {
    const contractData = {
      contractId: 'CTR001',
      customerId: 'CUST001',
      serviceName: 'ベーシックプラン',
      baseBillingAmount: 100000,
      discountRate: 0.1,
      validStartDate: '2024-01-01',
      validEndDate: '2024-12-31',
      discountType: 'percentage',
      campaignDiscountRate: 0.05,
      minimumBillingAmount: 50000,
      maximumBillingAmount: 500000,
    };

    const billingData = {
      billingId: 'BIL001',
      customerId: 'CUST001',
      contractId: 'CTR001',
      serviceName: 'ベーシックプラン',
      billingAmount: 100000,
      billingDate: '2024-06-15',
      appliedDiscountRate: 0.1,
      invoiceNumber: 'INV202406001',
    };

    const result = matchDiscountAndVerify({
      contract: contractData,
      billing: billingData,
    });

    expect(result.isMatch).toBe(true);
    expect(result.appliedDiscountAmount).toBe(10000);
    expect(result.finalBillingAmount).toBe(90000);
    expect(result.hasError).toBe(false);
    expect(result.errorMessage).toBe('');
  });

  test('複数割引の組み合わせ時にすべての割引が正確に適用される', () => {
    const contractData = {
      contractId: 'CTR002',
      customerId: 'CUST002',
      serviceName: 'プレミアムプラン',
      baseBillingAmount: 200000,
      discountRate: 0.15,
      validStartDate: '2024-01-01',
      validEndDate: '2024-12-31',
      discountType: 'percentage',
      campaignDiscountRate: 0.08,
      minimumBillingAmount: 100000,
      maximumBillingAmount: 1000000,
    };

    const billingData = {
      billingId: 'BIL002',
      customerId: 'CUST002',
      contractId: 'CTR002',
      serviceName: 'プレミアムプラン',
      billingAmount: 200000,
      billingDate: '2024-06-15',
      appliedDiscountRate: 0.23,
      invoiceNumber: 'INV202406002',
    };

    const result = matchDiscountAndVerify({
      contract: contractData,
      billing: billingData,
    });

    expect(result.isMatch).toBe(true);
    expect(result.appliedDiscountAmount).toBe(46000);
    expect(result.finalBillingAmount).toBe(154000);
    expect(result.hasError).toBe(false);
  });

  test('割引がない場合、請求金額は変わらない', () => {
    const contractData = {
      contractId: 'CTR003',
      customerId: 'CUST003',
      serviceName: 'スタンダードプラン',
      baseBillingAmount: 50000,
      discountRate: 0,
      validStartDate: '2024-01-01',
      validEndDate: '2024-12-31',
      discountType: 'none',
      campaignDiscountRate: 0,
      minimumBillingAmount: 30000,
      maximumBillingAmount: 300000,
    };

    const billingData = {
      billingId: 'BIL003',
      customerId: 'CUST003',
      contractId: 'CTR003',
      serviceName: 'スタンダードプラン',
      billingAmount: 50000,
      billingDate: '2024-06-15',
      appliedDiscountRate: 0,
      invoiceNumber: 'INV202406003',
    };

    const result = matchDiscountAndVerify({
      contract: contractData,
      billing: billingData,
    });

    expect(result.isMatch).toBe(true);
    expect(result.appliedDiscountAmount).toBe(0);
    expect(result.finalBillingAmount).toBe(50000);
    expect(result.hasError).toBe(false);
  });

  test('請求金額が契約の最小金額より低い場合、エラーが発生する', () => {
    const contractData = {
      contractId: 'CTR004',
      customerId: 'CUST004',
      serviceName: 'ベーシックプラン',
      baseBillingAmount: 100000,
      discountRate: 0.1,
      validStartDate: '2024-01-01',
      validEndDate: '2024-12-31',
      discountType: 'percentage',
      campaignDiscountRate: 0.05,
      minimumBillingAmount: 50000,
      maximumBillingAmount: 500000,
    };

    const billingData = {
      billingId: 'BIL004',
      customerId: 'CUST004',
      contractId: 'CTR004',
      serviceName: 'ベーシックプラン',
      billingAmount: 30000,
      billingDate: '2024-06-15',
      appliedDiscountRate: 0.1,
      invoiceNumber: 'INV202406004',
    };

    expect(() => {
      matchDiscountAndVerify({
        contract: contractData,
        billing: billingData,
      });
    }).toThrow(/最小請求額/);
  });

  test('請求金額が契約の最大金額を超える場合、エラーが発生する', () => {
    const contractData = {
      contractId: 'CTR005',
      customerId: 'CUST005',
      serviceName: 'ベーシックプラン',
      baseBillingAmount: 100000,
      discountRate: 0.1,
      validStartDate: '2024-01-01',
      validEndDate: '2024-12-31',
      discountType: 'percentage',
      campaignDiscountRate: 0.05,
      minimumBillingAmount: 50000,
      maximumBillingAmount: 500000,
    };

    const billingData = {
      billingId: 'BIL005',
      customerId: 'CUST005',
      contractId: 'CTR005',
      serviceName: 'ベーシックプラン',
      billingAmount: 600000,
      billingDate: '2024-06-15',
      appliedDiscountRate: 0.1,
      invoiceNumber: 'INV202406005',
    };

    expect(() => {
      matchDiscountAndVerify({
        contract: contractData,
        billing: billingData,
      });
    }).toThrow(/最大請求額/);
  });

  test('請求日が契約有効期間外の場合、エラーが発生する', () => {
    const contractData = {
      contractId: 'CTR006',
      customerId: 'CUST006',
      serviceName: 'ベーシックプラン',
      baseBillingAmount: 100000,
      discountRate: 0.1,
      validStartDate: '2024-01-01',
      validEndDate: '2024-12-31',
      discountType: 'percentage',
      campaignDiscountRate: 0.05,
      minimumBillingAmount: 50000,
      maximumBillingAmount: 500000,
    };

    const billingData = {
      billingId: 'BIL006',
      customerId: 'CUST006',
      contractId: 'CTR006',
      serviceName: 'ベーシックプラン',
      billingAmount: 100000,
      billingDate: '2025-01-15',
      appliedDiscountRate: 0.1,
      invoiceNumber: 'INV202501006',
    };

    expect(() => {
      matchDiscountAndVerify({
        contract: contractData,
        billing: billingData,
      });
    }).toThrow(/契約期間/);
  });

  test('顧客IDが一致しない場合、エラーが発生する', () => {
    const contractData = {
      contractId: 'CTR007',
      customerId: 'CUST007',
      serviceName: 'ベーシックプラン',
      baseBillingAmount: 100000,
      discountRate: 0.1,
      validStartDate: '2024-01-01',
      validEndDate: '2024-12-31',
      discountType: 'percentage',
      campaignDiscountRate: 0.05,
      minimumBillingAmount: 50000,
      maximumBillingAmount: 500000,
    };

    const billingData = {
      billingId: 'BIL007',
      customerId: 'CUST999',
      contractId: 'CTR007',
      serviceName: 'ベーシックプラン',
      billingAmount: 100000,
      billingDate: '2024-06-15',
      appliedDiscountRate: 0.1,
      invoiceNumber: 'INV202406007',
    };

    expect(() => {
      matchDiscountAndVerify({
        contract: contractData,
        billing: billingData,
      });
    }).toThrow(/顧客ID/);
  });

  test('サービス名が一致しない場合、エラーが発生する', () => {
    const contractData = {
      contractId: 'CTR008',
      customerId: 'CUST008',
      serviceName: 'ベーシックプラン',
      baseBillingAmount: 100000,
      discountRate: 0.1,
      validStartDate: '2024-01-01',
      validEndDate: '2024-12-31',
      discountType: 'percentage',
      campaignDiscountRate: 0.05,
      minimumBillingAmount: 50000,
      maximumBillingAmount: 500000,
    };

    const billingData = {
      billingId: 'BIL008',
      customerId: 'CUST008',
      contractId: 'CTR008',
      serviceName: 'プレミアムプラン',
      billingAmount: 100000,
      billingDate: '2024-06-15',
      appliedDiscountRate: 0.1,
      invoiceNumber: 'INV202406008',
    };

    expect(() => {
      matchDiscountAndVerify({
        contract: contractData,
        billing: billingData,
      });
    }).toThrow(/サービス名/);
  });

  test('固定額割引が正確に計算される', () => {
    const contractData = {
      contractId: 'CTR009',
      customerId: 'CUST009',
      serviceName: 'エンタープライズプラン',
      baseBillingAmount: 300000,
      discountRate: 20000,
      validStartDate: '2024-01-01',
      validEndDate: '2024-12-31',
      discountType: 'fixed',
      campaignDiscountRate: 0,
      minimumBillingAmount: 100000,
      maximumBillingAmount: 1000000,
    };

    const billingData = {
      billingId: 'BIL009',
      customerId: 'CUST009',
      contractId: 'CTR009',
      serviceName: 'エンタープライズプラン',
      billingAmount: 300000,
      billingDate: '2024-06-15',
      appliedDiscountRate: 20000,
      invoiceNumber: 'INV202406009',
    };

    const result = matchDiscountAndVerify({
      contract: contractData,
      billing: billingData,
    });

    expect(result.isMatch).toBe(true);
    expect(result.appliedDiscountAmount).toBe(20000);
    expect(result.finalBillingAmount).toBe(280000);
    expect(result.hasError).toBe(false);
  });

  test('複数契約が存在する場合、正しい契約が選択される', () => {
    const contractData = {
      contractId: 'CTR010',
      customerId: 'CUST010',
      serviceName: 'スタンダードプラン',
      baseBillingAmount: 150000,
      discountRate: 0.12,
      validStartDate: '2024-04-01',
      validEndDate: '2024-09-30',
      discountType: 'percentage',
      campaignDiscountRate: 0.03,
      minimumBillingAmount: 80000,
      maximumBillingAmount: 600000,
    };

    const billingData = {
      billingId: 'BIL010',
      customerId: 'CUST010',
      contractId: 'CTR010',
      serviceName: 'スタンダードプラン',
      billingAmount: 150000,
      billingDate: '2024-07-01',
      appliedDiscountRate: 0.15,
      invoiceNumber: 'INV202407010',
    };

    const result = matchDiscountAndVerify({
      contract: contractData,
      billing: billingData,
    });

    expect(result.isMatch).toBe(true);
    expect(result.appliedDiscountAmount).toBe(22500);
    expect(result.finalBillingAmount).toBe(127500);
    expect(result.hasError).toBe(false);
  });

  test('割引率が0から1.0の範囲外の場合、エラーが発生する', () => {
    const contractData = {
      contractId: 'CTR011',
      customerId: 'CUST011',
      serviceName: 'ベーシックプラン',
      baseBillingAmount: 100000,
      discountRate: 1.5,
      validStartDate: '2024-01-01',
      validEndDate: '2024-12-31',
      discountType: 'percentage',
      campaignDiscountRate: 0.05,
      minimumBillingAmount: 50000,
      maximumBillingAmount: 500000,
    };

    const billingData = {
      billingId: 'BIL011',
      customerId: 'CUST011',
      contractId: 'CTR011',
      serviceName: 'ベーシックプラン',
      billingAmount: 100000,
      billingDate: '2024-06-15',
      appliedDiscountRate: 1.5,
      invoiceNumber: 'INV202406011',
    };

    expect(() => {
      matchDiscountAndVerify({
        contract: contractData,
        billing: billingData,
      });
    }).toThrow(/割引率/);
  });
});