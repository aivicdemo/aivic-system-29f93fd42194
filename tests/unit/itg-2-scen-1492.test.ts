import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { confirmAiLearningDataset } from '../../src/logic/it-6-2-2-1';

describe('AI学習データセット確定機能 - データ不整合エラー検出', () => {
  // SCEN-1492: [error] AI学習データセット確定機能 - データ更新中に不整合が検出された場合、データセット確定が中断されエラーが返される

  let mockDatabase: Map<string, any>;
  let mockTransaction: {
    records: any[];
    isRolledBack: boolean;
    isCommitted: boolean;
  };

  beforeEach(() => {
    mockDatabase = new Map();
    mockTransaction = {
      records: [],
      isRolledBack: false,
      isCommitted: false,
    };

    // モックデータベースに初期状態のデータセットを投入
    const initialRecords = [
      {
        datasetId: 'ds-001',
        recordId: 'rec-001',
        pastProjectAmount: 1500000,
        priceBookAmount: 1450000,
        divergenceRate: 3.33,
        timestamp: '2024-01-15T10:00:00Z',
        status: 'pending',
        checksum: 'cksum-001-v1',
      },
      {
        datasetId: 'ds-001',
        recordId: 'rec-002',
        pastProjectAmount: 2000000,
        priceBookAmount: 2100000,
        divergenceRate: -4.76,
        timestamp: '2024-01-15T10:05:00Z',
        status: 'pending',
        checksum: 'cksum-002-v1',
      },
      {
        datasetId: 'ds-001',
        recordId: 'rec-003',
        pastProjectAmount: 800000,
        priceBookAmount: 850000,
        divergenceRate: -5.88,
        timestamp: '2024-01-15T10:10:00Z',
        status: 'pending',
        checksum: 'cksum-003-v1',
      },
    ];

    mockDatabase.set('ds-001', {
      id: 'ds-001',
      status: 'draft',
      recordCount: 3,
      records: initialRecords,
      checksumMaster: 'master-cksum-v1',
      createdAt: '2024-01-15T09:00:00Z',
      updatedAt: '2024-01-15T10:15:00Z',
    });

    mockTransaction.records = [...initialRecords];
  });

  afterEach(() => {
    mockDatabase.clear();
    mockTransaction = {
      records: [],
      isRolledBack: false,
      isCommitted: false,
    };
  });

  it('should abort dataset confirmation and return error when data inconsistency is detected during confirmation process', async () => {
    const datasetId = 'ds-001';
    const executionId = 'exec-12345';

    // Step 1: 確定処理開始前のデータセット状態を確認
    const initialDataset = mockDatabase.get(datasetId);
    expect(initialDataset).toBeDefined();
    expect(initialDataset.status).toBe('draft');
    expect(initialDataset.recordCount).toBe(3);
    expect(initialDataset.records.length).toBe(3);

    // Step 2-3: 確定処理開始 → 確定処理実行中に別プロセスがデータを更新
    // 不整合を模擬: rec-002 のチェックサムと金額を不整合な状態に変更
    const corruptionTimestamp = '2024-01-15T10:20:00Z';
    mockDatabase.get(datasetId).records[1] = {
      ...mockDatabase.get(datasetId).records[1],
      pastProjectAmount: 2050000, // 元の値: 2000000 から変更
      divergenceRate: -2.38, // 不整合な乖離率 (元は -4.76)
      checksum: 'cksum-002-corrupted', // チェックサムが不一致
      timestamp: corruptionTimestamp,
    };

    // Step 4-5: 確定処理がデータ検証フェーズに到達し、不整合検出ロジックが矛盾したデータを検出
    const confirmationInput = {
      datasetId: datasetId,
      executionId: executionId,
      requestedAt: '2024-01-15T10:25:00Z',
      operatorId: 'op-user-001',
      validateChecksums: true,
      validateDivergenceFormula: true,
    };

    let confirmationResult: any;
    try {
      confirmationResult = await confirmAiLearningDataset(confirmationInput);
    } catch (error: any) {
      confirmationResult = {
        success: false,
        error: error,
      };
    }

    // Step 6-9: 確定処理が中断されることを確認、エラーレスポンスが返される、詳細情報が含まれる、トランザクションがロールバックされる

    // 確定処理が失敗したことを確認
    expect(confirmationResult.success).toBe(false);

    // エラーレスポンスに適切なエラーコードが含まれていることを確認
    expect(confirmationResult.error).toBeDefined();
    expect(confirmationResult.error.code).toMatch(/データ不整合|チェックサム|乖離率計算/);

    // エラーメッセージに不整合の詳細情報が含まれていることを確認
    expect(confirmationResult.error.message).toBeDefined();
    expect(confirmationResult.error.message).toMatch(/rec-002|チェックサム|2050000|2000000/);

    // 不整合レコードの詳細情報が含まれていることを確認
    expect(confirmationResult.error.details).toBeDefined();
    expect(confirmationResult.error.details.inconsistentRecordId).toBe('rec-002');
    expect(confirmationResult.error.details.expectedChecksum).toBe('cksum-002-v1');
    expect(confirmationResult.error.details.actualChecksum).toBe('cksum-002-corrupted');
    expect(confirmationResult.error.details.expectedDivergenceRate).toBe(-4.76);
    expect(confirmationResult.error.details.actualDivergenceRate).toBe(-2.38);
    expect(confirmationResult.error.details.expectedPastProjectAmount).toBe(2000000);
    expect(confirmationResult.error.details.actualPastProjectAmount).toBe(2050000);

    // トランザクションがロールバックされたことを確認
    expect(mockTransaction.isRolledBack).toBe(true);
    expect(mockTransaction.isCommitted).toBe(false);

    // ロールバック後、データベースのデータが元の状態に復帰したことを確認
    const restoredDataset = mockDatabase.get(datasetId);
    expect(restoredDataset.records[1].pastProjectAmount).toBe(2000000);
    expect(restoredDataset.records[1].divergenceRate).toBe(-4.76);
    expect(restoredDataset.records[1].checksum).toBe('cksum-002-v1');

    // データセットのステータスが 'draft' のままであることを確認
    expect(restoredDataset.status).toBe('draft');

    // Step 10: システムが安全な状態に復帰したことを検証
    // 他のレコードは変更されていないことを確認
    expect(restoredDataset.records[0].checksum).toBe('cksum-001-v1');
    expect(restoredDataset.records[0].pastProjectAmount).toBe(1500000);
    expect(restoredDataset.records[2].checksum).toBe('cksum-003-v1');
    expect(restoredDataset.records[2].pastProjectAmount).toBe(800000);

    // 確定処理のトランザクション履歴が記録されていることを確認
    expect(confirmationResult.error.transactionId).toBeDefined();
    expect(confirmationResult.error.transactionId).toBe(`txn-${executionId}`);

    // エラー検出時刻が記録されていることを確認
    expect(confirmationResult.error.detectedAt).toBeDefined();
    expect(confirmationResult.error.detectedAt).toMatch(/2024-01-15T10:/);

    // システムが元の状態に復帰していることを確認するため、再度確定処理を試みる
    // (この場合は成功するはずだが、ここではデータが修正されていないため失敗する)
    const retryConfirmationInput = {
      datasetId: datasetId,
      executionId: 'exec-12346',
      requestedAt: '2024-01-15T10:30:00Z',
      operatorId: 'op-user-002',
      validateChecksums: true,
      validateDivergenceFormula: true,
    };

    // データが修正されていない場合、再度確定処理は失敗する
    // (システムが元の状態に復帰したことの証明)
    let retryResult: any;
    try {
      retryResult = await confirmAiLearningDataset(retryConfirmationInput);
    } catch (error: any) {
      retryResult = {
        success: false,
        error: error,
      };
    }

    // 再試行が同じ理由で失敗することを確認 (不整合はロールバック後も残っている)
    // ただし、不整合は実際には修正されているため、正常系では成功するはず
    // ここではシステムが安全な状態に復帰したことを確認するため
    expect(mockTransaction.isRolledBack).toBe(true);

    // エラーレスポンスが適切な構造を持っていることを確認
    expect(confirmationResult.error.httpStatusCode).toBe(409); // Conflict
    expect(confirmationResult.error.errorCategory).toBe('データ品質エラー');
  });
});