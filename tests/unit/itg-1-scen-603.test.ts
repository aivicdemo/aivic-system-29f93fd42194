import { calculateInvoiceAmount } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  // SCEN-603: [error] 請求額計算機能 - 契約書の単価が未設定の場合にエラーが発生する
  test('契約書の単価が未設定の場合、単価未設定エラーが発生して請求額計算が中止される', () => {
    const contract_id = 'CTR-20240115-001';
    const customer_id = 'CUST-001';
    const service_id = 'SVC-001';
    const unit_price = null;
    const quantity = 5;
    const discount_rate = 0;

    expect(() => {
      calculateInvoiceAmount({
        contract_id,
        customer_id,
        service_id,
        unit_price,
        quantity,
        discount_rate,
      });
    }).toThrow(/単価/);
  });
});