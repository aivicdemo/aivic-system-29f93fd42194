import { authenticateUser } from '../../src/logic/it-1-1-1';

describe('User Authentication and Authorization - Empty or Null Credentials Rejection', () => {
  // SCEN-801: [edge] ユーザー認証・権限検証機能 - 認証情報が空文字列またはnullの場合にアクセスが拒否される
  test('should reject authentication when username or password is empty string or null', async () => {
    // Test Case 1: Both username and password are empty strings
    const result_empty_both = await authenticateUser({
      username: '',
      password: ''
    });
    expect(result_empty_both.authenticated).toBe(false);
    expect(result_empty_both.token).toBeNull();
    expect(result_empty_both.error).toMatch(/ユーザー名またはパスワード/);
    expect(result_empty_both.errorLog).toContain('認証失敗');

    // Test Case 2: Username is null, password is empty string
    const result_null_username_empty_password = await authenticateUser({
      username: null as any,
      password: ''
    });
    expect(result_null_username_empty_password.authenticated).toBe(false);
    expect(result_null_username_empty_password.token).toBeNull();
    expect(result_null_username_empty_password.error).toMatch(/ユーザー名またはパスワード/);
    expect(result_null_username_empty_password.errorLog).toContain('認証失敗');

    // Test Case 3: Username is empty string, password is null
    const result_empty_username_null_password = await authenticateUser({
      username: '',
      password: null as any
    });
    expect(result_empty_username_null_password.authenticated).toBe(false);
    expect(result_empty_username_null_password.token).toBeNull();
    expect(result_empty_username_null_password.error).toMatch(/ユーザー名またはパスワード/);
    expect(result_empty_username_null_password.errorLog).toContain('認証失敗');

    // Test Case 4: Both username and password are null
    const result_null_both = await authenticateUser({
      username: null as any,
      password: null as any
    });
    expect(result_null_both.authenticated).toBe(false);
    expect(result_null_both.token).toBeNull();
    expect(result_null_both.error).toMatch(/ユーザー名またはパスワード/);
    expect(result_null_both.errorLog).toContain('認証失敗');

    // Test Case 5: Valid username, empty password
    const result_valid_username_empty_password = await authenticateUser({
      username: 'testuser@example.com',
      password: ''
    });
    expect(result_valid_username_empty_password.authenticated).toBe(false);
    expect(result_valid_username_empty_password.token).toBeNull();
    expect(result_valid_username_empty_password.error).toMatch(/ユーザー名またはパスワード/);
    expect(result_valid_username_empty_password.errorLog).toContain('認証失敗');

    // Test Case 6: Valid username, null password
    const result_valid_username_null_password = await authenticateUser({
      username: 'testuser@example.com',
      password: null as any
    });
    expect(result_valid_username_null_password.authenticated).toBe(false);
    expect(result_valid_username_null_password.token).toBeNull();
    expect(result_valid_username_null_password.error).toMatch(/ユーザー名またはパスワード/);
    expect(result_valid_username_null_password.errorLog).toContain('認証失敗');

    // Test Case 7: Empty username, valid password
    const result_empty_username_valid_password = await authenticateUser({
      username: '',
      password: 'ValidPassword123!'
    });
    expect(result_empty_username_valid_password.authenticated).toBe(false);
    expect(result_empty_username_valid_password.token).toBeNull();
    expect(result_empty_username_valid_password.error).toMatch(/ユーザー名またはパスワード/);
    expect(result_empty_username_valid_password.errorLog).toContain('認証失敗');

    // Test Case 8: Null username, valid password
    const result_null_username_valid_password = await authenticateUser({
      username: null as any,
      password: 'ValidPassword123!'
    });
    expect(result_null_username_valid_password.authenticated).toBe(false);
    expect(result_null_username_valid_password.token).toBeNull();
    expect(result_null_username_valid_password.error).toMatch(/ユーザー名またはパスワード/);
    expect(result_null_username_valid_password.errorLog).toContain('認証失敗');

    // Verify that no authentication token is generated in any failure case
    expect(result_empty_both.token).toBeNull();
    expect(result_null_username_empty_password.token).toBeNull();
    expect(result_empty_username_null_password.token).toBeNull();
    expect(result_null_both.token).toBeNull();
    expect(result_valid_username_empty_password.token).toBeNull();
    expect(result_valid_username_null_password.token).toBeNull();
    expect(result_empty_username_valid_password.token).toBeNull();
    expect(result_null_username_valid_password.token).toBeNull();

    // Verify that system error logs contain authentication failure records
    expect(result_empty_both.errorLog).toMatch(/認証失敗/);
    expect(result_null_username_empty_password.errorLog).toMatch(/認証失敗/);
    expect(result_empty_username_null_password.errorLog).toMatch(/認証失敗/);
    expect(result_null_both.errorLog).toMatch(/認証失敗/);
    expect(result_valid_username_empty_password.errorLog).toMatch(/認証失敗/);
    expect(result_valid_username_null_password.errorLog).toMatch(/認証失敗/);
    expect(result_empty_username_valid_password.errorLog).toMatch(/認証失敗/);
    expect(result_null_username_valid_password.errorLog).toMatch(/認証失敗/);
  });
});