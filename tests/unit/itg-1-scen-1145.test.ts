import { calculateBillingAmount } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  // SCEN-1145: [error] 請求額自動計算・集計機能 - 請求対象項目マッピングが見つからない場合にエラーが発生する
  test('請求対象項目マッピングが見つからない場合はエラーをスローする', () => {
    const salesData = {
      customerId: 'CUST-001',
      serviceId: 'SVC-A',
      appointmentCount: 5,
      contractCount: 2,
      customerReaction: 'positive',
    };

    const billingMappingList = [] as any[];

    expect(() => {
      calculateBillingAmount(salesData, billingMappingList);
    }).toThrow(/請求対象項目マッピング/);
  });
});