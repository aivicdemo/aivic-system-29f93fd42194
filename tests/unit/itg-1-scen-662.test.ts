import { defineMetadata, retrieveMetadata, validateMetadataConsistency } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目メタデータ一元管理機能', () => {
  // SCEN-662: [normal] 営業データ項目定義（項目名・単位・データ型・計算ロジック）が統一される
  test('should unify sales data item metadata definition across multiple administrators and reporting screens', () => {
    // 1. 新規営業データ項目定義を作成
    const newItemDefinition = {
      itemName: '売上金額',
      unit: '円',
      dataType: '数値（10,2）',
      calculationLogic: '受注金額×納入率'
    };

    // 2. 項目定義を保存
    const savedItemId = defineMetadata(newItemDefinition);
    expect(savedItemId).toBeDefined();
    expect(typeof savedItemId).toBe('string');

    // 3. 別の管理者アカウントで同一の項目定義を取得
    const retrievedMetadata = retrieveMetadata(savedItemId);

    // 4. 項目名が一致することを検証
    expect(retrievedMetadata.itemName).toBe('売上金額');

    // 5. 単位が一致することを検証
    expect(retrievedMetadata.unit).toBe('円');

    // 6. データ型が一致することを検証
    expect(retrievedMetadata.dataType).toBe('数値（10,2）');

    // 7. 計算ロジックが一致することを検証
    expect(retrievedMetadata.calculationLogic).toBe('受注金額×納入率');

    // 8. 複数のレポート画面やダッシュボード内での整合性を検証
    const consistencyCheckResult = validateMetadataConsistency({
      metadataId: savedItemId,
      screenNames: ['reportDashboard', 'billingReport', 'performanceAnalysis']
    });

    // 9. すべてのレポート画面で一元管理されたメタデータが適用されていることを検証
    expect(consistencyCheckResult.isConsistent).toBe(true);
    expect(consistencyCheckResult.appliedScreens).toEqual(['reportDashboard', 'billingReport', 'performanceAnalysis']);
    expect(consistencyCheckResult.definitionCount).toBe(1);
    expect(consistencyCheckResult.metadata.itemName).toBe('売上金額');
    expect(consistencyCheckResult.metadata.unit).toBe('円');
    expect(consistencyCheckResult.metadata.dataType).toBe('数値（10,2）');
    expect(consistencyCheckResult.metadata.calculationLogic).toBe('受注金額×納入率');
  });
});