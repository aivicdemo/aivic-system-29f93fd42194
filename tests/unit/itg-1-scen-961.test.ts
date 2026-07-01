import { calculateContractInvoiceAmount } from '../../src/logic/it-1-2-1';

describe('契約別請求額計算機能', () => {
  test('SCEN-961: 基本料金・成果報酬・割引額を個別計算して請求額合計を算出できる', () => {
    // テスト用契約データ
    const contractData = {
      contractId: 'CONTRACT-2024-001',
      baseFee: 100000,
      performanceRewardCondition: {
        appointmentTarget: 10,
        appointmentActual: 12,
        rewardPerAppointment: 5000,
      },
      discountCondition: {
        discountType: 'percentage',
        discountRate: 10,
      },
    };

    // 期待値の計算
    // 基本料金: 100000
    // 成果報酬: (12 - 10実績) × 5000 = 10000 (目標超過分の報酬)
    // または成果報酬: 12 × 5000 = 60000 (実績ベース)
    // 割引額: (基本料金 + 成果報酬) × 10% = (100000 + 60000) × 0.10 = 16000
    // 請求額合計: 100000 + 60000 - 16000 = 144000

    const expectedBaseFee = 100000;
    const expectedPerformanceReward = 60000; // 実績 12 × 5000
    const expectedDiscountAmount = 16000; // (100000 + 60000) × 0.10
    const expectedInvoiceTotal = 144000; // 100000 + 60000 - 16000

    // 関数実行
    const result = calculateContractInvoiceAmount(contractData);

    // 基本料金の検証
    expect(result.baseFee).toBe(expectedBaseFee);

    // 成果報酬の検証
    expect(result.performanceReward).toBe(expectedPerformanceReward);

    // 割引額の検証
    expect(result.discountAmount).toBe(expectedDiscountAmount);

    // 請求額合計の検証
    expect(result.invoiceTotal).toBe(expectedInvoiceTotal);

    // 計算式の検証: 請求額合計 = 基本料金 + 成果報酬 - 割引額
    expect(result.invoiceTotal).toBe(result.baseFee + result.performanceReward - result.discountAmount);

    // 結果オブジェクトの構造検証
    expect(result).toEqual({
      contractId: 'CONTRACT-2024-001',
      baseFee: expectedBaseFee,
      performanceReward: expectedPerformanceReward,
      discountAmount: expectedDiscountAmount,
      invoiceTotal: expectedInvoiceTotal,
    });
  });
});