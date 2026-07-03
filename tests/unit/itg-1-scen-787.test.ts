import { identifyHighestPriorityVersion } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目メタデータ管理 - 複数バージョン存在時の優先度ベース特定機能', () => {
  // SCEN-787
  test('同一顧客・案件に対して優先度の異なる複数バージョンが存在する場合、最も優先度が高いバージョンを返す', () => {
    // Arrange
    const customerId = 'CUST-001';
    const projectId = 'PROJ-001';

    const versionDataSet = [
      {
        versionId: 'v1',
        customerId: 'CUST-001',
        projectId: 'PROJ-001',
        priority: 3,
        versionName: 'Contract v1.0',
        effectiveDate: '2024-01-01',
        expiryDate: '2024-06-30',
        unitName: '件',
        dataType: 'number',
        calculationLogic: 'SUM(appts)',
        reportMapping: 'appointmentsCount',
        qualityCheckRule: 'mandatory|range:0-999',
        createdAt: '2024-01-01T09:00:00Z',
        updatedAt: '2024-01-01T09:00:00Z',
      },
      {
        versionId: 'v2',
        customerId: 'CUST-001',
        projectId: 'PROJ-001',
        priority: 1,
        versionName: 'Contract v2.0',
        effectiveDate: '2024-07-01',
        expiryDate: '2024-12-31',
        unitName: '件',
        dataType: 'number',
        calculationLogic: 'SUM(appts_adjusted)',
        reportMapping: 'adjustedAppointmentsCount',
        qualityCheckRule: 'mandatory|range:0-1000',
        createdAt: '2024-07-01T10:00:00Z',
        updatedAt: '2024-07-01T10:00:00Z',
      },
      {
        versionId: 'v3',
        customerId: 'CUST-001',
        projectId: 'PROJ-001',
        priority: 2,
        versionName: 'Contract v1.5',
        effectiveDate: '2024-04-01',
        expiryDate: '2024-06-30',
        unitName: '件',
        dataType: 'number',
        calculationLogic: 'SUM(appts_interim)',
        reportMapping: 'interimAppointmentsCount',
        qualityCheckRule: 'mandatory|range:0-950',
        createdAt: '2024-04-01T08:30:00Z',
        updatedAt: '2024-04-01T08:30:00Z',
      },
    ];

    // Act
    const result = identifyHighestPriorityVersion(
      customerId,
      projectId,
      versionDataSet
    );

    // Assert
    // 優先度最小値（最高優先度）はv2で優先度1
    expect(result.versionId).toBe('v2');
    expect(result.priority).toBe(1);
    expect(result.versionName).toBe('Contract v2.0');
    expect(result.effectiveDate).toBe('2024-07-01');
    expect(result.expiryDate).toBe('2024-12-31');

    // メタデータの完全性確認
    expect(result.unitName).toBe('件');
    expect(result.dataType).toBe('number');
    expect(result.calculationLogic).toBe('SUM(appts_adjusted)');
    expect(result.reportMapping).toBe('adjustedAppointmentsCount');
    expect(result.qualityCheckRule).toBe('mandatory|range:0-1000');

    // タイムスタンプの確認
    expect(result.createdAt).toBe('2024-07-01T10:00:00Z');
    expect(result.updatedAt).toBe('2024-07-01T10:00:00Z');

    // 返されたバージョンが配列内の正しい順序位置から選択されたことを確認
    expect(result.customerId).toBe('CUST-001');
    expect(result.projectId).toBe('PROJ-001');
  });
});