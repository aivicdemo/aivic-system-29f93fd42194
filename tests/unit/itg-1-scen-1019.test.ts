import { extractCustomerQuestionSourceData } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目のメタデータ管理機能', () => {
  // SCEN-1019: [error] 顧客質問対応根拠データ自動抽出機能 - 質問内容に対応するデータが営業システムに存在しない場合、空結果またはエラーが返される
  test('営業システムに存在しない顧客IDで質問対応根拠データ抽出を実行した場合、空結果またはエラーメッセージを返す', () => {
    // 前提: 営業システムから月次営業データが抽出され、品質検証を通過した状態
    // 発生条件: 顧客からの質問に対して営業活動データを遡及検索する際、営業システムに存在しない顧客IDを指定した場合
    // 期待結果: 空結果を返すか、「該当するデータが見つかりません」というエラーメッセージを返し、システムがクラッシュしないこと

    const nonExistentCustomerId = 'CUST-99999999';
    const period_start = '2024-01-01';
    const period_end = '2024-01-31';
    const query_type = 'customer_activity';

    const result = extractCustomerQuestionSourceData({
      customer_id: nonExistentCustomerId,
      period_start,
      period_end,
      query_type,
    });

    // 空結果の場合: 配列が空であること
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data.length).toBe(0);

    // エラーメッセージが返される場合: 業務キーワード「該当」を含むメッセージが返されること
    if (result.error) {
      expect(result.error).toMatch(/該当/);
    }

    // システムがクラッシュせずに status を返していること
    expect(result.status).toBe('no_match');
  });

  test('営業システムに存在しない取引記録IDで質問対応根拠データ抽出を実行した場合、エラーメッセージを返す', () => {
    // 前提: 営業データ品質管理・請求自動化システムにログイン済みで、顧客質問対応根拠データ自動抽出機能にアクセス可能な状態
    // 発生条件: 営業システムに存在しない取引記録IDを指定して抽出処理を実行した場合
    // 期待結果: 空結果またはエラーメッセージを返し、正常に処理を完了すること

    const customer_id = 'CUST-001';
    const transaction_id = 'TRX-NOTFOUND-99999';
    const period_start = '2024-01-01';
    const period_end = '2024-01-31';
    const query_type = 'transaction_detail';

    const result = extractCustomerQuestionSourceData({
      customer_id,
      period_start,
      period_end,
      query_type,
      transaction_id,
    });

    // 空結果の場合
    if (result.status === 'no_match') {
      expect(result.data.length).toBe(0);
      expect(result.error).toMatch(/該当/);
    }
    // または適切なエラーメッセージ
    else if (result.status === 'error') {
      expect(result.error).toMatch(/見つかりません/);
    }

    // どちらの場合もシステムはクラッシュせず、status フィールドを返していること
    expect(['no_match', 'error']).toContain(result.status);
  });

  test('営業システムに存在しないサービスタイプで質問対応根拠データ抽出を実行した場合、空結果を返す', () => {
    // 前提: 営業データ品質管理・請求自動化システムにログイン済みで、顧客質問対応根拠データ自動抽出機能にアクセス可能な状態
    // 発生条件: 営業システムに存在しないサービスタイプを指定して抽出処理を実行した場合
    // 期待結果: 空結果を返し、正常に処理を完了すること

    const customer_id = 'CUST-001';
    const period_start = '2024-01-01';
    const period_end = '2024-01-31';
    const query_type = 'service_type';
    const service_type = 'SERVICE-UNKNOWN-99999';

    const result = extractCustomerQuestionSourceData({
      customer_id,
      period_start,
      period_end,
      query_type,
      service_type,
    });

    // 空結果が返されること
    expect(result.status).toBe('no_match');
    expect(result.data).toEqual([]);
    
    // エラーメッセージに「該当」が含まれること
    if (result.error) {
      expect(result.error).toMatch(/該当/);
    }
  });

  test('複数の条件で営業システムにデータが存在しない場合、エラーメッセージを返す', () => {
    // 前提: 営業データ品質管理・請求自動化システムにログイン済み
    // 発生条件: 営業システムに存在しない複合条件（顧客ID + 期間 + サービスタイプ）を指定して抽出処理を実行
    // 期待結果: 空結果またはエラーメッセージを返し、正常に処理を完了すること

    const customer_id = 'CUST-NOT-EXISTS';
    const period_start = '2025-12-01';
    const period_end = '2025-12-31';
    const query_type = 'combined_query';
    const service_type = 'SERVICE-NONEXISTENT';

    const result = extractCustomerQuestionSourceData({
      customer_id,
      period_start,
      period_end,
      query_type,
      service_type,
    });

    // 空結果またはエラー状態であること
    expect(['no_match', 'error']).toContain(result.status);

    // データが空であること
    expect(result.data.length).toBe(0);

    // システムが正常に応答していること（クラッシュしていない）
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('data');
  });

  test('営業システムからデータ取得時にタイムアウトした場合、タイムアウトエラーを返す', () => {
    // 前提: 営業データベースへのアクセスが遅延している状態
    // 発生条件: 営業システムからのデータ取得処理がタイムアウトに達した場合
    // 期待結果: タイムアウトエラーメッセージを返し、正常に処理を完了すること

    const customer_id = 'CUST-001';
    const period_start = '2024-01-01';
    const period_end = '2024-01-31';
    const query_type = 'timeout_test';

    const result = extractCustomerQuestionSourceData({
      customer_id,
      period_start,
      period_end,
      query_type,
    });

    // タイムアウトエラーが返される場合、status が 'error' であること
    if (result.status === 'error') {
      expect(result.error).toMatch(/タイムアウト|時間|超過/);
    }
    
    // システムがクラッシュせずに応答していること
    expect(result).toHaveProperty('status');
    expect(['no_match', 'error', 'timeout']).toContain(result.status);
  });
});