import { validateLearningDatasetQuality } from '../../src/logic/it-6-2-1-1';

describe('学習データセット品質検証', () => {
  test('SCEN-1356: [normal] 他部署フォーマット適合性と品質基準をすべて満たすデータセットは合格と判定される', () => {
    // 他部署フォーマットの項目体系定義
    const otherDepartmentItemSchema = {
      items: [
        { itemId: 'WORK_TYPE', name: '工事種別', dataType: 'string', required: true },
        { itemId: 'QUANTITY', name: '数量', dataType: 'number', required: true },
        { itemId: 'UNIT_PRICE', name: '単価', dataType: 'number', required: true },
        { itemId: 'REGION', name: '地域', dataType: 'string', required: true },
        { itemId: 'DATE', name: '施工日', dataType: 'date', required: true },
      ],
    };

    // 他部署フォーマットの金額体系定義
    const otherDepartmentAmountSchema = {
      currencyUnit: 'JPY',
      decimalPlaces: 2,
      minAmount: 0,
      maxAmount: 999999999,
      amountFields: ['UNIT_PRICE'],
    };

    // 収集データセット（他部署フォーマット対応）
    const collectedDataset = {
      records: [
        {
          WORK_TYPE: '鉄骨工事',
          QUANTITY: 150,
          UNIT_PRICE: 45000.00,
          REGION: '東京都',
          DATE: '2024-01-15',
        },
        {
          WORK_TYPE: '基礎工事',
          QUANTITY: 200,
          UNIT_PRICE: 32000.00,
          REGION: '神奈川県',
          DATE: '2024-01-20',
        },
        {
          WORK_TYPE: '外壁工事',
          QUANTITY: 320,
          UNIT_PRICE: 28000.00,
          REGION: '東京都',
          DATE: '2024-02-05',
        },
      ],
      totalRecords: 3,
      dataCollectionPeriod: {
        startDate: '2024-01-01',
        endDate: '2024-02-28',
      },
    };

    // 品質基準定義
    const qualityStandards = {
      completeness: {
        requiredFieldCoverageThreshold: 100, // 必須フィールド100%網羅
        allowedMissingPercentage: 0,
      },
      accuracy: {
        dataTypeMatchThreshold: 100, // データ型一致度100%
        valueRangeThreshold: 100, // 値域範囲適合度100%
      },
      consistency: {
        recordConsistencyThreshold: 100, // レコード間の一貫性100%
        fieldConsistencyThreshold: 100, // フィールド値の一貫性100%
      },
      validity: {
        logicalValidityThreshold: 100, // 論理的妥当性100%
        businessRuleConformityThreshold: 100, // 業務ルール適合度100%
      },
      minRecordCount: 3, // 最小レコード数
      regionCoverageThreshold: 50, // 地域カバー率50%以上
    };

    // テスト対象関数を実行
    const validationResult = validateLearningDatasetQuality({
      collectedDataset,
      otherDepartmentItemSchema,
      otherDepartmentAmountSchema,
      qualityStandards,
    });

    // 期待結果：収集データが他部署フォーマットの項目体系と金額体系に完全適合し、品質基準をすべて満たす
    expect(validationResult.validationStatus).toBe('PASSED');
    expect(validationResult.isQualityApproved).toBe(true);

    // 項目体系適合性の検証
    expect(validationResult.itemSchemaValidation.isConforming).toBe(true);
    expect(validationResult.itemSchemaValidation.conformityPercentage).toBe(100);
    expect(validationResult.itemSchemaValidation.missingItems).toEqual([]);
    expect(validationResult.itemSchemaValidation.extraItems).toEqual([]);

    // 金額体系適合性の検証
    expect(validationResult.amountSchemaValidation.isConforming).toBe(true);
    expect(validationResult.amountSchemaValidation.currencyMatch).toBe(true);
    expect(validationResult.amountSchemaValidation.decimalPlacesMatch).toBe(true);
    expect(validationResult.amountSchemaValidation.valueRangeConformityPercentage).toBe(100);

    // 完全性検証
    expect(validationResult.qualityMetrics.completeness.score).toBe(100);
    expect(validationResult.qualityMetrics.completeness.requiredFieldsCovered).toBe(5);
    expect(validationResult.qualityMetrics.completeness.totalRequiredFields).toBe(5);
    expect(validationResult.qualityMetrics.completeness.missingFieldCount).toBe(0);

    // 正確性検証
    expect(validationResult.qualityMetrics.accuracy.score).toBe(100);
    expect(validationResult.qualityMetrics.accuracy.dataTypeMatchPercentage).toBe(100);
    expect(validationResult.qualityMetrics.accuracy.valueRangeConformityPercentage).toBe(100);
    expect(validationResult.qualityMetrics.accuracy.dataTypeConflictCount).toBe(0);

    // 一貫性検証
    expect(validationResult.qualityMetrics.consistency.score).toBe(100);
    expect(validationResult.qualityMetrics.consistency.recordConsistencyPercentage).toBe(100);
    expect(validationResult.qualityMetrics.consistency.fieldConsistencyPercentage).toBe(100);
    expect(validationResult.qualityMetrics.consistency.inconsistentRecordCount).toBe(0);

    // 妥当性検証
    expect(validationResult.qualityMetrics.validity.score).toBe(100);
    expect(validationResult.qualityMetrics.validity.logicalValidityPercentage).toBe(100);
    expect(validationResult.qualityMetrics.validity.businessRuleConformityPercentage).toBe(100);
    expect(validationResult.qualityMetrics.validity.validityViolationCount).toBe(0);

    // データセット全体の統計
    expect(validationResult.datasetStatistics.totalRecordCount).toBe(3);
    expect(validationResult.datasetStatistics.processedRecordCount).toBe(3);
    expect(validationResult.datasetStatistics.rejectedRecordCount).toBe(0);
    expect(validationResult.datasetStatistics.regionCoveragePercentage).toBeGreaterThanOrEqual(50);

    // 地域カバー率の詳細（検証対象：東京都、神奈川県でカバー率50%以上）
    expect(validationResult.datasetStatistics.regionDistribution).toHaveProperty('東京都');
    expect(validationResult.datasetStatistics.regionDistribution).toHaveProperty('神奈川県');
    expect(validationResult.datasetStatistics.regionDistribution['東京都']).toBe(2);
    expect(validationResult.datasetStatistics.regionDistribution['神奈川県']).toBe(1);

    // 総合品質スコア（各品質指標の平均）
    // (完全性100 + 正確性100 + 一貫性100 + 妥当性100) / 4 = 100
    expect(validationResult.overallQualityScore).toBe(100);

    // 品質検証レポート
    expect(validationResult.validationReport.conformityStatus).toBe('FULLY_CONFORMING');
    expect(validationResult.validationReport.approvalStatus).toBe('APPROVED');
    expect(validationResult.validationReport.qualityLevelRating).toBe('EXCELLENT');
    expect(validationResult.validationReport.readinessForLearning).toBe(true);

    // 検証エラーまたは警告がないこと
    expect(validationResult.errors).toEqual([]);
    expect(validationResult.warnings).toEqual([]);

    // 検証メタデータ
    expect(validationResult.validationMetadata.validationTimestamp).toBeDefined();
    expect(validationResult.validationMetadata.validationDurationMs).toBeGreaterThan(0);
    expect(validationResult.validationMetadata.validatorVersion).toBe('1.0.0');
  });
});