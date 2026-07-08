import { detectQuoteAmountDeviation } from '../../src/logic/it-6-3-1';

describe('査定判定ロジックの適用履歴と根拠の記録・検索機能', () => {
  test('SCEN-1332: 参照データが存在しない場合、相場範囲の判定が実行されず、エラーハンドリングで処理が中断される', () => {
    // テストデータ: 参照データが存在しない状態
    const quote_amount = 1500000;
    const quote_id = 'Q-2024-001';
    const reference_data = [];
    const quote_item_name = '鉄筋コンクリート打設';
    const tolerance_lower = 0.85;
    const tolerance_upper = 1.15;

    // エラーハンドリング: 参照データが存在しないため、相場判定が実行されず、エラーが発生
    const result = detectQuoteAmountDeviation({
      quote_amount,
      quote_id,
      reference_data,
      quote_item_name,
      tolerance_lower,
      tolerance_upper,
    });

    // 期待結果: エラー状態を示すオブジェクトが返される
    expect(result).toEqual({
      success: false,
      error_code: 'NO_REFERENCE_DATA',
      error_message: '参照データが存在しません',
      quote_id,
      judgment_skipped: true,
      deviation_rate: null,
      deviation_amount: null,
      is_within_tolerance: null,
      processed_at: expect.any(String),
    });

    // 期待結果: エラーメッセージが正しく記録されている
    expect(result.error_message).toMatch(/参照データ/);

    // 期待結果: 相場範囲の判定処理がスキップされたことを確認
    expect(result.judgment_skipped).toBe(true);

    // 期待結果: 処理が中断されたため、乖離率・乖離額がnullであることを確認
    expect(result.deviation_rate).toBeNull();
    expect(result.deviation_amount).toBeNull();
    expect(result.is_within_tolerance).toBeNull();

    // 期待結果: processed_at がISO 8601形式の文字列で記録されている
    expect(typeof result.processed_at).toBe('string');
    expect(result.processed_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});