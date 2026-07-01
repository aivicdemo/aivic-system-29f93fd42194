import { recordExceptionCase } from '../../src/logic/it-1781935279444-2-1-1';

describe('営業データ入力時の品質検証ルール定義・実行機能', () => {
  // SCEN-926: [error] 例外ケース・判断基準の構造化記録機能 - レポート集計ステップで例外内容が空文字列または NULL の場合、記録が拒否される
  test('例外内容が空文字列の場合、記録が拒否されエラーメッセージが返却される', () => {
    const input = {
      step_name: 'report_aggregation',
      exception_content: '',
      judgment_basis: '月次締め日の営業データ集計時に予期しないデータ型検出',
      response_action: '営業担当者に修正指示を通知',
      recorded_at: '2024-01-15T09:30:00Z',
      recorded_by: 'user_001'
    };

    expect(() => recordExceptionCase(input)).toThrow(/例外内容/);
  });

  test('例外内容が NULL の場合、記録が拒否されエラーメッセージが返却される', () => {
    const input = {
      step_name: 'report_aggregation',
      exception_content: null,
      judgment_basis: '月次締め日の営業データ集計時に予期しないデータ型検出',
      response_action: '営業担当者に修正指示を通知',
      recorded_at: '2024-01-15T09:30:00Z',
      recorded_by: 'user_001'
    };

    expect(() => recordExceptionCase(input)).toThrow(/例外内容/);
  });

  test('例外内容が有効な文字列の場合、記録が成功し記録ID が返却される', () => {
    const input = {
      step_name: 'report_aggregation',
      exception_content: 'レポート集計ステップで成約数フィールドが負の値で検出された',
      judgment_basis: '月次締め日の営業データ集計時に予期しないデータ型検出',
      response_action: '営業担当者に修正指示を通知',
      recorded_at: '2024-01-15T09:30:00Z',
      recorded_by: 'user_001'
    };

    const result = recordExceptionCase(input);

    expect(result).toHaveProperty('record_id');
    expect(result.record_id).toBeTruthy();
    expect(result).toHaveProperty('status');
    expect(result.status).toBe('recorded');
    expect(result).toHaveProperty('exception_content');
    expect(result.exception_content).toBe('レポート集計ステップで成約数フィールドが負の値で検出された');
    expect(result).toHaveProperty('created_at');
  });

  test('複数の有効なレコードが記録される場合、各レコードが一意の ID を持つ', () => {
    const input1 = {
      step_name: 'data_quality_check',
      exception_content: '必須項目「顧客名」が欠落した営業データを検出',
      judgment_basis: '月次営業データ品質検証ステップ',
      response_action: '営業担当者に修正指示を通知',
      recorded_at: '2024-01-15T08:00:00Z',
      recorded_by: 'user_001'
    };

    const input2 = {
      step_name: 'report_aggregation',
      exception_content: 'レポート集計時にアポ数合計が前月比で 200% を超過',
      judgment_basis: '月次レポート生成ステップの異常値判定',
      response_action: '営業マネージャーに確認を要求',
      recorded_at: '2024-01-15T10:15:00Z',
      recorded_by: 'user_002'
    };

    const result1 = recordExceptionCase(input1);
    const result2 = recordExceptionCase(input2);

    expect(result1.record_id).not.toBe(result2.record_id);
    expect(result1.status).toBe('recorded');
    expect(result2.status).toBe('recorded');
  });

  test('例外内容にのみ空文字列が含まれ他フィールドが有効な場合、記録が拒否される', () => {
    const input = {
      step_name: 'report_aggregation',
      exception_content: '',
      judgment_basis: '月次締め日の営業データ集計時に予期しないデータ型検出',
      response_action: '営業担当者に修正指示を通知',
      recorded_at: '2024-01-15T09:30:00Z',
      recorded_by: 'user_001'
    };

    expect(() => recordExceptionCase(input)).toThrow(/例外内容/);
  });

  test('例外内容に空白のみが含まれる場合、記録が拒否される', () => {
    const input = {
      step_name: 'report_aggregation',
      exception_content: '   ',
      judgment_basis: '月次締め日の営業データ集計時に予期しないデータ型検出',
      response_action: '営業担当者に修正指示を通知',
      recorded_at: '2024-01-15T09:30:00Z',
      recorded_by: 'user_001'
    };

    expect(() => recordExceptionCase(input)).toThrow(/例外内容/);
  });

  test('例外内容が定義済みの有効な値である場合、記録が成功しメタデータが正確に保存される', () => {
    const input = {
      step_name: 'request_aggregation',
      exception_content: '請求額計算ステップで割引率が 100% を超過した顧客データを検出',
      judgment_basis: '請求額計算ロジック検証時の上限チェック',
      response_action: '契約内容を再確認し営業マネージャーに報告',
      recorded_at: '2024-01-15T11:45:00Z',
      recorded_by: 'user_003'
    };

    const result = recordExceptionCase(input);

    expect(result).toHaveProperty('step_name');
    expect(result.step_name).toBe('request_aggregation');
    expect(result).toHaveProperty('judgment_basis');
    expect(result.judgment_basis).toBe('請求額計算ロジック検証時の上限チェック');
    expect(result).toHaveProperty('response_action');
    expect(result.response_action).toBe('契約内容を再確認し営業マネージャーに報告');
    expect(result.status).toBe('recorded');
  });
});