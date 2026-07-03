import { searchSalesActivity } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目のメタデータ管理機能', () => {
  test('SCEN-639: 権限なしユーザーが他部門の営業活動データにアクセス不可', async () => {
    // 権限なしユーザーの認証情報
    const unauthorizedUser = {
      userId: 'user_999',
      userName: '権限なしユーザー',
      departmentId: 'dept_B',
      permissions: [] as string[],
      accessToken: 'token_unauthorized_user'
    };

    // 他部門の営業活動データを検索する条件
    const searchCondition = {
      departmentId: 'dept_A',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      salesPersonId: 'sales_001'
    };

    // 権限なしユーザーでの検索実行
    const response = await searchSalesActivity({
      user: unauthorizedUser,
      searchCondition: searchCondition
    });

    // レスポンスステータスコードが403（Forbidden）であることを確認
    expect(response.statusCode).toBe(403);

    // エラーメッセージが「アクセス権限がありません」を含むことを確認
    expect(response.errorMessage).toMatch(/アクセス権限がありません/);

    // データが返却されていないことを確認
    expect(response.data).toBeNull();

    // 不正アクセス試行がシステムログに記録されていることを確認
    expect(response.auditLog).toBeDefined();
    expect(response.auditLog?.eventType).toBe('UNAUTHORIZED_ACCESS_ATTEMPT');
    expect(response.auditLog?.userId).toBe('user_999');
    expect(response.auditLog?.targetDepartmentId).toBe('dept_A');
    expect(response.auditLog?.timestamp).toBeDefined();
  });
});