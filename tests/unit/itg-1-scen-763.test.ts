import { determineValidVersion } from '../../src/logic/it-1781935279444-2-1-1';

describe('顧客別・案件別の有効版自動判定機能', () => {
  test('SCEN-763: 有効期限が切れたバージョンは有効版として判定されない', () => {
    // テストデータ: 複数バージョン（有効期限が異なる）
    const customerId = 'CUST-001';
    const projectId = 'PROJ-001';
    const currentDate = new Date('2024-06-15T00:00:00Z');

    const versions = [
      {
        versionId: 'VER-001',
        customerId,
        projectId,
        documentType: 'contract',
        versionNumber: 1,
        effectiveStartDate: new Date('2023-01-01T00:00:00Z'),
        effectiveEndDate: new Date('2024-03-31T23:59:59Z'), // 期限切れ
        createdAt: new Date('2023-01-01T00:00:00Z'),
        createdBy: 'user-a',
        isActive: true,
      },
      {
        versionId: 'VER-002',
        customerId,
        projectId,
        documentType: 'contract',
        versionNumber: 2,
        effectiveStartDate: new Date('2024-04-01T00:00:00Z'),
        effectiveEndDate: new Date('2025-12-31T23:59:59Z'), // 有効期間内
        createdAt: new Date('2024-04-01T00:00:00Z'),
        createdBy: 'user-b',
        isActive: true,
      },
      {
        versionId: 'VER-003',
        customerId,
        projectId,
        documentType: 'contract',
        versionNumber: 3,
        effectiveStartDate: new Date('2024-05-15T00:00:00Z'),
        effectiveEndDate: new Date('2026-06-30T23:59:59Z'), // 有効期間内（最新）
        createdAt: new Date('2024-05-15T00:00:00Z'),
        createdBy: 'user-c',
        isActive: true,
      },
    ];

    // 有効版自動判定実行
    const result = determineValidVersion({
      customerId,
      projectId,
      versions,
      evaluationDate: currentDate,
    });

    // 期待結果の検証
    // 1. 期限切れバージョン（VER-001）は有効版として判定されない
    expect(result.validVersions.some((v) => v.versionId === 'VER-001')).toBe(
      false
    );

    // 2. 有効期間内のバージョン（VER-002, VER-003）は有効版として判定される
    expect(result.validVersions.map((v) => v.versionId)).toContain('VER-002');
    expect(result.validVersions.map((v) => v.versionId)).toContain('VER-003');

    // 3. 最新の有効期限内バージョン（VER-003）が最優先版として正確に選定される
    expect(result.primaryVersion.versionId).toBe('VER-003');
    expect(result.primaryVersion.effectiveEndDate).toEqual(
      new Date('2026-06-30T23:59:59Z')
    );

    // 4. 除外判定の詳細情報を検証
    const excludedVersion = result.exclusionLog.find(
      (log) => log.versionId === 'VER-001'
    );
    expect(excludedVersion).toBeDefined();
    expect(excludedVersion?.reason).toMatch(/有効期限切れ/);
    expect(excludedVersion?.excludedAt).toBeDefined();

    // 5. 有効版リストの数が正確に2（VER-002, VER-003）であることを確認
    expect(result.validVersions).toHaveLength(2);

    // 6. 最優先版が有効版リスト内に含まれていることを確認
    expect(result.validVersions.some((v) => v.versionId === 'VER-003')).toBe(
      true
    );

    // 7. システムログに判定結果が記録されていることを確認
    expect(result.systemLog).toBeDefined();
    expect(result.systemLog.evaluatedAt).toEqual(currentDate);
    expect(result.systemLog.totalVersionsEvaluated).toBe(3);
    expect(result.systemLog.validVersionCount).toBe(2);
    expect(result.systemLog.excludedVersionCount).toBe(1);
  });
});