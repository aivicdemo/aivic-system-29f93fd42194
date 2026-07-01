import { validateResponseStatusHandling } from '../../src/logic/it-1781935279444-2-2-1';

const fetchMock = require('jest-fetch-mock');

describe('対応内容の構造化データ保存・ポータル反映機能', () => {
  // SCEN-838: 対応ステータスが無効な値の場合、エラーが返却される
  test('対応ステータスが無効な値の場合、適切なHTTPエラーステータスコードとエラーメッセージが返却され、ポータルに反映されないこと', async () => {
    fetchMock.enableMocks();
    fetchMock.resetMocks();

    // テストケース 1: 対応ステータスが 'invalid_status' の場合
    fetchMock.mockResponseOnce(
      JSON.stringify({
        status_code: 400,
        error_code: 'INVALID_STATUS',
        error_message: '対応ステータスが無効です'
      }),
      { status: 400 }
    );

    const invalid_status_payload = {
      customer_id: 'CUST001',
      response_status: 'invalid_status',
      response_content: '対応内容テスト',
      response_date: '2024-01-15T09:00:00Z',
      respondent_name: '営業担当者A'
    };

    const response_invalid_status = await validateResponseStatusHandling(invalid_status_payload);

    expect(response_invalid_status.status).toBe(400);
    expect(response_invalid_status.error_code).toBe('INVALID_STATUS');
    expect(response_invalid_status.error_message).toMatch(/対応ステータス/);
    expect(response_invalid_status.portal_reflected).toBe(false);

    // テストケース 2: 対応ステータスが空文字列の場合
    fetchMock.resetMocks();
    fetchMock.mockResponseOnce(
      JSON.stringify({
        status_code: 400,
        error_code: 'INVALID_STATUS',
        error_message: '対応ステータスが無効です'
      }),
      { status: 400 }
    );

    const empty_status_payload = {
      customer_id: 'CUST002',
      response_status: '',
      response_content: '対応内容テスト',
      response_date: '2024-01-15T10:00:00Z',
      respondent_name: '営業担当者B'
    };

    const response_empty_status = await validateResponseStatusHandling(empty_status_payload);

    expect(response_empty_status.status).toBe(400);
    expect(response_empty_status.error_code).toBe('INVALID_STATUS');
    expect(response_empty_status.error_message).toMatch(/対応ステータス/);
    expect(response_empty_status.portal_reflected).toBe(false);

    // テストケース 3: 対応ステータスが null の場合
    fetchMock.resetMocks();
    fetchMock.mockResponseOnce(
      JSON.stringify({
        status_code: 400,
        error_code: 'INVALID_STATUS',
        error_message: '対応ステータスが無効です'
      }),
      { status: 400 }
    );

    const null_status_payload = {
      customer_id: 'CUST003',
      response_status: null,
      response_content: '対応内容テスト',
      response_date: '2024-01-15T11:00:00Z',
      respondent_name: '営業担当者C'
    };

    const response_null_status = await validateResponseStatusHandling(null_status_payload);

    expect(response_null_status.status).toBe(400);
    expect(response_null_status.error_code).toBe('INVALID_STATUS');
    expect(response_null_status.error_message).toMatch(/対応ステータス/);
    expect(response_null_status.portal_reflected).toBe(false);

    // テストケース 4: 対応ステータスが未定義の場合
    fetchMock.resetMocks();
    fetchMock.mockResponseOnce(
      JSON.stringify({
        status_code: 400,
        error_code: 'INVALID_STATUS',
        error_message: '対応ステータスが無効です'
      }),
      { status: 400 }
    );

    const undefined_status_payload = {
      customer_id: 'CUST004',
      response_status: undefined,
      response_content: '対応内容テスト',
      response_date: '2024-01-15T12:00:00Z',
      respondent_name: '営業担当者D'
    };

    const response_undefined_status = await validateResponseStatusHandling(undefined_status_payload);

    expect(response_undefined_status.status).toBe(400);
    expect(response_undefined_status.error_code).toBe('INVALID_STATUS');
    expect(response_undefined_status.error_message).toMatch(/対応ステータス/);
    expect(response_undefined_status.portal_reflected).toBe(false);

    // テストケース 5: 有効な対応ステータス値で成功ケースを確認
    fetchMock.resetMocks();
    fetchMock.mockResponseOnce(
      JSON.stringify({
        status_code: 200,
        error_code: null,
        error_message: null,
        response_id: 'RESP001',
        portal_reflected: true
      }),
      { status: 200 }
    );

    const valid_status_payload = {
      customer_id: 'CUST005',
      response_status: 'confirmed',
      response_content: '対応内容テスト',
      response_date: '2024-01-15T13:00:00Z',
      respondent_name: '営業担当者E'
    };

    const response_valid_status = await validateResponseStatusHandling(valid_status_payload);

    expect(response_valid_status.status).toBe(200);
    expect(response_valid_status.error_code).toBeNull();
    expect(response_valid_status.portal_reflected).toBe(true);
    expect(response_valid_status.response_id).toBe('RESP001');

    fetchMock.disableMocks();
  });
});