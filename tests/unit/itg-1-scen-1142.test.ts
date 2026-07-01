import { calculateAggregation } from '../../src/logic/it-1781935279444-2-1-1';

describe('営業データ入力時の品質検証ルール定義・実行機能', () => {
  // SCEN-1142: [error] 営業データメタデータに基づく集計検証 - 計算式に参照される項目が欠落している場合、計算不可エラーとして通知される
  test('計算式に参照される項目が欠落していることを検出し、計算不可エラーとして処理が中断される', () => {
    // 準備：メタデータに計算式を定義
    const metadata = {
      item_id: 'sales_amount',
      item_name: '売上金額',
      formula: 'unit_price * quantity + discount_amount',
      referenced_fields: ['unit_price', 'quantity', 'discount_amount'],
    };

    // 準備：営業データから「discount_amount」フィールドを意図的に削除
    const sales_data = {
      unit_price: 1000,
      quantity: 5,
      // discount_amount は欠落している
    };

    // 実行：集計処理（計算式評価）を実行
    const execute_aggregation = () => {
      return calculateAggregation({
        metadata: metadata,
        data: sales_data,
      });
    };

    // 検証：計算式に参照される項目が欠落していることを検出し、エラーが発生する
    expect(execute_aggregation).toThrow(/discount_amount/);

    // 補足：エラーがスロー時点で、エラーログおよびユーザー通知画面への記録は
    // エラー処理の責務（ロギング・通知ミドルウェア）に委譲
  });
});