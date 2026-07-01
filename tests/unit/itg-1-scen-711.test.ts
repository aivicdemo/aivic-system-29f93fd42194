import { validateSalesDataQuality } from '../../src/logic/it-1781935279444-2-1-1';

describe('営業データ入力時の品質検証ルール定義・実行機能', () => {
  test('SCEN-711: ステータスが提案中のまま成約金額が入力された場合に矛盾を検出する', () => {
    const sales_data_input = {
      status: 'proposal',
      contract_amount: 1000000,
      customer_name: 'テスト顧客',
      contact_date: '2024-01-15',
      service_type: 'standard',
    };

    expect(() => {
      validateSalesDataQuality(sales_data_input);
    }).toThrow(/成約金額/);
  });
});