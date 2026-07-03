import { executeMonthlyDistribution } from '../../src/logic/it-1-br-1781935279444-1-2-1';

describe('月次サマリーテンプレートの定義・管理機能', () => {
  // SCEN-1283: [error] 定義済みルール基づく自動配信 - 配信対象顧客が未定義の場合、配信処理がスキップされ処理ログに記録される
  test('配信対象顧客が未定義の場合、配信処理をスキップし処理ログに記録する', () => {
    const distributionRule = {
      ruleId: 'RULE-2024-001',
      templateId: 'TEMPLATE-MONTHLY-001',
      targetCustomerIds: [],
      deliveryTiming: 'MONTHLY',
      deliveryFormat: 'EMAIL',
      createdAt: new Date('2024-01-15T08:00:00Z'),
      updatedAt: new Date('2024-01-15T08:00:00Z'),
    };

    const executionContext = {
      executedAt: new Date('2024-02-01T09:00:00Z'),
      executorId: 'USER-ADMIN-001',
      ruleId: 'RULE-2024-001',
    };

    const result = executeMonthlyDistribution(distributionRule, executionContext);

    expect(result.status).toBe('SKIPPED');
    expect(result.skipReason).toBe('配信対象顧客が未定義');
    expect(result.processLog).toBeDefined();
    expect(result.processLog.ruleId).toBe('RULE-2024-001');
    expect(result.processLog.message).toMatch(/配信対象顧客が未定義/);
    expect(result.processLog.timestamp).toEqual(new Date('2024-02-01T09:00:00Z'));
    expect(result.processLog.severity).toBe('ERROR');
    expect(result.processLog.executorId).toBe('USER-ADMIN-001');
    expect(result.affectedCustomerCount).toBe(0);
    expect(result.systemError).toBeNull();
  });
});