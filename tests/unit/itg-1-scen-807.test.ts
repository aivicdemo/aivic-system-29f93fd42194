import { validateBillingDataAgainstContract } from '../../src/logic/it-1781935279444-2-2-1';

describe('請求データ妥当性自動検証機能', () => {
  // SCEN-807
  test('請求内容が契約条件と不一致の場合に警告が表示される', () => {
    // 契約データ
    const contractData = {
      contractId: 'CTR-2024-001',
      contractAmount: 100000,
      contractStartDate: '2024-01-01',
      contractEndDate: '2024-12-31',
      paymentTerm: '月末払い'
    };

    // ケース1: 金額が不一致
    const billingDataAmountMismatch = {
      contractId: 'CTR-2024-001',
      billingAmount: 120000,
      billingPeriodStart: '2024-01-01',
      billingPeriodEnd: '2024-12-31',
      paymentTerm: '月末払い'
    };

    const resultAmountMismatch = validateBillingDataAgainstContract(
      contractData,
      billingDataAmountMismatch
    );

    expect(resultAmountMismatch).toEqual({
      isValid: false,
      warnings: [
        {
          type: '金額の相違',
          severity: 'error',
          contractValue: 100000,
          billingValue: 120000,
          description: '請求金額が契約金額と異なります'
        }
      ],
      mismatchItems: ['amount']
    });

    // ケース2: 期間が不一致
    const billingDataPeriodMismatch = {
      contractId: 'CTR-2024-001',
      billingAmount: 100000,
      billingPeriodStart: '2024-01-01',
      billingPeriodEnd: '2024-11-30',
      paymentTerm: '月末払い'
    };

    const resultPeriodMismatch = validateBillingDataAgainstContract(
      contractData,
      billingDataPeriodMismatch
    );

    expect(resultPeriodMismatch).toEqual({
      isValid: false,
      warnings: [
        {
          type: '期間の相違',
          severity: 'error',
          contractValue: '2024-01-01〜2024-12-31',
          billingValue: '2024-01-01〜2024-11-30',
          description: '請求期間が契約期間と異なります'
        }
      ],
      mismatchItems: ['period']
    });

    // ケース3: 支払い条件が不一致
    const billingDataPaymentMismatch = {
      contractId: 'CTR-2024-001',
      billingAmount: 100000,
      billingPeriodStart: '2024-01-01',
      billingPeriodEnd: '2024-12-31',
      paymentTerm: '翌月末払い'
    };

    const resultPaymentMismatch = validateBillingDataAgainstContract(
      contractData,
      billingDataPaymentMismatch
    );

    expect(resultPaymentMismatch).toEqual({
      isValid: false,
      warnings: [
        {
          type: '支払い条件の相違',
          severity: 'error',
          contractValue: '月末払い',
          billingValue: '翌月末払い',
          description: '支払い条件が契約条件と異なります'
        }
      ],
      mismatchItems: ['paymentTerm']
    });

    // ケース4: 複数項目が不一致
    const billingDataMultipleMismatch = {
      contractId: 'CTR-2024-001',
      billingAmount: 120000,
      billingPeriodStart: '2024-01-01',
      billingPeriodEnd: '2024-11-30',
      paymentTerm: '翌月末払い'
    };

    const resultMultipleMismatch = validateBillingDataAgainstContract(
      contractData,
      billingDataMultipleMismatch
    );

    expect(resultMultipleMismatch).toEqual({
      isValid: false,
      warnings: [
        {
          type: '金額の相違',
          severity: 'error',
          contractValue: 100000,
          billingValue: 120000,
          description: '請求金額が契約金額と異なります'
        },
        {
          type: '期間の相違',
          severity: 'error',
          contractValue: '2024-01-01〜2024-12-31',
          billingValue: '2024-01-01〜2024-11-30',
          description: '請求期間が契約期間と異なります'
        },
        {
          type: '支払い条件の相違',
          severity: 'error',
          contractValue: '月末払い',
          billingValue: '翌月末払い',
          description: '支払い条件が契約条件と異なります'
        }
      ],
      mismatchItems: ['amount', 'period', 'paymentTerm']
    });

    // ケース5: すべて一致（正常系）
    const billingDataValid = {
      contractId: 'CTR-2024-001',
      billingAmount: 100000,
      billingPeriodStart: '2024-01-01',
      billingPeriodEnd: '2024-12-31',
      paymentTerm: '月末払い'
    };

    const resultValid = validateBillingDataAgainstContract(
      contractData,
      billingDataValid
    );

    expect(resultValid).toEqual({
      isValid: true,
      warnings: [],
      mismatchItems: []
    });

    // エラーケース: 契約IDが見つからない
    const billingDataInvalidContractId = {
      contractId: 'CTR-NONEXISTENT',
      billingAmount: 100000,
      billingPeriodStart: '2024-01-01',
      billingPeriodEnd: '2024-12-31',
      paymentTerm: '月末払い'
    };

    expect(() =>
      validateBillingDataAgainstContract(
        contractData,
        billingDataInvalidContractId
      )
    ).toThrow(/契約ID/);
  });
});