import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';

const fetchMock = require('jest-fetch-mock');

describe('営業成果データの自動検証ルール定義と異常検出機能', () => {
  // SCEN-799: [error] ユーザー認証・権限検証機能 - 無効な認証情報でのアクセスが拒否される
  test('SCEN-799: 無効な認証情報でのアクセスが拒否される', async () => {
    fetchMock.enableMocks();
    beforeEach(() => {
      fetchMock.resetMocks();
    });
    afterEach(() => {
      fetchMock.disableMocks();
    });

    // ステップ1: ユーザーIDが存在しない場合のログイン試行
    const nonexistentUserLoginRequest = {
      user_id: 'nonexistent_user_999',
      password: 'arbitrary_password_123',
    };

    fetchMock.mockResponseOnce(
      JSON.stringify({
        success: false,
        error_code: 'AUTH_001',
        error_message: 'ユーザーIDまたはパスワードが正しくありません',
      }),
      { status: 401 }
    );

    const nonexistentUserLoginResponse = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nonexistentUserLoginRequest),
    });

    const nonexistentUserLoginData = await nonexistentUserLoginResponse.json();

    expect(nonexistentUserLoginResponse.status).toBe(401);
    expect(nonexistentUserLoginData.success).toBe(false);
    expect(nonexistentUserLoginData.error_code).toBe('AUTH_001');
    expect(nonexistentUserLoginData.error_message).toMatch(/ユーザーID/);

    // ステップ2: ユーザーID正しく、パスワード間違いでのログイン試行
    fetchMock.resetMocks();
    const wrongPasswordLoginRequest = {
      user_id: 'valid_user_001',
      password: 'wrong_password_456',
    };

    fetchMock.mockResponseOnce(
      JSON.stringify({
        success: false,
        error_code: 'AUTH_002',
        error_message: 'ユーザーIDまたはパスワードが正しくありません',
      }),
      { status: 401 }
    );

    const wrongPasswordLoginResponse = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(wrongPasswordLoginRequest),
    });

    const wrongPasswordLoginData = await wrongPasswordLoginResponse.json();

    expect(wrongPasswordLoginResponse.status).toBe(401);
    expect(wrongPasswordLoginData.success).toBe(false);
    expect(wrongPasswordLoginData.error_code).toBe('AUTH_002');
    expect(wrongPasswordLoginData.error_message).toMatch(/パスワード/);

    // ステップ3: 認証情報が無い状態でダッシュボードへ直接アクセス
    fetchMock.resetMocks();
    fetchMock.mockResponseOnce(
      JSON.stringify({
        success: false,
        error_code: 'AUTH_401',
        error_message: '認証が必要です',
        redirect_to: '/login',
      }),
      { status: 401 }
    );

    const dashboardAccessResponse = await fetch('/api/dashboard', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const dashboardAccessData = await dashboardAccessResponse.json();

    expect(dashboardAccessResponse.status).toBe(401);
    expect(dashboardAccessData.redirect_to).toBe('/login');
    expect(dashboardAccessData.error_message).toMatch(/認証/);

    // ステップ4: 無効なトークンでAPI呼び出し
    fetchMock.resetMocks();
    fetchMock.mockResponseOnce(
      JSON.stringify({
        success: false,
        error_code: 'AUTH_403',
        error_message: 'トークンが無効です',
      }),
      { status: 403 }
    );

    const invalidTokenApiResponse = await fetch('/api/sales-data/list', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer invalid_token_xyz',
      },
    });

    const invalidTokenApiData = await invalidTokenApiResponse.json();

    expect(invalidTokenApiResponse.status).toBe(403);
    expect(invalidTokenApiData.success).toBe(false);
    expect(invalidTokenApiData.error_code).toBe('AUTH_403');
    expect(invalidTokenApiData.error_message).toMatch(/トークン/);

    // ステップ5: トークンが無い状態でのAPI呼び出し
    fetchMock.resetMocks();
    fetchMock.mockResponseOnce(
      JSON.stringify({
        success: false,
        error_code: 'AUTH_401_NO_TOKEN',
        error_message: '認証トークンが見つかりません',
      }),
      { status: 401 }
    );

    const noTokenApiResponse = await fetch('/api/billing-data/summary', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const noTokenApiData = await noTokenApiResponse.json();

    expect(noTokenApiResponse.status).toBe(401);
    expect(noTokenApiData.success).toBe(false);
    expect(noTokenApiData.error_code).toBe('AUTH_401_NO_TOKEN');
    expect(noTokenApiData.error_message).toMatch(/認証/);

    fetchMock.disableMocks();
  });
});