import { detectAndFlagAnomalies } from '../../src/logic/it-6-2-1-1';

describe('学習データ品質検証機能 - 異常値検出とフラグ付け', () => {
  test('SCEN-1216: 異常値を検出してフラグ付けし、品質検証結果に記録する', () => {
    // 準備: テスト用の学習データセット（異常値を含む）
    const learningDataset = [
      {
        dataId: 'ld_001',
        itemName: '鉄筋工',
        unitPrice: 120000,
        quantity: 5,
        totalAmount: 600000,
        region: '東京',
        season: '2024Q1',
        recordedAt: '2024-01-15T10:30:00Z',
      },
      {
        dataId: 'ld_002',
        itemName: '型枠工',
        unitPrice: -50000,
        quantity: 3,
        totalAmount: -150000,
        region: '東京',
        season: '2024Q1',
        recordedAt: '2024-01-15T10:31:00Z',
      },
      {
        dataId: 'ld_003',
        itemName: 'コンクリート工',
        unitPrice: 85000,
        quantity: 999,
        totalAmount: 84915000,
        region: '東京',
        season: '2024Q1',
        recordedAt: '2024-01-15T10:32:00Z',
      },
      {
        dataId: 'ld_004',
        itemName: '溶接工',
        unitPrice: 95000,
        quantity: 2,
        totalAmount: 190000,
        region: '大阪',
        season: '2024Q1',
        recordedAt: '2024-01-15T10:33:00Z',
      },
      {
        dataId: 'ld_005',
        itemName: '配管工',
        unitPrice: 110000,
        quantity: null,
        totalAmount: null,
        region: '名古屋',
        season: '2024Q1',
        recordedAt: '2024-01-15T10:34:00Z',
      },
    ];

    // 実行: 品質検証を実行
    const validationResult = detectAndFlagAnomalies(learningDataset);

    // 検証1: 異常値が正確に検出されたか
    expect(validationResult.totalRecordsProcessed).toBe(5);
    expect(validationResult.anomaliesDetected).toBe(3);

    // 検証2: 異常値フラグの詳細情報が記録されているか
    expect(validationResult.flaggedAnomalies).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          dataId: 'ld_002',
          anomalyType: 'NEGATIVE_VALUE',
          fieldName: 'unitPrice',
          detectedValue: -50000,
          detectionReason: '単価がマイナス値です',
          detectionTimestamp: expect.any(String),
          severity: 'HIGH',
        }),
        expect.objectContaining({
          dataId: 'ld_003',
          anomalyType: 'OUTLIER_VALUE',
          fieldName: 'quantity',
          detectedValue: 999,
          detectionReason: '数量が異常に多い値です（IQR法で検出）',
          detectionTimestamp: expect.any(String),
          severity: 'MEDIUM',
        }),
        expect.objectContaining({
          dataId: 'ld_005',
          anomalyType: 'NULL_VALUE',
          fieldName: 'quantity',
          detectedValue: null,
          detectionReason: '必須フィールドに null 値が含まれています',
          detectionTimestamp: expect.any(String),
          severity: 'HIGH',
        }),
      ])
    );

    // 検証3: 異常値フラグの数と情報の完全性
    expect(validationResult.flaggedAnomalies.length).toBe(3);
    validationResult.flaggedAnomalies.forEach((anomaly) => {
      expect(anomaly).toHaveProperty('dataId');
      expect(anomaly).toHaveProperty('anomalyType');
      expect(anomaly).toHaveProperty('fieldName');
      expect(anomaly).toHaveProperty('detectedValue');
      expect(anomaly).toHaveProperty('detectionReason');
      expect(anomaly).toHaveProperty('detectionTimestamp');
      expect(anomaly).toHaveProperty('severity');
    });

    // 検証4: 品質検証結果ログが記録されているか
    expect(validationResult.validationLog).toBeDefined();
    expect(validationResult.validationLog.validationStartTime).toBe(
      '2024-01-15T10:30:00Z'
    );
    expect(validationResult.validationLog.validationEndTime).toBeDefined();
    expect(validationResult.validationLog.processedRecordCount).toBe(5);
    expect(validationResult.validationLog.anomalyDetectionCount).toBe(3);
    expect(validationResult.validationLog.dataQualityScore).toBe(40);

    // 検証5: レポートにおいて異常値フラグ情報が反映されているか
    const exportedReport = validationResult.exportReport();
    expect(exportedReport).toBeDefined();
    expect(exportedReport.reportTitle).toBe('学習データ品質検証レポート');
    expect(exportedReport.totalRecords).toBe(5);
    expect(exportedReport.anomalyCount).toBe(3);
    expect(exportedReport.passedRecords).toBe(2);
    expect(exportedReport.qualityScore).toBe(40);

    // 検証6: エクスポートレポートに異常値詳細が完全に含まれているか
    expect(exportedReport.anomalyDetails).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          dataId: 'ld_002',
          anomalyType: 'NEGATIVE_VALUE',
          fieldName: 'unitPrice',
          severity: 'HIGH',
        }),
        expect.objectContaining({
          dataId: 'ld_003',
          anomalyType: 'OUTLIER_VALUE',
          fieldName: 'quantity',
          severity: 'MEDIUM',
        }),
        expect.objectContaining({
          dataId: 'ld_005',
          anomalyType: 'NULL_VALUE',
          fieldName: 'quantity',
          severity: 'HIGH',
        }),
      ])
    );

    // 検証7: 品質スコアの計算が正確か（正常レコード2件/全体5件 = 40%）
    expect(exportedReport.qualityScore).toBe(40);

    // 検証8: 検証結果ステータスが正確に記録されているか
    expect(validationResult.validationStatus).toBe('COMPLETED_WITH_ANOMALIES');
    expect(validationResult.isFailed).toBe(false);
    expect(validationResult.requiresReview).toBe(true);
  });
});