import { calculateBillingAmountByCustomerService } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  // SCEN-1290
  test('割引適用により請求額が最小請求額を下回る場合に、最小請求額が確定額として選択される', () => {
    // 前提: 顧客マスタに最小請求額が設定されている顧客を選択する
    // 当該顧客に対して複数のサービスを適用し、基本料金を設定する
    // 割引条件を設定する（期間限定割引、数量割引など）
    
    const input = {
      customerId: 'CUST001',
      customerName: '顧客A',
      minimumBillingAmount: 100000, // 最小請求額: 100,000円
      services: [
        {
          serviceId: 'SVC001',
          serviceName: 'サービスA',
          baseAmount: 150000, // 基本料金: 150,000円
          quantity: 1,
          unitPrice: 150000
        },
        {
          serviceId: 'SVC002',
          serviceName: 'サービスB',
          baseAmount: 80000, // 基本料金: 80,000円
          quantity: 1,
          unitPrice: 80000
        }
      ],
      discounts: [
        {
          discountId: 'DISC001',
          discountType: 'period', // 期間限定割引
          discountRate: 0.5 // 50%割引
        },
        {
          discountId: 'DISC002',
          discountType: 'quantity', // 数量割引
          discountRate: 0.3 // 30%割引
        }
      ],
      billingPeriod: '2024-01'
    };

    // 期待値計算:
    // 基本請求額 = 150,000 + 80,000 = 230,000円
    // 割引1適用後 = 230,000 × (1 - 0.5) = 115,000円
    // 割引2適用後 = 115,000 × (1 - 0.3) = 80,500円
    // 割引後請求額 80,500円 < 最小請求額 100,000円
    // → 確定額 = 最小請求額 = 100,000円

    const result = calculateBillingAmountByCustomerService(input);

    // 基本請求額の検証
    expect(result.subtotalAmount).toBe(230000);

    // 割引1適用後の検証
    expect(result.amountAfterFirstDiscount).toBe(115000);

    // 割引2適用後の検証（割引適用後の請求額）
    expect(result.discountedAmount).toBe(80500);

    // 最小請求額と比較して確定額が決定されたことを検証
    expect(result.isBelowMinimumBilling).toBe(true);

    // 最終確定額が最小請求額と一致することを検証
    expect(result.finalBillingAmount).toBe(100000);

    // ログに割引適用時の処理と最小請求額への調整内容が記録されていることを検証
    expect(result.logs).toEqual([
      {
        message: '基本請求額を計算しました',
        amount: 230000,
        timestamp: expect.any(String)
      },
      {
        message: '割引1を適用しました',
        discountType: 'period',
        discountRate: 0.5,
        amount: 115000,
        timestamp: expect.any(String)
      },
      {
        message: '割引2を適用しました',
        discountType: 'quantity',
        discountRate: 0.3,
        amount: 80500,
        timestamp: expect.any(String)
      },
      {
        message: '請求額が最小請求額を下回っているため、最小請求額を適用します',
        discountedAmount: 80500,
        minimumBillingAmount: 100000,
        finalBillingAmount: 100000,
        timestamp: expect.any(String)
      }
    ]);

    // 顧客ID、請求期間の検証
    expect(result.customerId).toBe('CUST001');
    expect(result.billingPeriod).toBe('2024-01');

    // 適用されたサービス数の検証
    expect(result.appliedServiceCount).toBe(2);
  });
});