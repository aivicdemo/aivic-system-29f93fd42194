import { calculateBillingAmount } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  test('SCEN-978: 複数サービス組み合わせ時の集計計算が手順書ルールに合致して正常と判定される', () => {
    // 複数サービスを含む請求データを準備
    const billingInput = {
      customerId: 'cust_001',
      serviceItems: [
        {
          serviceId: 'svc_A',
          serviceName: 'サービスA',
          unitPrice: 10000,
          quantity: 1,
        },
        {
          serviceId: 'svc_B',
          serviceName: 'サービスB',
          unitPrice: 15000,
          quantity: 1,
        },
        {
          serviceId: 'svc_C',
          serviceName: 'サービスC',
          unitPrice: 5000,
          quantity: 1,
        },
      ],
      discountRuleForMultipleServices: {
        isApplicable: true,
        discountRate: 0.05, // 複数サービス利用時5%割引
      },
      taxRate: 0.1, // 税率10%
    };

    // システムで複数サービス組み合わせ時の集計計算を実行
    const result = calculateBillingAmount(billingInput);

    // 各サービスの個別料金を確認
    expect(result.serviceDetails[0].serviceName).toBe('サービスA');
    expect(result.serviceDetails[0].serviceAmount).toBe(10000);

    expect(result.serviceDetails[1].serviceName).toBe('サービスB');
    expect(result.serviceDetails[1].serviceAmount).toBe(15000);

    expect(result.serviceDetails[2].serviceName).toBe('サービスC');
    expect(result.serviceDetails[2].serviceAmount).toBe(5000);

    // 計算結果の小計（30,000円）を確認
    expect(result.subtotal).toBe(30000);

    // 割引ルール適用後の金額（28,500円）を確認
    const discountAmount = 30000 * 0.05; // 1,500円
    const discountedAmount = 30000 - discountAmount; // 28,500円
    expect(result.discountedAmount).toBe(28500);

    // 税金計算
    const taxAmount = 28500 * 0.1; // 2,850円
    const finalAmount = 28500 + taxAmount; // 31,350円

    // 最終請求額（31,350円）を確認
    expect(result.totalBillingAmount).toBe(31350);

    // 計算ロジックが手順書のルールに準拠していることを検証
    expect(result.calculationLog).toEqual({
      step1_subtotal: 30000,
      step2_discountApplied: true,
      step2_discountRate: 0.05,
      step2_discountAmount: 1500,
      step2_afterDiscount: 28500,
      step3_taxRate: 0.1,
      step3_taxAmount: 2850,
      step3_finalAmount: 31350,
    });

    expect(result.isCompliantWithHandbook).toBe(true);
  });
});