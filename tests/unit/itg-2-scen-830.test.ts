import { calculateDivergenceRate } from '../../src/logic/it-6-3-1';

describe('査定判定ロジックの適用履歴と根拠の記録・検索機能', () => {
  // SCEN-830: [edge] 自動判定結果の相場乖離可視化 - 乖離率が 0% の境界値ケースで乖離額もゼロと正確に判定される
  test('乖離率が0%の場合、乖離額は正確にゼロとなる', () => {
    // 手順: テストデータとして乖離率が正確に0%となるケースを設定
    // 自動判定価格 = 相場価格の場合
    const market_price = 1000000;
    const assessed_price = 1000000;
    const quantity = 1;

    // 乖離額を計算: (自動判定価格 - 相場価格) × 数量
    const divergence_amount = (assessed_price - market_price) * quantity;

    // 乖離率を計算: (乖離額 / 相場価格) × 100
    // structured.formula に基づき、相場価格がゼロでない場合の計算
    const divergence_rate = (divergence_amount / market_price) * 100;

    // 計算結果をアサーションで検証
    // 乖離額がゼロであることを確認
    expect(divergence_amount).toBe(0);

    // 乖離率が0%であることを確認
    expect(divergence_rate).toBe(0);

    // 実装関数を呼び出して、浮動小数点演算の丸め誤差がないことを確認
    const result = calculateDivergenceRate({
      market_price,
      assessed_price,
      quantity,
    });

    // 関数から返される乖離率がちょうど0であることを確認
    expect(result.divergence_rate).toBe(0);

    // 関数から返される乖離額がちょうど0であることを確認
    expect(result.divergence_amount).toBe(0);

    // 画面上に表示される値が正確に0として表示されることを確認
    expect(typeof result.divergence_rate).toBe('number');
    expect(typeof result.divergence_amount).toBe('number');
    expect(isFinite(result.divergence_rate)).toBe(true);
    expect(isFinite(result.divergence_amount)).toBe(true);
  });
});