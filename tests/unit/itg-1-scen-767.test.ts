import { describe, test, expect, beforeEach } from '@jest/globals';
import { distributeLatestVersionNotice } from '../../src/logic/it-1-br-1781935279444-1-2-1';

describe('月次サマリーテンプレートの定義・管理機能', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('SCEN-767: 通知対象営業担当者が0件の場合に通知配信が正常に完了する', async () => {
    // Arrange: 通知対象営業担当者が0件のシナリオをセットアップ
    const distributionRequest = {
      templateId: 'tpl_001',
      templateName: '契約書最新版リリース',
      distributionTargetFilters: {
        department: 'sales',
        status: 'active',
        region: 'tokyo',
      },
      releaseNotes: '2024年1月版の契約書テンプレートをリリースしました',
      releaseDate: '2024-01-15T09:00:00Z',
      noticeType: 'template_update',
    };

    const mockDistributionLogEntry = {
      distributionId: 'dist_20240115_001',
      templateId: 'tpl_001',
      executedBy: 'user_admin_001',
      executedAt: '2024-01-15T09:30:00Z',
      targetCount: 0,
      successCount: 0,
      failureCount: 0,
      status: 'completed',
      errorMessage: null,
      logMessage: '配信完了：対象件数0件',
    };

    const mockDistributionResult = {
      success: true,
      distributionId: 'dist_20240115_001',
      targetSalesPersonCount: 0,
      successfulDeliveries: 0,
      failedDeliveries: 0,
      completedAt: '2024-01-15T09:30:15Z',
      logEntry: mockDistributionLogEntry,
    };

    // Act: 通知配信実行を呼び出し
    const result = await distributeLatestVersionNotice(distributionRequest);

    // Assert: 配信処理が正常に完了し、エラーが発生していないことを検証
    expect(result.success).toBe(true);
    expect(result.targetSalesPersonCount).toBe(0);
    expect(result.successfulDeliveries).toBe(0);
    expect(result.failedDeliveries).toBe(0);
    expect(result.distributionId).toBe('dist_20240115_001');
    expect(result.logEntry.status).toBe('completed');
    expect(result.logEntry.errorMessage).toBeNull();
    expect(result.logEntry.logMessage).toBe('配信完了：対象件数0件');
    expect(result.logEntry.targetCount).toBe(0);
    expect(result.logEntry.successCount).toBe(0);
    expect(result.logEntry.failureCount).toBe(0);
    expect(result.completedAt).toBe('2024-01-15T09:30:15Z');
  });
});