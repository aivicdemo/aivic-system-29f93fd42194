import { determineContractChangeNotificationPriority } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目のメタデータ管理機能 - 複数契約変更の優先順序判定', () => {
  // SCEN-1263
  test('2件以上の同時契約変更で影響範囲を正確に判定し通知順序が決定される', () => {
    // テストデータ: 複数の同時契約変更シナリオ
    const contractChanges = [
      {
        contractChangeId: 'CC-001',
        contractId: 'C-001',
        customerId: 'CUS-A',
        changeType: 'billing_amount',
        impactScope: {
          affectedBillingAmount: 150000,
          affectedCycle: 'monthly',
          affectedServices: ['service-001', 'service-002'],
          estimatedAffectedRevenue: 1800000,
        },
        changeContent: '基本契約の請求額を100,000円→150,000円に変更',
        changeDate: '2024-01-15',
        severityLevel: 'high',
      },
      {
        contractChangeId: 'CC-002',
        contractId: 'C-002',
        customerId: 'CUS-B',
        changeType: 'delivery_date',
        impactScope: {
          affectedBillingAmount: 50000,
          affectedCycle: 'monthly',
          affectedServices: ['service-003'],
          estimatedAffectedRevenue: 600000,
        },
        changeContent: '成果物納期を2024-02-01→2024-02-15に延期',
        changeDate: '2024-01-15',
        severityLevel: 'medium',
      },
      {
        contractChangeId: 'CC-003',
        contractId: 'C-003',
        customerId: 'CUS-C',
        changeType: 'discount_rate',
        impactScope: {
          affectedBillingAmount: 200000,
          affectedCycle: 'monthly',
          affectedServices: ['service-001', 'service-004', 'service-005'],
          estimatedAffectedRevenue: 2400000,
        },
        changeContent: '割引率を10%→15%に変更',
        changeDate: '2024-01-15',
        severityLevel: 'high',
      },
    ];

    // 複数契約変更データをシステムに入力し、優先順序判定処理を実行
    const result = determineContractChangeNotificationPriority(contractChanges);

    // 期待結果: 優先度が高い順に順序付けられていることを確認
    expect(result.prioritizedChanges).toBeDefined();
    expect(result.prioritizedChanges.length).toBe(3);

    // 影響範囲の大きさ（estimatedAffectedRevenue）に基づいて優先順序が決定される
    // CC-003: 2,400,000円 > CC-001: 1,800,000円 > CC-002: 600,000円
    expect(result.prioritizedChanges[0].contractChangeId).toBe('CC-003');
    expect(result.prioritizedChanges[0].priority).toBe(1);
    expect(result.prioritizedChanges[0].impactScope.estimatedAffectedRevenue).toBe(2400000);

    expect(result.prioritizedChanges[1].contractChangeId).toBe('CC-001');
    expect(result.prioritizedChanges[1].priority).toBe(2);
    expect(result.prioritizedChanges[1].impactScope.estimatedAffectedRevenue).toBe(1800000);

    expect(result.prioritizedChanges[2].contractChangeId).toBe('CC-002');
    expect(result.prioritizedChanges[2].priority).toBe(3);
    expect(result.prioritizedChanges[2].impactScope.estimatedAffectedRevenue).toBe(600000);

    // 各契約変更の影響範囲が正確に識別されていることを確認
    expect(result.prioritizedChanges[0].impactScope.affectedServices.length).toBe(3);
    expect(result.prioritizedChanges[0].impactScope.affectedServices).toEqual(
      expect.arrayContaining(['service-001', 'service-004', 'service-005'])
    );

    expect(result.prioritizedChanges[1].impactScope.affectedServices.length).toBe(2);
    expect(result.prioritizedChanges[1].impactScope.affectedServices).toEqual(
      expect.arrayContaining(['service-001', 'service-002'])
    );

    expect(result.prioritizedChanges[2].impactScope.affectedServices.length).toBe(1);
    expect(result.prioritizedChanges[2].impactScope.affectedServices).toEqual(['service-003']);

    // 判定された優先順序に基づいて、通知対象者への通知順序が正しく決定されることを確認
    expect(result.notificationSequence).toBeDefined();
    expect(result.notificationSequence.length).toBe(3);
    expect(result.notificationSequence[0]).toBe('CUS-C');
    expect(result.notificationSequence[1]).toBe('CUS-A');
    expect(result.notificationSequence[2]).toBe('CUS-B');

    // 各契約変更に対応する通知メッセージが正確な順序で生成されていることを検証
    expect(result.notifications).toBeDefined();
    expect(result.notifications.length).toBe(3);

    expect(result.notifications[0].contractChangeId).toBe('CC-003');
    expect(result.notifications[0].customerId).toBe('CUS-C');
    expect(result.notifications[0].notificationOrder).toBe(1);
    expect(result.notifications[0].message).toContain('割引率');
    expect(result.notifications[0].severity).toBe('high');

    expect(result.notifications[1].contractChangeId).toBe('CC-001');
    expect(result.notifications[1].customerId).toBe('CUS-A');
    expect(result.notifications[1].notificationOrder).toBe(2);
    expect(result.notifications[1].message).toContain('請求額');
    expect(result.notifications[1].severity).toBe('high');

    expect(result.notifications[2].contractChangeId).toBe('CC-002');
    expect(result.notifications[2].customerId).toBe('CUS-B');
    expect(result.notifications[2].notificationOrder).toBe(3);
    expect(result.notifications[2].message).toContain('納期');
    expect(result.notifications[2].severity).toBe('medium');

    // 複数パターン: 優先度が同じ場合の判定結果を確認
    expect(result.priorityBreakdownByRevenue).toBeDefined();
    expect(result.priorityBreakdownByRevenue['high'].length).toBe(2);
    expect(result.priorityBreakdownByRevenue['high']).toEqual(
      expect.arrayContaining(['CC-003', 'CC-001'])
    );
    expect(result.priorityBreakdownByRevenue['medium'].length).toBe(1);
    expect(result.priorityBreakdownByRevenue['medium']).toEqual(['CC-002']);

    // 影響範囲の判定精度が100%であることを確認
    expect(result.impactAssessmentAccuracy).toBe(1.0);

    // 通知順序が最適化されていることを確認（スコア値）
    expect(result.optimizationScore).toBeGreaterThanOrEqual(0.95);
    expect(result.optimizationScore).toBeLessThanOrEqual(1.0);

    // 複数パターン: 依存関係がある場合などでの判定結果をログで確認
    expect(result.assessmentLog).toBeDefined();
    expect(result.assessmentLog.length).toBeGreaterThan(0);
    expect(result.assessmentLog[0]).toContain('影響範囲');
  });
});