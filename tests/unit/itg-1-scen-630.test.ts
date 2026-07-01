import { searchSalesActivities } from '../../src/logic/it-1781935279444-2-1-1';

describe('営業活動データ検索・権限制御機能', () => {
  // SCEN-630
  test('営業責任者が指定期間・顧客・担当者単位で営業活動データが正確に抽出される', () => {
    const userId = 'user_001';
    const userRole = 'sales_manager';
    const userDepartmentId = 'dept_001';

    const searchParams = {
      userId: userId,
      userRole: userRole,
      userDepartmentId: userDepartmentId,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
      customerId: 'customer_123',
      salesPersonId: 'person_456'
    };

    const mockActivities = [
      {
        activityId: 'activity_001',
        customerId: 'customer_123',
        salesPersonId: 'person_456',
        activityDate: new Date('2024-01-15'),
        activityType: 'appointment',
        description: 'Client meeting',
        departmentId: 'dept_001'
      },
      {
        activityId: 'activity_002',
        customerId: 'customer_123',
        salesPersonId: 'person_456',
        activityDate: new Date('2024-01-20'),
        activityType: 'follow_up',
        description: 'Follow-up call',
        departmentId: 'dept_001'
      }
    ];

    const result = searchSalesActivities(searchParams);

    // 抽出されたデータが表示されることを確認
    expect(result).toEqual(expect.any(Array));
    expect(result.length).toBe(2);

    // 表示されたデータが指定期間内のものであることを検証
    result.forEach((activity) => {
      expect(activity.activityDate.getTime()).toBeGreaterThanOrEqual(new Date('2024-01-01').getTime());
      expect(activity.activityDate.getTime()).toBeLessThanOrEqual(new Date('2024-01-31').getTime());
    });

    // 表示されたデータが選択した顧客に紐付いていることを検証
    result.forEach((activity) => {
      expect(activity.customerId).toBe('customer_123');
    });

    // 表示されたデータが選択した担当者に割り当てられていることを検証
    result.forEach((activity) => {
      expect(activity.salesPersonId).toBe('person_456');
    });

    // 営業責任者の権限で、自分の配下の担当者データのみが表示されることを確認
    result.forEach((activity) => {
      expect(activity.departmentId).toBe('dept_001');
    });

    // 権限外のデータが表示されていないことを確認
    const unauthorizedActivity = result.find(
      (activity) => activity.departmentId !== 'dept_001'
    );
    expect(unauthorizedActivity).toBeUndefined();

    // 最初のアクティビティの詳細検証
    expect(result[0]).toEqual({
      activityId: 'activity_001',
      customerId: 'customer_123',
      salesPersonId: 'person_456',
      activityDate: new Date('2024-01-15'),
      activityType: 'appointment',
      description: 'Client meeting',
      departmentId: 'dept_001'
    });

    // 2番目のアクティビティの詳細検証
    expect(result[1]).toEqual({
      activityId: 'activity_002',
      customerId: 'customer_123',
      salesPersonId: 'person_456',
      activityDate: new Date('2024-01-20'),
      activityType: 'follow_up',
      description: 'Follow-up call',
      departmentId: 'dept_001'
    });
  });
});