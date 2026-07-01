import { validateContractChecklist } from '../../src/logic/it-1-1-1';

describe('営業成果データの自動検証ルール定義と異常検出機能', () => {
  // SCEN-1107
  test('チェックリスト項目数が最小値の場合でも、すべての項目が合格条件を満たせば合格となること', () => {
    const checklistItems = [
      {
        itemId: 'contract_001',
        itemName: '契約書ファイル確認',
        passCondition: 'ファイルが存在し、ファイルサイズが1KB以上',
        actualValue: 'file_size_5000_bytes',
        isPass: true,
      },
    ];

    const validationInput = {
      contractId: 'CONTRACT_2024_001',
      checklistItemCount: 1,
      items: checklistItems,
      executionTimestamp: new Date('2024-01-15T09:00:00Z'),
      executorId: 'USER_ADMIN_001',
    };

    const result = validateContractChecklist(validationInput);

    expect(result.overallStatus).toBe('合格');
    expect(result.itemCount).toBe(1);
    expect(result.passCount).toBe(1);
    expect(result.failCount).toBe(0);
    expect(result.passRate).toBe(100);
    expect(result.validationLog).toContain('すべての項目が合格条件を満たしている');
    expect(result.savedToDb).toBe(true);
    expect(result.dbRecordId).toBeDefined();
    expect(typeof result.dbRecordId).toBe('string');
    expect(result.dbRecordId.length).toBeGreaterThan(0);
  });
});