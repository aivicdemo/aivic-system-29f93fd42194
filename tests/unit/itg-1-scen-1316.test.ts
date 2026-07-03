import { calculateRetroactiveAdjustment } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  // SCEN-1316
  test('契約変更に基づく請求遡及調整 - 遡及調整対象の過去請求データが存在しない場合、エラーが発生する', () => {
    const contract_change_info = {
      change_date: '2024-01-15',
      customer_id: 'CUST001',
      service_id: 'SVC001',
      old_rate: 100,
      new_rate: 150,
      retroactive_start_date: '2024-01-01'
    };

    const past_billing_data = [];

    expect(() => {
      calculateRetroactiveAdjustment(contract_change_info, past_billing_data);
    }).toThrow(/遡及調整対象の過去請求データが見つかりません/);
  });
});