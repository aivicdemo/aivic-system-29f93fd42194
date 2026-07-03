import { validateAndNotifyOverdueCorrections } from '../../src/logic/it-1781935279444-2-2-1';

describe('修正期限管理・催促機能 - 自動催促通知発行', () => {
  test('SCEN-715: 修正期限を超過したデータに対して自動催促通知が正確なタイミングで発行される', () => {
    const current_date = new Date('2024-02-20T09:00:00Z');
    
    // テスト用の修正期限切れデータ（複数件、異なる超過日数）
    const correction_items = [
      {
        id: 'data_001',
        business_unit_name: '営業部A',
        issue_description: '顧客名欠落',
        deadline_date: new Date('2024-02-19T17:00:00Z'), // 1日超過
        created_at: new Date('2024-02-15T10:00:00Z'),
        status: 'pending_correction',
      },
      {
        id: 'data_002',
        business_unit_name: '営業部B',
        issue_description: '金額形式不正',
        deadline_date: new Date('2024-02-17T17:00:00Z'), // 3日超過
        created_at: new Date('2024-02-14T11:30:00Z'),
        status: 'pending_correction',
      },
      {
        id: 'data_003',
        business_unit_name: '営業部A',
        issue_description: 'データ型不整合',
        deadline_date: new Date('2024-02-13T17:00:00Z'), // 7日超過
        created_at: new Date('2024-02-10T14:00:00Z'),
        status: 'pending_correction',
      },
      {
        id: 'data_004',
        business_unit_name: '営業部C',
        issue_description: '矛盾値検出',
        deadline_date: new Date('2024-02-06T17:00:00Z'), // 14日超過
        created_at: new Date('2024-02-01T09:00:00Z'),
        status: 'pending_correction',
      },
      {
        id: 'data_005',
        business_unit_name: '営業部B',
        issue_description: '必須項目漏れ',
        deadline_date: new Date('2024-02-19T17:00:00Z'), // 1日超過
        created_at: new Date('2024-02-16T13:00:00Z'),
        status: 'pending_correction',
      },
    ];

    // 催促通知ルール設定
    const notification_rules = [
      { trigger_days_overdue: 1, notification_stage: 'initial', message_template: '修正期限が切れました' },
      { trigger_days_overdue: 3, notification_stage: 'reminder_1st', message_template: '修正をお願いします' },
      { trigger_days_overdue: 7, notification_stage: 'reminder_2nd', message_template: '至急修正をお願いします' },
    ];

    // 実行
    const result = validateAndNotifyOverdueCorrections({
      current_timestamp: current_date,
      pending_corrections: correction_items,
      notification_trigger_rules: notification_rules,
    });

    // 1. 対象データの特定と通知発行件数の検証
    expect(result.notifications_generated).toBe(7); // 5件のデータに対して7件の通知が発行される

    // 2. 1日超過データ（data_001, data_005）：初回催促のみ発行
    const notifs_1day = result.notifications.filter((n) => n.data_id === 'data_001' || n.data_id === 'data_005');
    expect(notifs_1day.length).toBe(2); // 2件のデータで初回催促1件ずつ
    notifs_1day.forEach((n) => {
      expect(n.notification_stage).toBe('initial');
      expect(n.days_overdue).toBe(1);
      expect(n.message_content).toContain('修正期限が切れました');
    });

    // 3. 3日超過データ（data_002）：初回催促と1段階目再催促
    const notifs_3day = result.notifications.filter((n) => n.data_id === 'data_002');
    expect(notifs_3day.length).toBe(2); // 初回催促 + 再催促1
    const initial_3day = notifs_3day.find((n) => n.notification_stage === 'initial');
    const reminder_3day = notifs_3day.find((n) => n.notification_stage === 'reminder_1st');
    expect(initial_3day).toBeDefined();
    expect(reminder_3day).toBeDefined();
    expect(reminder_3day!.message_content).toContain('修正をお願いします');
    expect(reminder_3day!.days_overdue).toBe(3);

    // 4. 7日超過データ（data_003）：初回催促、1段階目再催促、2段階目再催促
    const notifs_7day = result.notifications.filter((n) => n.data_id === 'data_003');
    expect(notifs_7day.length).toBe(3);
    const reminder_2nd = notifs_7day.find((n) => n.notification_stage === 'reminder_2nd');
    expect(reminder_2nd).toBeDefined();
    expect(reminder_2nd!.message_content).toContain('至急修正をお願いします');
    expect(reminder_2nd!.days_overdue).toBe(7);

    // 5. 14日超過データ（data_004）：すべての段階の催促通知
    const notifs_14day = result.notifications.filter((n) => n.data_id === 'data_004');
    expect(notifs_14day.length).toBe(3); // 初回 + 再催促2段階
    notifs_14day.forEach((n) => {
      expect(n.days_overdue).toBe(14);
      expect(['initial', 'reminder_1st', 'reminder_2nd']).toContain(n.notification_stage);
    });

    // 6. 発行タイムスタンプと期限の関係を検証
    result.notifications.forEach((notif) => {
      const correction_item = correction_items.find((item) => item.id === notif.data_id);
      expect(correction_item).toBeDefined();
      const days_diff = Math.floor(
        (current_date.getTime() - correction_item!.deadline_date.getTime()) / (1000 * 60 * 60 * 24)
      );
      expect(days_diff).toBeGreaterThanOrEqual(1);
      expect(notif.issued_at).toEqual(current_date); // すべての通知が現在日時で発行される
    });

    // 7. 通知メッセージの内容検証（正確な情報を含むか）
    result.notifications.forEach((notif) => {
      expect(notif.message_content).toBeDefined();
      expect(notif.message_content.length).toBeGreaterThan(0);
      // 超過日数が正確に記載されているか
      if (notif.days_overdue === 1) {
        expect(['修正期限が切れました']).toContain(notif.message_content);
      } else if (notif.days_overdue === 3) {
        expect(notif.message_content).toContain('修正をお願いします');
      } else if (notif.days_overdue === 7) {
        expect(notif.message_content).toContain('至急修正をお願いします');
      }
    });

    // 8. エラー・漏れの検出
    expect(result.errors).toBeDefined();
    expect(Array.isArray(result.errors)).toBe(true);
    expect(result.errors.length).toBe(0); // エラーが発生していないこと

    expect(result.has_warnings).toBe(false); // 異常な出力がないこと

    // 9. 全データが処理されていることを確認
    const processed_data_ids = new Set(result.notifications.map((n) => n.data_id));
    expect(processed_data_ids.size).toBe(5); // 5件すべてのデータから通知が生成される

    // 10. 各データが少なくとも1件の通知を受け取っていることを確認
    correction_items.forEach((item) => {
      const item_notifs = result.notifications.filter((n) => n.data_id === item.id);
      expect(item_notifs.length).toBeGreaterThanOrEqual(1);
    });

    // 11. ビジネスルール整合性：超過日数に基づいた催促段階の正確性
    result.notifications.forEach((notif) => {
      const applicable_rules = notification_rules.filter((rule) => rule.trigger_days_overdue <= notif.days_overdue);
      expect(applicable_rules.map((r) => r.notification_stage)).toContain(notif.notification_stage);
    });

    // 12. 通知ステータス確認
    result.notifications.forEach((notif) => {
      expect(notif.status).toBe('issued');
    });

    // 13. 要約統計の検証
    expect(result.summary.total_items_processed).toBe(5);
    expect(result.summary.total_notifications_issued).toBe(7);
    expect(result.summary.items_with_multiple_notifications).toBe(4); // 3日以上超過のデータ
    expect(result.summary.processing_timestamp).toEqual(current_date);
  });
});