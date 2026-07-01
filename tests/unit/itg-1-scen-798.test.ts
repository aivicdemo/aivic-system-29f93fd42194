import { authenticateUser, checkUserPermissions } from '../../src/logic/it-1-1-1';

describe('営業成果データの自動検証ルール定義と異常検出機能', () => {
  // SCEN-798: [normal] ユーザー認証・権限検証機能 - 有効な認証情報と適切な権限を持つユーザーのアクセスが許可される
  test('有効な認証情報と適切な権限を持つユーザーのアクセスが許可される', () => {
    // 前提: システムのログイン画面にアクセスする
    const userId = 'sales_user_001';
    const password = 'correct_password_hash';
    const systemId = 'sales_system_001';

    // 実行: 有効なユーザーID と正しいパスワードでログインする
    const authResult = authenticateUser({
      userId,
      password,
      systemId,
      loginTimestamp: new Date('2024-01-15T09:00:00Z').toISOString(),
    });

    // 検証: 認証処理が成功し、アクセストークンが発行される
    expect(authResult.success).toBe(true);
    expect(authResult.accessToken).toBeDefined();
    expect(authResult.accessToken).toMatch(/^[A-Za-z0-9_\-]+$/);
    expect(authResult.userId).toBe(userId);
    expect(authResult.authenticatedAt).toBe(new Date('2024-01-15T09:00:00Z').toISOString());

    // 実行: ユーザーに割り当てられた権限を確認する
    const permissionResult = checkUserPermissions({
      userId,
      accessToken: authResult.accessToken,
      systemId,
      requestedActions: [
        'view_sales_data',
        'manage_billing',
        'generate_reports',
        'search_transactions',
      ],
    });

    // 検証: ユーザーの権限に応じたメニュー項目と機能が利用可能であることを確認
    expect(permissionResult.hasPermission).toBe(true);
    expect(permissionResult.grantedPermissions).toContain('view_sales_data');
    expect(permissionResult.grantedPermissions).toContain('manage_billing');
    expect(permissionResult.grantedPermissions).toContain('generate_reports');
    expect(permissionResult.grantedPermissions).toContain('search_transactions');
    expect(permissionResult.deniedPermissions).toEqual([]);
    expect(permissionResult.dashboardMenuItems).toContain('営業データ閲覧');
    expect(permissionResult.dashboardMenuItems).toContain('請求管理');
    expect(permissionResult.dashboardMenuItems).toContain('レポート生成');
    expect(permissionResult.dashboardMenuItems).toContain('トランザクション検索');

    // 検証: ユーザーの権限レベルが適切に設定されていることを確認
    expect(permissionResult.userRole).toBe('sales_operator');
    expect(permissionResult.roleLevel).toBe(2);

    // 検証: アクセス権限の有効期限が設定されていることを確認
    expect(permissionResult.tokenExpiresAt).toBeDefined();
    const expirationTime = new Date(permissionResult.tokenExpiresAt).getTime();
    const loginTime = new Date('2024-01-15T09:00:00Z').getTime();
    const tokenValidityMs = expirationTime - loginTime;
    expect(tokenValidityMs).toBe(8 * 60 * 60 * 1000); // 8時間

    // 検証: すべての権限に対応する機能がアクセス可能な状態であることを確認
    expect(permissionResult.accessibleFeatures).toContain('データ検索');
    expect(permissionResult.accessibleFeatures).toContain('請求書生成');
    expect(permissionResult.accessibleFeatures).toContain('成果レポート生成');
    expect(permissionResult.accessibleFeatures.length).toBe(7);

    // 検証: システムログに認証情報が記録されていることを確認
    expect(permissionResult.auditLog).toBeDefined();
    expect(permissionResult.auditLog.loginUserId).toBe(userId);
    expect(permissionResult.auditLog.systemId).toBe(systemId);
    expect(permissionResult.auditLog.loginSuccessful).toBe(true);
    expect(permissionResult.auditLog.permissionCheckTimestamp).toBeDefined();
  });

  test('無効な認証情報でのログインが拒否される', () => {
    const userId = 'sales_user_001';
    const invalidPassword = 'wrong_password_hash';
    const systemId = 'sales_system_001';

    const authResult = authenticateUser({
      userId,
      password: invalidPassword,
      systemId,
      loginTimestamp: new Date('2024-01-15T09:00:00Z').toISOString(),
    });

    expect(authResult.success).toBe(false);
    expect(authResult.accessToken).toBeUndefined();
    expect(authResult.errorCode).toBe('INVALID_CREDENTIALS');
  });

  test('ユーザーが権限を持たない機能へのアクセスが拒否される', () => {
    const userId = 'sales_user_001';
    const accessToken = 'valid_token_abc123';
    const systemId = 'sales_system_001';

    const permissionResult = checkUserPermissions({
      userId,
      accessToken,
      systemId,
      requestedActions: [
        'view_sales_data',
        'admin_user_management',
        'system_configuration',
      ],
    });

    expect(permissionResult.hasPermission).toBe(false);
    expect(permissionResult.grantedPermissions).toContain('view_sales_data');
    expect(permissionResult.deniedPermissions).toContain('admin_user_management');
    expect(permissionResult.deniedPermissions).toContain('system_configuration');
    expect(permissionResult.deniedPermissions.length).toBe(2);
  });

  test('無効なアクセストークンでの権限チェックが拒否される', () => {
    const userId = 'sales_user_001';
    const invalidToken = 'expired_or_invalid_token';
    const systemId = 'sales_system_001';

    expect(() =>
      checkUserPermissions({
        userId,
        accessToken: invalidToken,
        systemId,
        requestedActions: ['view_sales_data'],
      })
    ).toThrow(/トークン/);
  });

  test('無効なユーザーIDでの認証がエラーを返す', () => {
    const invalidUserId = 'nonexistent_user_999';
    const password = 'some_password_hash';
    const systemId = 'sales_system_001';

    expect(() =>
      authenticateUser({
        userId: invalidUserId,
        password,
        systemId,
        loginTimestamp: new Date('2024-01-15T09:00:00Z').toISOString(),
      })
    ).toThrow(/ユーザー/);
  });
});