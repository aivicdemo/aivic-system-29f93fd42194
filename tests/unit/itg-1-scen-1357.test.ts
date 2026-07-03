import { validateAndTransformSalesData } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目のメタデータ管理機能 - データ形式互換性検証と自動変換', () => {
  // SCEN-1357
  test('[normal] 営業システムのデータ形式が仕様と不一致の場合、必要な変換ルールが特定され、自動的に変換される', () => {
    // ======== テストデータ準備 ========
    // 営業システムから出力されたデータ形式（不一致パターン）
    const inputDataFromSalesSystem = {
      customerId: '12345',                    // 仕様: number, 入力: string
      appointmentCount: '5',                  // 仕様: number, 入力: string
      contractAmount: '1000000',              // 仕様: number (¥単位), 入力: string
      serviceType: 'SERVICE_A',               // 仕様: enum / ローマ字小文字, 入力: スネークケース
      activityDate: '2024-01-15',             // 仕様: ISO 8601 フル timestamp, 入力: yyyy-MM-dd のみ
      customerFeedback: 'positive',           // 仕様: enum (1=positive, 2=neutral, 3=negative), 入力: 文字列
      responseRate: '0.85',                   // 仕様: 0～1 範囲の number, 入力: string パーセンテージ表記
    };

    // 仕様スキーマ定義
    const specificationSchema = {
      customerId: { type: 'number', required: true, description: '顧客ID' },
      appointmentCount: { type: 'number', required: true, description: 'アポ数' },
      contractAmount: { type: 'number', required: true, unit: 'JPY', description: '契約金額' },
      serviceType: { type: 'enum', enum: ['service_a', 'service_b', 'service_c'], description: 'サービス種別' },
      activityDate: { type: 'timestamp', format: 'ISO8601', required: true, description: '営業活動日時' },
      customerFeedback: { type: 'enum', enum: [1, 2, 3], enumMap: { positive: 1, neutral: 2, negative: 3 }, description: '顧客反応' },
      responseRate: { type: 'number', min: 0, max: 1, description: '応答率（0～1）' },
    };

    // ======== 実行 ========
    const result = validateAndTransformSalesData(inputDataFromSalesSystem, specificationSchema);

    // ======== 検証: 不一致検出 ========
    expect(result.isValid).toBe(false);
    expect(result.mismatchesDetected).toBe(true);
    expect(result.mismatchCount).toBe(7); // 全フィールドで不一致

    // ======== 検証: 変換ルール特定 ========
    expect(result.transformationRules).toBeDefined();
    expect(result.transformationRules.length).toBe(7);

    // 変換ルール 1: customerId (string → number)
    const ruleCustomerId = result.transformationRules.find((r: any) => r.fieldName === 'customerId');
    expect(ruleCustomerId).toBeDefined();
    expect(ruleCustomerId.sourceType).toBe('string');
    expect(ruleCustomerId.targetType).toBe('number');
    expect(ruleCustomerId.transformationLogic).toBe('parseInt');
    expect(ruleCustomerId.severity).toBe('critical');

    // 変換ルール 2: appointmentCount (string → number)
    const ruleAppointmentCount = result.transformationRules.find((r: any) => r.fieldName === 'appointmentCount');
    expect(ruleAppointmentCount).toBeDefined();
    expect(ruleAppointmentCount.sourceType).toBe('string');
    expect(ruleAppointmentCount.targetType).toBe('number');
    expect(ruleAppointmentCount.transformationLogic).toBe('parseInt');

    // 変換ルール 3: contractAmount (string → number)
    const ruleContractAmount = result.transformationRules.find((r: any) => r.fieldName === 'contractAmount');
    expect(ruleContractAmount).toBeDefined();
    expect(ruleContractAmount.sourceType).toBe('string');
    expect(ruleContractAmount.targetType).toBe('number');
    expect(ruleContractAmount.transformationLogic).toBe('parseFloat');

    // 変換ルール 4: serviceType (SNAKE_CASE → lowercase with underscore)
    const ruleServiceType = result.transformationRules.find((r: any) => r.fieldName === 'serviceType');
    expect(ruleServiceType).toBeDefined();
    expect(ruleServiceType.sourceType).toBe('string');
    expect(ruleServiceType.targetType).toBe('string');
    expect(ruleServiceType.transformationLogic).toBe('lowercase');
    expect(ruleServiceType.fieldMapping).toEqual({
      'SERVICE_A': 'service_a',
      'SERVICE_B': 'service_b',
      'SERVICE_C': 'service_c',
    });

    // 変換ルール 5: activityDate (yyyy-MM-dd → ISO 8601 timestamp)
    const ruleActivityDate = result.transformationRules.find((r: any) => r.fieldName === 'activityDate');
    expect(ruleActivityDate).toBeDefined();
    expect(ruleActivityDate.sourceType).toBe('string');
    expect(ruleActivityDate.targetType).toBe('string');
    expect(ruleActivityDate.transformationLogic).toBe('normalizeTimestamp');
    expect(ruleActivityDate.sourceFormat).toBe('yyyy-MM-dd');
    expect(ruleActivityDate.targetFormat).toBe('ISO8601');

    // 変換ルール 6: customerFeedback (string → enum code)
    const ruleCustomerFeedback = result.transformationRules.find((r: any) => r.fieldName === 'customerFeedback');
    expect(ruleCustomerFeedback).toBeDefined();
    expect(ruleCustomerFeedback.sourceType).toBe('string');
    expect(ruleCustomerFeedback.targetType).toBe('number');
    expect(ruleCustomerFeedback.transformationLogic).toBe('enumMapping');
    expect(ruleCustomerFeedback.enumMap).toEqual({
      'positive': 1,
      'neutral': 2,
      'negative': 3,
    });

    // 変換ルール 7: responseRate (string percentage → number 0-1)
    const ruleResponseRate = result.transformationRules.find((r: any) => r.fieldName === 'responseRate');
    expect(ruleResponseRate).toBeDefined();
    expect(ruleResponseRate.sourceType).toBe('string');
    expect(ruleResponseRate.targetType).toBe('number');
    expect(ruleResponseRate.transformationLogic).toBe('parseFloat');
    expect(ruleResponseRate.normalization).toBe('rangeNormalization');
    expect(ruleResponseRate.rangeMin).toBe(0);
    expect(ruleResponseRate.rangeMax).toBe(1);

    // ======== 検証: 変換ルール適用前のコンテキスト ========
    expect(result.transformationContext).toBeDefined();
    expect(result.transformationContext.sourceSystemFormat).toBe('legacy_sales_system_v1');
    expect(result.transformationContext.targetFormat).toBe('billing_standard_v2');
    expect(result.transformationContext.requiresManualReview).toBe(false);

    // ======== 実行: 変換ルール適用 ========
    expect(result.transformedData).toBeDefined();

    // ======== 検証: 変換後のデータ正確性 ========
    const transformed = result.transformedData;

    // customerId: "12345" → 12345 (number)
    expect(transformed.customerId).toBe(12345);
    expect(typeof transformed.customerId).toBe('number');

    // appointmentCount: "5" → 5 (number)
    expect(transformed.appointmentCount).toBe(5);
    expect(typeof transformed.appointmentCount).toBe('number');

    // contractAmount: "1000000" → 1000000 (number)
    expect(transformed.contractAmount).toBe(1000000);
    expect(typeof transformed.contractAmount).toBe('number');

    // serviceType: "SERVICE_A" → "service_a" (lowercase)
    expect(transformed.serviceType).toBe('service_a');
    expect(result.transformationRules.find((r: any) => r.fieldName === 'serviceType').appliedSuccessfully).toBe(true);

    // activityDate: "2024-01-15" → "2024-01-15T00:00:00Z" (ISO 8601)
    expect(transformed.activityDate).toBe('2024-01-15T00:00:00Z');
    expect(transformed.activityDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

    // customerFeedback: "positive" → 1 (enum)
    expect(transformed.customerFeedback).toBe(1);
    expect(typeof transformed.customerFeedback).toBe('number');

    // responseRate: "0.85" → 0.85 (number, within 0-1 range)
    expect(transformed.responseRate).toBe(0.85);
    expect(typeof transformed.responseRate).toBe('number');
    expect(transformed.responseRate).toBeGreaterThanOrEqual(0);
    expect(transformed.responseRate).toBeLessThanOrEqual(1);

    // ======== 検証: 変換完了ステータス ========
    expect(result.transformationStatus).toBe('completed_successfully');
    expect(result.allTransformationsApplied).toBe(true);
    expect(result.dataReadyForBillingProcess).toBe(true);

    // ======== 検証: 品質メトリクス ========
    expect(result.qualityMetrics).toBeDefined();
    expect(result.qualityMetrics.transformationSuccessRate).toBe(1.0); // 7/7 成功
    expect(result.qualityMetrics.fieldsTransformedCount).toBe(7);
    expect(result.qualityMetrics.fieldsFailedCount).toBe(0);
    expect(result.qualityMetrics.dataValidityScore).toBe(100);

    // ======== 検証: 請求処理対応状況 ========
    expect(result.readinessForDownstreamProcesses).toBeDefined();
    expect(result.readinessForDownstreamProcesses.billingCalculationReady).toBe(true);
    expect(result.readinessForDownstreamProcesses.reportGenerationReady).toBe(true);
    expect(result.readinessForDownstreamProcesses.blockers).toEqual([]);

    // ======== 検証: 監査ログ生成 ========
    expect(result.auditLog).toBeDefined();
    expect(result.auditLog.transformationStartTime).toBeDefined();
    expect(result.auditLog.transformationEndTime).toBeDefined();
    expect(result.auditLog.rulesAppliedCount).toBe(7);
    expect(result.auditLog.dataChecksum).toBeDefined();
  });
});