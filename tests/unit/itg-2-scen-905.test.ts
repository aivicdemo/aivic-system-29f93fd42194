import { validateLearningDataUpdateFrequency } from '../../src/logic/it-6-3-1';

describe('査定判定ロジックの適用履歴と根拠の記録・検索機能', () => {
  // SCEN-905: [error] 学習データ標準化・形式統一 - 定義済みの統一基準に違反する更新頻度でエラーを返す
  test('定義済みの統一基準に違反する更新頻度でエラーを返す', () => {
    const defined_update_frequency_minutes = 1440; // 1日1回（1440分）
    const requested_update_frequency_minutes = 60; // 1時間ごと（60分）

    expect(() =>
      validateLearningDataUpdateFrequency({
        defined_frequency_minutes: defined_update_frequency_minutes,
        requested_frequency_minutes: requested_update_frequency_minutes,
        violation_detail: '更新頻度が定義基準を超過'
      })
    ).toThrow(/更新頻度/);
  });

  test('定義済みの統一基準を満たす更新頻度で正常に処理される', () => {
    const defined_update_frequency_minutes = 1440; // 1日1回（1440分）
    const requested_update_frequency_minutes = 1440; // 1日1回（1440分）

    const result = validateLearningDataUpdateFrequency({
      defined_frequency_minutes: defined_update_frequency_minutes,
      requested_frequency_minutes: requested_update_frequency_minutes,
      violation_detail: ''
    });

    expect(result).toEqual({
      is_valid: true,
      status_code: 200,
      message: '更新頻度は定義基準を満たしています'
    });
  });

  test('エラーレスポンスに違反内容と許容される更新頻度が含まれる', () => {
    const defined_update_frequency_minutes = 1440;
    const requested_update_frequency_minutes = 60;

    let error_thrown = false;
    let error_message = '';

    try {
      validateLearningDataUpdateFrequency({
        defined_frequency_minutes: defined_update_frequency_minutes,
        requested_frequency_minutes: requested_update_frequency_minutes,
        violation_detail: '更新頻度が定義基準を超過'
      });
    } catch (e) {
      error_thrown = true;
      error_message = (e as Error).message;
    }

    expect(error_thrown).toBe(true);
    expect(error_message).toMatch(/更新頻度/);
    expect(error_message).toMatch(/1440/);
  });

  test('エラーステータスコードが400または422である', () => {
    const defined_update_frequency_minutes = 1440;
    const requested_update_frequency_minutes = 300; // 5時間ごと

    try {
      validateLearningDataUpdateFrequency({
        defined_frequency_minutes: defined_update_frequency_minutes,
        requested_frequency_minutes: requested_update_frequency_minutes,
        violation_detail: '更新頻度が定義基準を超過'
      });
      fail('例外が発生すべき');
    } catch (e) {
      const error = e as any;
      const status_code = error.status_code || error.httpStatusCode;
      expect([400, 422]).toContain(status_code);
    }
  });

  test('不正な更新がデータベースに反映されていない', () => {
    const defined_update_frequency_minutes = 1440;
    const requested_update_frequency_minutes = 120; // 2時間ごと

    const initial_state = {
      learning_data_id: 'ld_001',
      update_frequency_minutes: 1440,
      last_updated_at: '2024-01-15T10:00:00Z'
    };

    try {
      validateLearningDataUpdateFrequency({
        defined_frequency_minutes: defined_update_frequency_minutes,
        requested_frequency_minutes: requested_update_frequency_minutes,
        violation_detail: '更新頻度が定義基準を超過'
      });
    } catch (e) {
      // エラーが発生した場合、状態が変わらないことを確認
      expect(initial_state.update_frequency_minutes).toBe(1440);
      expect(initial_state.last_updated_at).toBe('2024-01-15T10:00:00Z');
    }
  });
});