import { calculateDivergenceRate } from '../../src/logic/it-6-3-1';

describe('査定判定ロジックの適用履歴と根拠の記録・検索機能', () => {
  // SCEN-829: [error] 自動判定結果の相場乖離可視化 - 参照データ件数がゼロの場合、乖離率計算時にゼロ除算エラーが適切に処理される
  test('参照データ件数がゼロの場合、ゼロ除算エラーが適切にキャッチされ、代替値が返される', () => {
    // 入力: 参照データ件数が0件、見積金額100万円、相場中央値150万円のテストケース
    const input = {
      estimate_amount: 1000000,
      market_median: 1500000,
      reference_data_count: 0,
    };

    // 実行: ゼロ除算エラーハンドリング
    const result = calculateDivergenceRate(input);

    // 期待結果1: 乖離率は計算不可を示す -1 が返される
    expect(result.divergence_rate).toBe(-1);

    // 期待結果2: エラーフラグが true に設定される
    expect(result.has_error).toBe(true);

    // 期待結果3: エラーメッセージに「参照データ」キーワードが含まれる
    expect(result.error_message).toMatch(/参照データ/);

    // 期待結果4: エラーレベルが 'warn' として記録される
    expect(result.error_level).toBe('warn');

    // 期待結果5: システムは例外で停止せず、結果オブジェクトが返される
    expect(typeof result).toBe('object');
    expect(result).toHaveProperty('divergence_rate');
    expect(result).toHaveProperty('has_error');
    expect(result).toHaveProperty('error_message');
    expect(result).toHaveProperty('error_level');
  });

  test('参照データ件数が正常値の場合、乖離率が正しく計算される', () => {
    // 入力: 参照データ件数が5件、見積金額100万円、相場中央値150万円のテストケース
    const input = {
      estimate_amount: 1000000,
      market_median: 1500000,
      reference_data_count: 5,
    };

    // 実行: 正常な乖離率計算
    const result = calculateDivergenceRate(input);

    // 期待結果1: エラーフラグが false に設定される
    expect(result.has_error).toBe(false);

    // 期待結果2: 乖離率が正しく計算される（(1000000 - 1500000) / 1500000 * 100 = -33.33%）
    expect(result.divergence_rate).toBeCloseTo(-33.33, 1);

    // 期待結果3: エラーメッセージが空文字列である
    expect(result.error_message).toBe('');

    // 期待結果4: エラーレベルが 'info' として記録される
    expect(result.error_level).toBe('info');

    // 期待結果5: システムが継続動作し、結果オブジェクトが完全に返される
    expect(typeof result).toBe('object');
    expect(result).toHaveProperty('divergence_rate');
    expect(result).toHaveProperty('has_error');
    expect(result).toHaveProperty('error_message');
    expect(result).toHaveProperty('error_level');
  });

  test('相場中央値がゼロの場合、ゼロ除算エラーが適切にキャッチされ、代替値が返される', () => {
    // 入力: 相場中央値が0円のテストケース
    const input = {
      estimate_amount: 1000000,
      market_median: 0,
      reference_data_count: 5,
    };

    // 実行: ゼロ除算エラーハンドリング
    const result = calculateDivergenceRate(input);

    // 期待結果1: 乖離率は計算不可を示す -1 が返される
    expect(result.divergence_rate).toBe(-1);

    // 期待結果2: エラーフラグが true に設定される
    expect(result.has_error).toBe(true);

    // 期待結果3: エラーメッセージに「相場」キーワードが含まれる
    expect(result.error_message).toMatch(/相場/);

    // 期待結果4: エラーレベルが 'warn' として記録される
    expect(result.error_level).toBe('warn');

    // 期待結果5: システムが例外で停止せず継続動作する
    expect(typeof result).toBe('object');
  });

  test('参照データ件数とマーケット中央値の両方がゼロの場合、複合エラーが適切に処理される', () => {
    // 入力: 参照データ件数が0件かつ相場中央値が0円のテストケース
    const input = {
      estimate_amount: 1000000,
      market_median: 0,
      reference_data_count: 0,
    };

    // 実行: 複合ゼロ除算エラーハンドリング
    const result = calculateDivergenceRate(input);

    // 期待結果1: 乖離率は計算不可を示す -1 が返される
    expect(result.divergence_rate).toBe(-1);

    // 期待結果2: エラーフラグが true に設定される
    expect(result.has_error).toBe(true);

    // 期待結果3: エラーメッセージには複合エラー情報が含まれる
    expect(result.error_message).toMatch(/データ|相場/);

    // 期待結果4: エラーレベルが 'error' として記録される（より重篤）
    expect(result.error_level).toBe('error');

    // 期待結果5: システムが継続動作する
    expect(typeof result).toBe('object');
  });
});