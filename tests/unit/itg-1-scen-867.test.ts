import { extractContractHistoryAndBillingData } from '../../src/logic/it-1781935279444-2-1-1';

describe('契約履歴と請求データの時系列抽出機能', () => {
  test('SCEN-867: 開始日が終了日より後の場合にバリデーションエラーが返される', () => {
    const start_date = new Date('2024-12-31T00:00:00Z');
    const end_date = new Date('2024-01-01T00:00:00Z');
    const customer_id = 'CUST-001';

    expect(() =>
      extractContractHistoryAndBillingData({
        start_date,
        end_date,
        customer_id,
      })
    ).toThrow(/開始日/);
  });
});