import { generateStakeholderReport } from '../../src/logic/it-1-br-2-2-2-1';

describe('ステークホルダー別カスタマイズレポート生成 - 原価管理システム運用者向け', () => {
  test('SCEN-1243: 原価管理システム運用者向けレポートが技術詳細を含むフォーマットで生成される', () => {
    // Arrange
    const reportGenerationRequest = {
      stakeholderType: 'system_operator',
      periodStartDate: '2024-04-01',
      periodEndDate: '2024-05-01',
      generatedDateTime: '2024-05-15T10:30:00Z',
    };

    // Act
    const result = generateStakeholderReport(reportGenerationRequest);

    // Assert - レポートの基本構成を検証
    expect(result).toBeDefined();
    expect(result.reportId).toBeTruthy();
    expect(result.stakeholderType).toBe('system_operator');
    expect(result.generatedDateTime).toBe('2024-05-15T10:30:00Z');

    // Assert - レポートフォーマットが有効であることを検証
    expect(['pdf', 'csv', 'excel']).toContain(result.reportFormat);
    expect(result.reportFormat).toBe('pdf');

    // Assert - ファイル名にステークホルダー種別と生成日時を含むことを検証
    const expectedFilenamePart = 'system_operator_20240515T103000Z';
    expect(result.fileName).toContain('system_operator');
    expect(result.fileName).toContain('20240515');
    expect(result.fileName).toMatch(/system_operator_\d{8}T\d{6}Z/);

    // Assert - 必須な技術詳細要素 (1) 査定データの詳細な仕様・構造情報を検証
    expect(result.reportContent.sections).toBeDefined();
    const specificationSection = result.reportContent.sections.find(
      (s: any) => s.sectionType === 'assessment_data_specification'
    );
    expect(specificationSection).toBeDefined();
    expect(specificationSection.title).toBe('査定データ詳細仕様');
    expect(specificationSection.content).toContain('field_name');
    expect(specificationSection.content).toContain('data_type');
    expect(specificationSection.dataStructureFields).toContain('assessment_id');
    expect(specificationSection.dataStructureFields).toContain('assessor_id');
    expect(specificationSection.dataStructureFields).toContain('judgment_date');

    // Assert - 必須な技術詳細要素 (2) システムパラメータ設定値を検証
    const parameterSection = result.reportContent.sections.find(
      (s: any) => s.sectionType === 'system_parameters'
    );
    expect(parameterSection).toBeDefined();
    expect(parameterSection.title).toBe('システムパラメータ設定値');
    expect(parameterSection.parameters).toBeDefined();
    expect(parameterSection.parameters.ocrAccuracyThreshold).toBe(0.85);
    expect(parameterSection.parameters.aiJudgmentConfidenceThreshold).toBe(0.75);
    expect(parameterSection.parameters.deviationRateAlertThreshold).toBe(0.2);
    expect(parameterSection.parameters.maxProcessingTimeMinutes).toBe(30);

    // Assert - 必須な技術詳細要素 (3) 計算ロジックおよびアルゴリズムの説明を検証
    const algorithmSection = result.reportContent.sections.find(
      (s: any) => s.sectionType === 'calculation_logic'
    );
    expect(algorithmSection).toBeDefined();
    expect(algorithmSection.title).toBe('計算ロジックおよびアルゴリズム説明');
    expect(algorithmSection.algorithms).toBeDefined();
    expect(algorithmSection.algorithms.length).toBeGreaterThan(0);
    const deviationCalcAlgo = algorithmSection.algorithms.find(
      (a: any) => a.algorithmName === 'market_deviation_calculation'
    );
    expect(deviationCalcAlgo).toBeDefined();
    expect(deviationCalcAlgo.formulaDescription).toContain('deviation_rate');
    expect(deviationCalcAlgo.formulaDescription).toContain('estimate_amount');
    expect(deviationCalcAlgo.formulaDescription).toContain('reference_amount');

    // Assert - 必須な技術詳細要素 (4) データ処理フロー図を検証
    const flowSection = result.reportContent.sections.find(
      (s: any) => s.sectionType === 'data_processing_flow'
    );
    expect(flowSection).toBeDefined();
    expect(flowSection.title).toBe('データ処理フロー図');
    expect(flowSection.flowDiagrams).toBeDefined();
    expect(flowSection.flowDiagrams.length).toBeGreaterThan(0);
    const ocrFlow = flowSection.flowDiagrams.find(
      (d: any) => d.flowName === 'ocr_to_judgment'
    );
    expect(ocrFlow).toBeDefined();
    expect(ocrFlow.steps).toBeDefined();
    expect(ocrFlow.steps.length).toBeGreaterThanOrEqual(4);
    expect(ocrFlow.steps[0].stepName).toBe('file_upload');
    expect(ocrFlow.steps[1].stepName).toBe('ocr_processing');
    expect(ocrFlow.steps[2].stepName).toBe('learning_data_comparison');
    expect(ocrFlow.steps[3].stepName).toBe('judgment_output');

    // Assert - 必須な技術詳細要素 (5) エラーコードと対応内容を検証
    const errorCodeSection = result.reportContent.sections.find(
      (s: any) => s.sectionType === 'error_codes'
    );
    expect(errorCodeSection).toBeDefined();
    expect(errorCodeSection.title).toBe('エラーコードと対応内容');
    expect(errorCodeSection.errorCodes).toBeDefined();
    expect(errorCodeSection.errorCodes.length).toBeGreaterThan(0);
    const ocrErrorCode = errorCodeSection.errorCodes.find(
      (e: any) => e.code === 'OCR_001'
    );
    expect(ocrErrorCode).toBeDefined();
    expect(ocrErrorCode.description).toBe('OCR読取精度が閾値以下');
    expect(ocrErrorCode.recoveryAction).toContain('manual_verification');
    const aiErrorCode = errorCodeSection.errorCodes.find(
      (e: any) => e.code === 'AI_002'
    );
    expect(aiErrorCode).toBeDefined();
    expect(aiErrorCode.description).toBe('AI判定信頼度が不足');

    // Assert - 必須な技術詳細要素 (6) パフォーマンス指標を検証
    const performanceSection = result.reportContent.sections.find(
      (s: any) => s.sectionType === 'performance_metrics'
    );
    expect(performanceSection).toBeDefined();
    expect(performanceSection.title).toBe('パフォーマンス指標');
    expect(performanceSection.metrics).toBeDefined();
    expect(performanceSection.metrics.avgProcessingTimeSeconds).toBe(18.5);
    expect(performanceSection.metrics.totalProcessedEstimates).toBe(1547);
    expect(performanceSection.metrics.ocrAccuracyRate).toBe(0.927);
    expect(performanceSection.metrics.aiJudgmentAccuracyRate).toBe(0.891);
    expect(performanceSection.metrics.systemUptimePercent).toBe(99.87);

    // Assert - レポートの時間範囲が指定通りであることを検証
    expect(result.reportPeriod.startDate).toBe('2024-04-01');
    expect(result.reportPeriod.endDate).toBe('2024-05-01');

    // Assert - ファイル名の形式を詳細に検証
    expect(result.fileName).toMatch(/^system_operator_\d{8}T\d{6}Z\.(pdf|csv|xlsx)$/);
    expect(result.fileName).toBe('system_operator_20240515T103000Z.pdf');

    // Assert - レポートコンテンツが完全であることを検証
    expect(result.reportContent.title).toBe('原価管理システム運用者向け査定品質レポート');
    expect(result.reportContent.sections.length).toBe(6);

    // Assert - 出力フォーマットの検証
    expect(result.fileFormat).toBe('application/pdf');
    expect(result.fileSizeBytes).toBeGreaterThan(0);
    expect(result.fileSizeBytes).toBe(285634);

    // Assert - メタデータの検証
    expect(result.metadata).toBeDefined();
    expect(result.metadata.createdBy).toBe('system_operator');
    expect(result.metadata.dataSourceVersion).toBe('v2.1.0');
    expect(result.metadata.reportVersion).toBe('2024-05-15-001');
  });
});