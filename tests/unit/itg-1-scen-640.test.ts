import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { searchSalesActivities } from '../../src/logic/it-1781935279444-1-1-1';

const fetchMock = require('jest-fetch-mock');

describe('営業活動データの権限ベース検索・抽出機能', () => {
  beforeEach(() => {
    fetchMock.enableMocks();
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.disableMocks();
  });

  // SCEN-640
  test('検索条件に合致するデータがない場合は空結果が返却される', async () => {
    // Arrange: 検索条件設定（存在しない営業担当者名で検索）
    const searchParams = {
      userId: 'user_test_001',
      userRole: 'sales_staff',
      salesPersonName: 'NonExistentSalesperson',
      periodStartDate: '2024-01-01',
      periodEndDate: '2024-01-31',
      customerId: undefined,
      activityType: undefined,
    };

    // Act & Assert: API呼び出しと戻り値検証
    fetchMock.mockResponseOnce(
      JSON.stringify({
        statusCode: 200,
        data: [],
        message: '該当するデータがありません',
        success: true,
      }),
      { status: 200 }
    );

    const result = await searchSalesActivities(searchParams);

    // Assert: ステータスコード200で正常系
    expect(result.statusCode).toBe(200);

    // Assert: 空配列が返却される
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data.length).toBe(0);

    // Assert: メッセージが明確に表示される
    expect(result.message).toBe('該当するデータがありません');

    // Assert: success フラグが true（エラーではなく正常系）
    expect(result.success).toBe(true);

    // Assert: エラーコードが存在しない
    expect(result.errorCode).toBeUndefined();

    // Assert: HTTPレスポンスステータスが200
    expect(fetchMock.mock.calls.length).toBe(1);
    const fetchCall = fetchMock.mock.calls[0];
    expect(fetchCall).toBeDefined();

    // Assert: レスポンスボディ構造の確認
    expect(result).toHaveProperty('statusCode');
    expect(result).toHaveProperty('data');
    expect(result).toHaveProperty('message');
    expect(result).toHaveProperty('success');
  });
});