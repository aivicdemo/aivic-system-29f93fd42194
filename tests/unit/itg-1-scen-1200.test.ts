import { detectAndRegisterSalesDataChanges } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  test('SCEN-1200: 複数の営業成果データが同時に変更された場合、全て正確に検知・登録される', () => {
    // ============================================================================
    // テストデータ準備: 複数の営業成果データ（少なくとも5件以上）
    // ============================================================================
    const timestamp = new Date('2024-11-15T09:30:00Z');
    const changedBy = 'admin_user_001';

    // 変更前のデータ
    const originalSalesDataSet = [
      {
        salesDataId: 'SD-001',
        customerId: 'CUST-001',
        serviceId: 'SVC-A',
        salesAmount: 100000,
        productCount: 5,
        contractDate: '2024-11-10',
        updatedAt: new Date('2024-11-14T10:00:00Z'),
      },
      {
        salesDataId: 'SD-002',
        customerId: 'CUST-002',
        serviceId: 'SVC-B',
        salesAmount: 250000,
        productCount: 12,
        contractDate: '2024-11-11',
        updatedAt: new Date('2024-11-14T10:00:00Z'),
      },
      {
        salesDataId: 'SD-003',
        customerId: 'CUST-003',
        serviceId: 'SVC-A',
        salesAmount: 75000,
        productCount: 3,
        contractDate: '2024-11-12',
        updatedAt: new Date('2024-11-14T10:00:00Z'),
      },
      {
        salesDataId: 'SD-004',
        customerId: 'CUST-001',
        serviceId: 'SVC-C',
        salesAmount: 180000,
        productCount: 8,
        contractDate: '2024-11-09',
        updatedAt: new Date('2024-11-14T10:00:00Z'),
      },
      {
        salesDataId: 'SD-005',
        customerId: 'CUST-004',
        serviceId: 'SVC-B',
        salesAmount: 320000,
        productCount: 15,
        contractDate: '2024-11-13',
        updatedAt: new Date('2024-11-14T10:00:00Z'),
      },
      {
        salesDataId: 'SD-006',
        customerId: 'CUST-005',
        serviceId: 'SVC-C',
        salesAmount: 150000,
        productCount: 7,
        contractDate: '2024-11-08',
        updatedAt: new Date('2024-11-14T10:00:00Z'),
      },
    ];

    // 同一タイムスタンプで並行実行される変更セット
    const parallelChanges = [
      {
        salesDataId: 'SD-001',
        changeType: 'salesAmount',
        oldValue: 100000,
        newValue: 120000, // 売上金額の変更
        timestamp,
        changedBy,
      },
      {
        salesDataId: 'SD-002',
        changeType: 'productCount',
        oldValue: 12,
        newValue: 15, // 商品数の変更
        timestamp,
        changedBy,
      },
      {
        salesDataId: 'SD-003',
        changeType: 'customerId',
        oldValue: 'CUST-003',
        newValue: 'CUST-003-NEW', // 顧客情報の変更
        timestamp,
        changedBy,
      },
      {
        salesDataId: 'SD-004',
        changeType: 'contractDate',
        oldValue: '2024-11-09',
        newValue: '2024-11-09T14:30:00Z', // 成約日時の変更
        timestamp,
        changedBy,
      },
      {
        salesDataId: 'SD-005',
        changeType: 'salesAmount',
        oldValue: 320000,
        newValue: 350000, // 売上金額の変更
        timestamp,
        changedBy,
      },
      {
        salesDataId: 'SD-006',
        changeType: 'productCount',
        oldValue: 7,
        newValue: 9, // 商品数の変更
        timestamp,
        changedBy,
      },
    ];

    // ============================================================================
    // 関数実行
    // ============================================================================
    const result = detectAndRegisterSalesDataChanges({
      originalDataSet: originalSalesDataSet,
      parallelChanges,
      timestamp,
      changedBy,
      processingTimeoutMs: 5000,
    });

    // ============================================================================
    // 検証1: 全ての変更が100%検知されたか
    // ============================================================================
    expect(result.detectedChangesCount).toBe(6);
    expect(result.registeredChangesCount).toBe(6);
    expect(result.missingChangesCount).toBe(0);
    expect(result.duplicateChangesCount).toBe(0);

    // ============================================================================
    // 検証2: 各変更データの詳細が正確に記録されているか
    // ============================================================================
    const registeredRecords = result.registeredChangeRecords;
    expect(registeredRecords.length).toBe(6);

    // SD-001: 売上金額の変更
    const record1 = registeredRecords.find(r => r.salesDataId === 'SD-001');
    expect(record1).toBeDefined();
    expect(record1.changeType).toBe('salesAmount');
    expect(record1.beforeValue).toBe(100000);
    expect(record1.afterValue).toBe(120000);
    expect(record1.recordedTimestamp).toEqual(timestamp);
    expect(record1.recordedBy).toBe(changedBy);

    // SD-002: 商品数の変更
    const record2 = registeredRecords.find(r => r.salesDataId === 'SD-002');
    expect(record2).toBeDefined();
    expect(record2.changeType).toBe('productCount');
    expect(record2.beforeValue).toBe(12);
    expect(record2.afterValue).toBe(15);
    expect(record2.recordedTimestamp).toEqual(timestamp);
    expect(record2.recordedBy).toBe(changedBy);

    // SD-003: 顧客情報の変更
    const record3 = registeredRecords.find(r => r.salesDataId === 'SD-003');
    expect(record3).toBeDefined();
    expect(record3.changeType).toBe('customerId');
    expect(record3.beforeValue).toBe('CUST-003');
    expect(record3.afterValue).toBe('CUST-003-NEW');
    expect(record3.recordedTimestamp).toEqual(timestamp);
    expect(record3.recordedBy).toBe(changedBy);

    // SD-004: 成約日時の変更
    const record4 = registeredRecords.find(r => r.salesDataId === 'SD-004');
    expect(record4).toBeDefined();
    expect(record4.changeType).toBe('contractDate');
    expect(record4.beforeValue).toBe('2024-11-09');
    expect(record4.afterValue).toBe('2024-11-09T14:30:00Z');
    expect(record4.recordedTimestamp).toEqual(timestamp);
    expect(record4.recordedBy).toBe(changedBy);

    // SD-005: 売上金額の変更
    const record5 = registeredRecords.find(r => r.salesDataId === 'SD-005');
    expect(record5).toBeDefined();
    expect(record5.changeType).toBe('salesAmount');
    expect(record5.beforeValue).toBe(320000);
    expect(record5.afterValue).toBe(350000);
    expect(record5.recordedTimestamp).toEqual(timestamp);
    expect(record5.recordedBy).toBe(changedBy);

    // SD-006: 商品数の変更
    const record6 = registeredRecords.find(r => r.salesDataId === 'SD-006');
    expect(record6).toBeDefined();
    expect(record6.changeType).toBe('productCount');
    expect(record6.beforeValue).toBe(7);
    expect(record6.afterValue).toBe(9);
    expect(record6.recordedTimestamp).toEqual(timestamp);
    expect(record6.recordedBy).toBe(changedBy);

    // ============================================================================
    // 検証3: 処理順序とデータの競合がないか
    // ============================================================================
    expect(result.processingOrderConflictDetected).toBe(false);
    expect(result.dataIntegrityViolations.length).toBe(0);

    // ============================================================================
    // 検証4: 請求自動化機能が変更データに基づいて正確に再計算されたか
    // ============================================================================
    const updatedBillingData = result.updatedBillingRecords;
    expect(updatedBillingData).toBeDefined();

    // CUST-001 (SD-001 + SD-004): 売上金額は 120000 + 180000 = 300000
    const billing_cust001 = updatedBillingData.find(b => b.customerId === 'CUST-001');
    expect(billing_cust001).toBeDefined();
    expect(billing_cust001.totalSalesAmount).toBe(300000); // 120000 + 180000
    expect(billing_cust001.recalculatedAt).toEqual(timestamp);

    // CUST-002 (SD-002): 売上金額は 250000, 商品数は 15
    const billing_cust002 = updatedBillingData.find(b => b.customerId === 'CUST-002');
    expect(billing_cust002).toBeDefined();
    expect(billing_cust002.totalSalesAmount).toBe(250000);
    expect(billing_cust002.totalProductCount).toBe(15);

    // CUST-003-NEW (SD-003): 顧客ID変更後
    const billing_cust003new = updatedBillingData.find(
      b => b.customerId === 'CUST-003-NEW'
    );
    expect(billing_cust003new).toBeDefined();
    expect(billing_cust003new.totalSalesAmount).toBe(75000);

    // CUST-004 (SD-005): 売上金額は 350000
    const billing_cust004 = updatedBillingData.find(b => b.customerId === 'CUST-004');
    expect(billing_cust004).toBeDefined();
    expect(billing_cust004.totalSalesAmount).toBe(350000);

    // CUST-005 (SD-006): 商品数は 9
    const billing_cust005 = updatedBillingData.find(b => b.customerId === 'CUST-005');
    expect(billing_cust005).toBeDefined();
    expect(billing_cust005.totalProductCount).toBe(9);

    // ============================================================================
    // 検証5: 処理時間が許容範囲内（5秒以内）であるか
    // ============================================================================
    expect(result.totalProcessingTimeMs).toBeLessThanOrEqual(5000);
    expect(result.totalProcessingTimeMs).toBeGreaterThan(0);

    // ============================================================================
    // 検証6: 監査証跡の完全性
    // ============================================================================
    expect(result.auditTrailEntries.length).toBe(6);
    result.auditTrailEntries.forEach((entry, index) => {
      expect(entry.sequenceNumber).toBe(index + 1);
      expect(entry.recordedTimestamp).toEqual(timestamp);
      expect(entry.operationType).toBe('SALES_DATA_CHANGE');
      expect(entry.operatorId).toBe(changedBy);
      expect(entry.auditHash).toBeDefined();
      expect(entry.auditHash.length).toBeGreaterThan(0);
    });

    // ============================================================================
    // 検証7: 最終的な整合性チェック
    // ============================================================================
    expect(result.dataConsistencyCheckPassed).toBe(true);
    expect(result.allChangesSuccessfullyProcessed).toBe(true);
    expect(result.systemHealthStatus).toBe('OPERATIONAL');
  });
});