import { recordLearningDataUpdateMetadata } from '../../src/logic/it-6-3-1';

describe('学習データ更新メタデータ構造化記録機能', () => {
  // SCEN-1129
  test('最小値メタデータ（物価本版数0・案件件数0）の検証', async () => {
    const minimalMetadata = {
      priceBookVersion: 0,
      additionalCaseCount: 0,
      regionClassification: '',
      seasonalClassification: '',
      updateTriggerType: 'manual',
      updateExecutionDate: '2024-01-15T09:00:00Z',
      executorUserId: 'user-123',
      targetDataSource: 'historical_cases',
    };

    // ケース1: 最小値メタデータの記録試行
    const recordResult = await recordLearningDataUpdateMetadata(minimalMetadata);

    // ケース1検証: ステータスコードと記録内容の検証
    // 仕様: 物価本版数0・案件件数0は許容可能（外部更新なしの更新トリガー記録パターン）
    expect(recordResult.statusCode).toBe(201);
    expect(recordResult.recordedMetadata).toEqual({
      priceBookVersion: 0,
      additionalCaseCount: 0,
      regionClassification: '',
      seasonalClassification: '',
      updateTriggerType: 'manual',
      updateExecutionDate: '2024-01-15T09:00:00Z',
      executorUserId: 'user-123',
      targetDataSource: 'historical_cases',
      recordedAt: expect.any(String),
      metadataId: expect.any(String),
    });

    // ケース2: 無効なメタデータ（updateTriggerType未指定）の検証
    const invalidMetadata = {
      priceBookVersion: 0,
      additionalCaseCount: 0,
      regionClassification: '',
      seasonalClassification: '',
      updateTriggerType: '',
      updateExecutionDate: '2024-01-15T09:00:00Z',
      executorUserId: 'user-123',
      targetDataSource: 'historical_cases',
    };

    expect(() =>
      recordLearningDataUpdateMetadata(invalidMetadata)
    ).toThrow(/updateTriggerType/);

    // ケース3: 無効なメタデータ（executorUserId未指定）の検証
    const noExecutorMetadata = {
      priceBookVersion: 0,
      additionalCaseCount: 0,
      regionClassification: '',
      seasonalClassification: '',
      updateTriggerType: 'manual',
      updateExecutionDate: '2024-01-15T09:00:00Z',
      executorUserId: '',
      targetDataSource: 'historical_cases',
    };

    expect(() =>
      recordLearningDataUpdateMetadata(noExecutorMetadata)
    ).toThrow(/executorUserId/);

    // ケース4: 無効な日時フォーマット
    const invalidDateMetadata = {
      priceBookVersion: 0,
      additionalCaseCount: 0,
      regionClassification: '',
      seasonalClassification: '',
      updateTriggerType: 'manual',
      updateExecutionDate: 'invalid-date',
      executorUserId: 'user-123',
      targetDataSource: 'historical_cases',
    };

    expect(() =>
      recordLearningDataUpdateMetadata(invalidDateMetadata)
    ).toThrow(/updateExecutionDate/);

    // ケース5: 正常な最小値メタデータ（物価本版数1・案件件数1）の検証
    const normalMinimalMetadata = {
      priceBookVersion: 1,
      additionalCaseCount: 1,
      regionClassification: 'REGION_001',
      seasonalClassification: 'SEASON_Q1',
      updateTriggerType: 'price_book_update',
      updateExecutionDate: '2024-01-15T09:00:00Z',
      executorUserId: 'user-456',
      targetDataSource: 'price_book_master',
    };

    const normalResult = await recordLearningDataUpdateMetadata(
      normalMinimalMetadata
    );

    expect(normalResult.statusCode).toBe(201);
    expect(normalResult.recordedMetadata.priceBookVersion).toBe(1);
    expect(normalResult.recordedMetadata.additionalCaseCount).toBe(1);
    expect(normalResult.recordedMetadata.updateTriggerType).toBe(
      'price_book_update'
    );
    expect(normalResult.recordedMetadata.executorUserId).toBe('user-456');

    // ケース6: 記録されたメタデータIDが有効であることを検証
    expect(recordResult.recordedMetadata.metadataId).toMatch(
      /^metadata-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );

    // ケース7: 記録タイムスタンプがISO8601形式であることを検証
    expect(recordResult.recordedMetadata.recordedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );

    // ケース8: 最大値メタデータの検証（物価本版数999・案件件数999999）
    const maximalMetadata = {
      priceBookVersion: 999,
      additionalCaseCount: 999999,
      regionClassification: 'REGION_NATIONWIDE',
      seasonalClassification: 'SEASON_ANNUAL',
      updateTriggerType: 'manual',
      updateExecutionDate: '2024-12-31T23:59:59Z',
      executorUserId: 'user-admin-999',
      targetDataSource: 'comprehensive',
    };

    const maximalResult = await recordLearningDataUpdateMetadata(
      maximalMetadata
    );

    expect(maximalResult.statusCode).toBe(201);
    expect(maximalResult.recordedMetadata.priceBookVersion).toBe(999);
    expect(maximalResult.recordedMetadata.additionalCaseCount).toBe(999999);
  });
});