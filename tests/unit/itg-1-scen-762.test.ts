import { determineActiveContractVersion } from '../../src/logic/it-1781935279444-2-1-1';

describe('営業データ入力時の品質検証ルール定義・実行機能', () => {
  // SCEN-762: [normal] 顧客別・案件別の有効版自動判定
  test('指定顧客・案件・有効期限から最新の有効バージョンが正確に特定される', () => {
    // テストデータセットアップ: 顧客A・案件X に対して複数バージョンを定義
    const versionData = [
      {
        customerId: 'CUST-001',
        projectId: 'PROJ-X',
        versionNumber: 1,
        effectiveStartDate: new Date('2024-01-01T00:00:00Z'),
        effectiveEndDate: new Date('2024-02-28T23:59:59Z'),
        status: 'archived',
      },
      {
        customerId: 'CUST-001',
        projectId: 'PROJ-X',
        versionNumber: 2,
        effectiveStartDate: new Date('2024-02-15T00:00:00Z'),
        effectiveEndDate: new Date('2024-04-30T23:59:59Z'),
        status: 'active',
      },
      {
        customerId: 'CUST-001',
        projectId: 'PROJ-X',
        versionNumber: 3,
        effectiveStartDate: new Date('2024-04-01T00:00:00Z'),
        effectiveEndDate: new Date('2024-12-31T23:59:59Z'),
        status: 'active',
      },
    ];

    // ケース1: 複数バージョンが有効期限範囲に該当する日時（2024-04-15）での判定
    // 有効期限に該当するバージョン: v2（2024-02-15～2024-04-30）, v3（2024-04-01～2024-12-31）
    // 期待: 最新バージョン（v3）が返される
    const resultCase1 = determineActiveContractVersion(
      versionData,
      'CUST-001',
      'PROJ-X',
      new Date('2024-04-15T10:00:00Z')
    );
    expect(resultCase1).toEqual({
      customerId: 'CUST-001',
      projectId: 'PROJ-X',
      versionNumber: 3,
      effectiveStartDate: new Date('2024-04-01T00:00:00Z'),
      effectiveEndDate: new Date('2024-12-31T23:59:59Z'),
      status: 'active',
    });

    // ケース2: 単一バージョンのみ有効期限内である日時（2024-03-01）での判定
    // 有効期限に該当するバージョン: v2（2024-02-15～2024-04-30）
    // 期待: そのバージョン（v2）が返される
    const resultCase2 = determineActiveContractVersion(
      versionData,
      'CUST-001',
      'PROJ-X',
      new Date('2024-03-01T10:00:00Z')
    );
    expect(resultCase2).toEqual({
      customerId: 'CUST-001',
      projectId: 'PROJ-X',
      versionNumber: 2,
      effectiveStartDate: new Date('2024-02-15T00:00:00Z'),
      effectiveEndDate: new Date('2024-04-30T23:59:59Z'),
      status: 'active',
    });

    // ケース3: 複数バージョンの有効期限外である日時（2023-12-15）での判定
    // 有効期限に該当するバージョン: なし
    // 期待: null または エラーが返される
    const resultCase3 = determineActiveContractVersion(
      versionData,
      'CUST-001',
      'PROJ-X',
      new Date('2023-12-15T10:00:00Z')
    );
    expect(resultCase3).toBeNull();

    // ケース4: 異なる顧客データでの判定結果が分離されることを確認
    // 顧客Bのデータセットアップ
    const versionDataCustomerB = [
      {
        customerId: 'CUST-002',
        projectId: 'PROJ-Y',
        versionNumber: 1,
        effectiveStartDate: new Date('2024-05-01T00:00:00Z'),
        effectiveEndDate: new Date('2024-06-30T23:59:59Z'),
        status: 'active',
      },
    ];

    const resultCase4 = determineActiveContractVersion(
      versionDataCustomerB,
      'CUST-002',
      'PROJ-Y',
      new Date('2024-05-15T10:00:00Z')
    );
    expect(resultCase4).toEqual({
      customerId: 'CUST-002',
      projectId: 'PROJ-Y',
      versionNumber: 1,
      effectiveStartDate: new Date('2024-05-01T00:00:00Z'),
      effectiveEndDate: new Date('2024-06-30T23:59:59Z'),
      status: 'active',
    });

    // ケース5: 顧客A・案件XでのCase1の判定結果と
    // 顧客B・案件YでのCase4の判定結果が異なることを確認（分離確認）
    expect(resultCase1.versionNumber).toBe(3);
    expect(resultCase4.versionNumber).toBe(1);
    expect(resultCase1.customerId).not.toBe(resultCase4.customerId);
    expect(resultCase1.projectId).not.toBe(resultCase4.projectId);
  });
});