import { determinePriorityOrderForContractChanges } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目のメタデータ管理機能 - 複数契約変更の優先順序判定', () => {
  // SCEN-1264
  test('請求額計算への影響度が同一の複数契約変更で処理順序が一貫性を保つ', () => {
    // テストデータ: 請求額計算への影響度が同一（影響度レベル=3）の複数契約変更（5件）
    const contractChanges = [
      {
        changeId: 'CC-00005',
        contractId: 'CTR-00005',
        changedAt: new Date('2024-01-15T09:30:00Z'),
        impactLevel: 3,
        changeType: 'service_addition',
        affectedAmount: 45000,
      },
      {
        changeId: 'CC-00003',
        contractId: 'CTR-00003',
        changedAt: new Date('2024-01-15T08:00:00Z'),
        impactLevel: 3,
        changeType: 'discount_modification',
        affectedAmount: 45000,
      },
      {
        changeId: 'CC-00001',
        contractId: 'CTR-00001',
        changedAt: new Date('2024-01-15T07:15:00Z'),
        impactLevel: 3,
        changeType: 'billing_term_change',
        affectedAmount: 45000,
      },
      {
        changeId: 'CC-00004',
        contractId: 'CTR-00004',
        changedAt: new Date('2024-01-15T09:00:00Z'),
        impactLevel: 3,
        changeType: 'service_addition',
        affectedAmount: 45000,
      },
      {
        changeId: 'CC-00002',
        contractId: 'CTR-00002',
        changedAt: new Date('2024-01-15T07:45:00Z'),
        impactLevel: 3,
        changeType: 'discount_modification',
        affectedAmount: 45000,
      },
    ];

    // 1回目の処理実行
    const result1 = determinePriorityOrderForContractChanges(contractChanges);
    const order1 = result1.map((item) => item.changeId);

    // 2回目の処理実行
    const result2 = determinePriorityOrderForContractChanges(contractChanges);
    const order2 = result2.map((item) => item.changeId);

    // 3回目の処理実行
    const result3 = determinePriorityOrderForContractChanges(contractChanges);
    const order3 = result3.map((item) => item.changeId);

    // 4回目の処理実行
    const result4 = determinePriorityOrderForContractChanges(contractChanges);
    const order4 = result4.map((item) => item.changeId);

    // 期待値: 変更日時でソートされた順序
    const expectedOrder = [
      'CC-00001',
      'CC-00002',
      'CC-00003',
      'CC-00004',
      'CC-00005',
    ];

    // 複数回の実行で処理順序が完全に一致することを検証
    expect(order1).toEqual(expectedOrder);
    expect(order2).toEqual(expectedOrder);
    expect(order3).toEqual(expectedOrder);
    expect(order4).toEqual(expectedOrder);

    // 各実行回同士の順序が完全に一致することを検証
    expect(order1).toEqual(order2);
    expect(order2).toEqual(order3);
    expect(order3).toEqual(order4);

    // 返却されたデータ構造が正しく保持されていることを検証
    expect(result1[0]).toEqual({
      changeId: 'CC-00001',
      contractId: 'CTR-00001',
      changedAt: new Date('2024-01-15T07:15:00Z'),
      impactLevel: 3,
      changeType: 'billing_term_change',
      affectedAmount: 45000,
    });

    expect(result1[4]).toEqual({
      changeId: 'CC-00005',
      contractId: 'CTR-00005',
      changedAt: new Date('2024-01-15T09:30:00Z'),
      impactLevel: 3,
      changeType: 'service_addition',
      affectedAmount: 45000,
    });

    // ソート対象キー項目（変更日時）が正しく機能していることを確認
    for (let i = 0; i < result1.length - 1; i++) {
      expect(
        result1[i].changedAt.getTime() <= result1[i + 1].changedAt.getTime()
      ).toBe(true);
    }

    // 結果の件数が入力と同じであることを検証
    expect(result1.length).toBe(5);
    expect(result2.length).toBe(5);
    expect(result3.length).toBe(5);
    expect(result4.length).toBe(5);
  });
});