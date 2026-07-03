import { searchSalesActivityByPermission } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業活動データの権限ベース検索・抽出機能', () => {
  // SCEN-638
  test('ユーザー権限に基づき指定期間・顧客・営業担当者単位のデータが正確に抽出される', () => {
    // === 前提: テストユーザーでシステムにログインする ===
    const logged_in_user_id = 'user_sales_manager_001';
    const user_permission_level = 'sales_manager'; // 営業管理者権限

    // === ユーザーの権限レベルを確認する ===
    // 営業管理者は、自分の部門配下の全営業担当者と全顧客の営業活動データにアクセス可能
    // ※ システム管理者は全データ、営業担当者は自分のデータのみアクセス可能
    const user_department_id = 'dept_sales_001';
    const accessible_staff_ids = ['staff_001', 'staff_002', 'staff_003']; // 部門配下の3名

    // === 検索画面で指定期間を設定する ===
    const search_start_date = new Date('2024-01-01T00:00:00Z');
    const search_end_date = new Date('2024-01-31T23:59:59Z');

    // === 検索画面で対象顧客を選択する ===
    const search_customer_id = 'customer_001';

    // === 検索画面で営業担当者を選択する ===
    const search_staff_id = 'staff_001';

    // === Mock データの準備: 営業活動データベース ===
    const all_sales_activities = [
      {
        activity_id: 'activity_001',
        activity_date: new Date('2024-01-15T10:00:00Z'),
        customer_id: 'customer_001',
        staff_id: 'staff_001',
        contact_type: 'appointment',
        outcome: 'confirmed',
        department_id: 'dept_sales_001',
      },
      {
        activity_id: 'activity_002',
        activity_date: new Date('2024-01-20T14:30:00Z'),
        customer_id: 'customer_001',
        staff_id: 'staff_001',
        contact_type: 'follow_up',
        outcome: 'deal_closed',
        department_id: 'dept_sales_001',
      },
      {
        activity_id: 'activity_003',
        activity_date: new Date('2024-01-25T09:15:00Z'),
        customer_id: 'customer_001',
        staff_id: 'staff_002',
        contact_type: 'proposal',
        outcome: 'pending',
        department_id: 'dept_sales_001',
      },
      {
        activity_id: 'activity_004',
        activity_date: new Date('2024-01-10T11:00:00Z'),
        customer_id: 'customer_002',
        staff_id: 'staff_001',
        contact_type: 'appointment',
        outcome: 'confirmed',
        department_id: 'dept_sales_001',
      },
      {
        activity_id: 'activity_005',
        activity_date: new Date('2024-02-05T13:00:00Z'), // 検索期間外
        customer_id: 'customer_001',
        staff_id: 'staff_001',
        contact_type: 'appointment',
        outcome: 'confirmed',
        department_id: 'dept_sales_001',
      },
      {
        activity_id: 'activity_006',
        activity_date: new Date('2024-01-18T10:30:00Z'),
        customer_id: 'customer_001',
        staff_id: 'staff_004', // 権限外スタッフ
        contact_type: 'appointment',
        outcome: 'confirmed',
        department_id: 'dept_sales_002', // 異なる部門
      },
    ];

    // === 検索条件を確定して検索実行ボタンをクリックする ===
    const search_conditions = {
      user_id: logged_in_user_id,
      permission_level: user_permission_level,
      department_id: user_department_id,
      accessible_staff_ids: accessible_staff_ids,
      start_date: search_start_date,
      end_date: search_end_date,
      customer_id: search_customer_id,
      staff_id: search_staff_id,
    };

    // === 関数呼び出し: 権限ベース検索実行 ===
    const extracted_data = searchSalesActivityByPermission(
      search_conditions,
      all_sales_activities
    );

    // === 抽出されたデータを確認する ===
    // 期待される抽出データ: activity_001 と activity_002 のみ
    // (activity_001: 2024-01-15, customer_001, staff_001)
    // (activity_002: 2024-01-20, customer_001, staff_001)
    // ※ activity_003 は staff_002 (除外), activity_004 は customer_002 (除外)
    // ※ activity_005 は日付範囲外 (除外), activity_006 は権限外スタッフ (除外)

    // === 抽出データが権限範囲内であることを検証する ===
    extracted_data.forEach((activity: any) => {
      expect(accessible_staff_ids).toContain(activity.staff_id);
      expect(activity.department_id).toBe('dept_sales_001');
    });

    // === 抽出データが指定期間内であることを検証する ===
    extracted_data.forEach((activity: any) => {
      const activity_date = new Date(activity.activity_date);
      expect(activity_date.getTime()).toBeGreaterThanOrEqual(
        search_start_date.getTime()
      );
      expect(activity_date.getTime()).toBeLessThanOrEqual(
        search_end_date.getTime()
      );
    });

    // === 抽出データが指定顧客のみであることを検証する ===
    extracted_data.forEach((activity: any) => {
      expect(activity.customer_id).toBe('customer_001');
    });

    // === 抽出データが指定営業担当者のみであることを検証する ===
    extracted_data.forEach((activity: any) => {
      expect(activity.staff_id).toBe('staff_001');
    });

    // === 権限外のデータが含まれていないことを確認する ===
    const extracted_activity_ids = extracted_data.map(
      (activity: any) => activity.activity_id
    );
    expect(extracted_activity_ids).not.toContain('activity_003'); // staff_002
    expect(extracted_activity_ids).not.toContain('activity_004'); // customer_002
    expect(extracted_activity_ids).not.toContain('activity_005'); // 期間外
    expect(extracted_activity_ids).not.toContain('activity_006'); // 権限外スタッフ

    // === データの件数が正確であることを確認する ===
    expect(extracted_data.length).toBe(2);

    // === 具体的な抽出データの内容を検証する ===
    expect(extracted_data[0]).toEqual({
      activity_id: 'activity_001',
      activity_date: new Date('2024-01-15T10:00:00Z'),
      customer_id: 'customer_001',
      staff_id: 'staff_001',
      contact_type: 'appointment',
      outcome: 'confirmed',
      department_id: 'dept_sales_001',
    });

    expect(extracted_data[1]).toEqual({
      activity_id: 'activity_002',
      activity_date: new Date('2024-01-20T14:30:00Z'),
      customer_id: 'customer_001',
      staff_id: 'staff_001',
      contact_type: 'follow_up',
      outcome: 'deal_closed',
      department_id: 'dept_sales_001',
    });

    // === 最終確認: 期待結果が満たされていることを統合検証 ===
    expect(extracted_data.length).toBe(2);
    expect(extracted_data.every((a: any) => a.customer_id === 'customer_001'))
      .toBe(true);
    expect(extracted_data.every((a: any) => a.staff_id === 'staff_001')).toBe(
      true
    );
    expect(
      extracted_data.every(
        (a: any) =>
          new Date(a.activity_date) >= search_start_date &&
          new Date(a.activity_date) <= search_end_date
      )
    ).toBe(true);
  });
});