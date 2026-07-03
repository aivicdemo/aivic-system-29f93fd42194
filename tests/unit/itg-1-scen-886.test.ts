import { applyDiscountAndCampaign } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  // SCEN-886: [error] 割引・キャンペーン適用判定機能 - 成果データが割引条件に満たない場合は割引が適用されない
  test('成果データが割引条件に満たない場合、割引が適用されない', () => {
    const performanceData = {
      customerId: 'CUST-001',
      serviceId: 'SVC-A',
      appointmentCount: 2,
      contractAmount: 450000,
      targetProductFlag: false,
      campaignEligibilityFlag: false,
    };

    const discountRules = {
      minimumAmountForDiscount: 500000,
      targetProducts: ['PROD-X', 'PROD-Y'],
      discountRate: 0.1,
      campaignMinimumAppointments: 5,
    };

    const result = applyDiscountAndCampaign(performanceData, discountRules);

    expect(result.discountApplied).toBe(false);
    expect(result.discountAmount).toBe(0);
    expect(result.discountFlag).toBe(false);
    expect(result.billingAmount).toBe(450000);
    expect(result.originalAmount).toBe(450000);
  });
});