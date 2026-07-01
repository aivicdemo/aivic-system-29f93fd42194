import { determineLatestValidDocumentVersion } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目メタデータ管理機能 - 顧客別・案件別・資料種別バージョン有効性自動判定', () => {
  // SCEN-769: [normal] 顧客別・案件別・資料種別バージョン有効性自動判定機能
  test('登録済み変更履歴・適用ルール・有効期限から顧客ID・案件ID・資料種別ごとの最新有効バージョンが正確に判定される', () => {
    // テストデータ: 複数顧客・案件・資料種別の変更履歴
    const changeHistories = [
      // 顧客A・案件1・契約書
      {
        id: 'ch-001',
        customerId: 'cust-A',
        projectId: 'proj-001',
        documentType: 'contract',
        version: 'v1.0',
        validityStartDate: new Date('2024-01-01T00:00:00Z'),
        validityEndDate: new Date('2024-03-31T23:59:59Z'),
        updateDate: new Date('2024-01-05T10:00:00Z'),
        status: 'active'
      },
      {
        id: 'ch-002',
        customerId: 'cust-A',
        projectId: 'proj-001',
        documentType: 'contract',
        version: 'v1.1',
        validityStartDate: new Date('2024-02-01T00:00:00Z'),
        validityEndDate: new Date('2024-12-31T23:59:59Z'),
        updateDate: new Date('2024-02-10T14:30:00Z'),
        status: 'active'
      },
      {
        id: 'ch-003',
        customerId: 'cust-A',
        projectId: 'proj-001',
        documentType: 'contract',
        version: 'v1.2',
        validityStartDate: new Date('2024-04-01T00:00:00Z'),
        validityEndDate: new Date('2025-12-31T23:59:59Z'),
        updateDate: new Date('2024-03-20T09:15:00Z'),
        status: 'active'
      },
      // 顧客A・案件1・提案資料 (異なる資料種別)
      {
        id: 'ch-004',
        customerId: 'cust-A',
        projectId: 'proj-001',
        documentType: 'proposal',
        version: 'p1.0',
        validityStartDate: new Date('2024-01-01T00:00:00Z'),
        validityEndDate: new Date('2024-06-30T23:59:59Z'),
        updateDate: new Date('2024-01-08T11:00:00Z'),
        status: 'active'
      },
      {
        id: 'ch-005',
        customerId: 'cust-A',
        projectId: 'proj-001',
        documentType: 'proposal',
        version: 'p1.1',
        validityStartDate: new Date('2024-06-01T00:00:00Z'),
        validityEndDate: new Date('2025-06-30T23:59:59Z'),
        updateDate: new Date('2024-05-25T16:45:00Z'),
        status: 'active'
      },
      // 顧客B・案件2・契約書 (異なる顧客・案件)
      {
        id: 'ch-006',
        customerId: 'cust-B',
        projectId: 'proj-002',
        documentType: 'contract',
        version: 'v2.0',
        validityStartDate: new Date('2024-01-15T00:00:00Z'),
        validityEndDate: new Date('2024-12-31T23:59:59Z'),
        updateDate: new Date('2024-01-12T08:30:00Z'),
        status: 'active'
      },
      // 期限切れバージョン
      {
        id: 'ch-007',
        customerId: 'cust-A',
        projectId: 'proj-001',
        documentType: 'contract',
        version: 'v0.9',
        validityStartDate: new Date('2023-12-01T00:00:00Z'),
        validityEndDate: new Date('2023-12-31T23:59:59Z'),
        updateDate: new Date('2023-12-15T10:00:00Z'),
        status: 'inactive'
      }
    ];

    // 参照日時: 2024年5月15日
    const referenceDate = new Date('2024-05-15T12:00:00Z');

    // ケース1: 顧客A・案件1・契約書 の最新有効バージョン
    // 有効期限内: v1.0 (2024-03-31までで期限切れ), v1.1 (2024-02-01〜2024-12-31で有効), v1.2 (2024-04-01〜で有効)
    // 期待値: v1.2 (最新のupdateDate: 2024-03-20)
    const result1 = determineLatestValidDocumentVersion({
      customerId: 'cust-A',
      projectId: 'proj-001',
      documentType: 'contract',
      referenceDate: referenceDate,
      changeHistories: changeHistories
    });

    expect(result1).toEqual({
      version: 'v1.2',
      id: 'ch-003',
      validityStartDate: new Date('2024-04-01T00:00:00Z'),
      validityEndDate: new Date('2025-12-31T23:59:59Z'),
      updateDate: new Date('2024-03-20T09:15:00Z')
    });

    // ケース2: 顧客A・案件1・提案資料 の最新有効バージョン
    // 有効期限内: p1.0 (2024-06-30までで有効), p1.1 (2024-06-01以降で有効)
    // 期待値: p1.1 (最新のupdateDate: 2024-05-25)
    const result2 = determineLatestValidDocumentVersion({
      customerId: 'cust-A',
      projectId: 'proj-001',
      documentType: 'proposal',
      referenceDate: referenceDate,
      changeHistories: changeHistories
    });

    expect(result2).toEqual({
      version: 'p1.1',
      id: 'ch-005',
      validityStartDate: new Date('2024-06-01T00:00:00Z'),
      validityEndDate: new Date('2025-06-30T23:59:59Z'),
      updateDate: new Date('2024-05-25T16:45:00Z')
    });

    // ケース3: 顧客B・案件2・契約書 の最新有効バージョン
    // 有効期限内: v2.0 (2024-01-15〜2024-12-31で有効)
    // 期待値: v2.0 (唯一の有効バージョン)
    const result3 = determineLatestValidDocumentVersion({
      customerId: 'cust-B',
      projectId: 'proj-002',
      documentType: 'contract',
      referenceDate: referenceDate,
      changeHistories: changeHistories
    });

    expect(result3).toEqual({
      version: 'v2.0',
      id: 'ch-006',
      validityStartDate: new Date('2024-01-15T00:00:00Z'),
      validityEndDate: new Date('2024-12-31T23:59:59Z'),
      updateDate: new Date('2024-01-12T08:30:00Z')
    });

    // ケース4: 有効期限の開始日時境界値テスト
    // 参照日時が有効期限開始日時と同じ場合、有効と判定される
    const boundaryDateStart = new Date('2024-04-01T00:00:00Z');
    const result4 = determineLatestValidDocumentVersion({
      customerId: 'cust-A',
      projectId: 'proj-001',
      documentType: 'contract',
      referenceDate: boundaryDateStart,
      changeHistories: changeHistories
    });

    expect(result4.version).toBe('v1.2');

    // ケース5: 有効期限の終了日時境界値テスト
    // 参照日時が有効期限終了日時と同じ場合、有効と判定される
    const boundaryDateEnd = new Date('2025-12-31T23:59:59Z');
    const result5 = determineLatestValidDocumentVersion({
      customerId: 'cust-A',
      projectId: 'proj-001',
      documentType: 'contract',
      referenceDate: boundaryDateEnd,
      changeHistories: changeHistories
    });

    expect(result5.version).toBe('v1.2');

    // ケース6: 有効期限を超過した参照日時の場合、次の有効期限のバージョンはない（エラー）
    const futureDate = new Date('2026-01-01T00:00:00Z');
    const result6 = determineLatestValidDocumentVersion({
      customerId: 'cust-A',
      projectId: 'proj-001',
      documentType: 'contract',
      referenceDate: futureDate,
      changeHistories: changeHistories
    });

    expect(result6).toBeNull();

    // ケース7: 参照日時が有効期限より前の場合
    const pastDate = new Date('2023-12-31T00:00:00Z');
    const result7 = determineLatestValidDocumentVersion({
      customerId: 'cust-A',
      projectId: 'proj-001',
      documentType: 'contract',
      referenceDate: pastDate,
      changeHistories: changeHistories
    });

    expect(result7).toBeNull();

    // ケース8: 該当する顧客ID・案件ID・資料種別の組み合わせが存在しない場合
    const result8 = determineLatestValidDocumentVersion({
      customerId: 'cust-C',
      projectId: 'proj-999',
      documentType: 'contract',
      referenceDate: referenceDate,
      changeHistories: changeHistories
    });

    expect(result8).toBeNull();

    // ケース9: 期限切れバージョン（v0.9）は除外される確認
    // v0.9は有効期限が2023-12-31なので、2024-05-15では除外されるべき
    const oldReferenceDate = new Date('2023-12-20T12:00:00Z');
    const result9 = determineLatestValidDocumentVersion({
      customerId: 'cust-A',
      projectId: 'proj-001',
      documentType: 'contract',
      referenceDate: oldReferenceDate,
      changeHistories: changeHistories
    });

    expect(result9).toEqual({
      version: 'v1.0',
      id: 'ch-001',
      validityStartDate: new Date('2024-01-01T00:00:00Z'),
      validityEndDate: new Date('2024-03-31T23:59:59Z'),
      updateDate: new Date('2024-01-05T10:00:00Z')
    });

    // ケース10: 複数バージョン有効時の最新バージョン選択確認
    // v1.1とv1.2が同時に有効な期間(2024-04-01〜2024-12-31)における参照
    const overlapDate = new Date('2024-05-15T12:00:00Z');
    const result10 = determineLatestValidDocumentVersion({
      customerId: 'cust-A',
      projectId: 'proj-001',
      documentType: 'contract',
      referenceDate: overlapDate,
      changeHistories: changeHistories
    });

    // v1.2がより新しい(updateDate: 2024-03-20)ので選択される
    expect(result10.version).toBe('v1.2');
  });
});