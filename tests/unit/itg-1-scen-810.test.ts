import { describe, test, expect, beforeEach } from '@jest/globals';
import { searchMailHistory } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目のメタデータ管理機能 - メール履歴検索・フィルタリング', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-810
  test('無効な日付範囲が指定された場合にエラーが返却される', async () => {
    const start_date = '2024-12-31';
    const end_date = '2024-12-01';
    const customer_id = 'CUST-001';

    const search_params = {
      start_date,
      end_date,
      customer_id
    };

    let error_thrown = false;
    let error_message = '';

    try {
      await searchMailHistory(search_params);
    } catch (err: any) {
      error_thrown = true;
      error_message = err.message;
    }

    expect(error_thrown).toBe(true);
    expect(error_message).toMatch(/終了日付は開始日付以降の日付を指定してください/);
  });
});