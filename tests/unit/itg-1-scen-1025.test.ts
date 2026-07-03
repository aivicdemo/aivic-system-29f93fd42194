import { validateSalesDataInput } from '../../src/logic/it-1781935279444-2-1-1';

describe('営業データ入力時の品質検証ルール定義・実行機能', () => {
  // SCEN-1025
  test('必須項目が欠落している場合、エラーメッセージが表示される', () => {
    const inputData = {
      customerName: '',
      amount: '',
      productName: '',
    };

    expect(() => validateSalesDataInput(inputData)).toThrow(/顧客名/);
  });
});