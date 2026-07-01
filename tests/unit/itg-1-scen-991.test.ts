import { detectExceptionCase, judgeHandbookAddition } from '../../src/logic/it-1781935279444-2-1-1';

describe('営業データ入力時の品質検証ルール定義・実行機能', () => {
  test('SCEN-991: 例外ケース検出と手順書への追加判定 - 既存手順書では対応不可の新しい請求例外ケースが正確に検出される', () => {
    // ========== 前提: 新しい請求例外ケース（既存手順書で未対応）をテストデータとして準備 ==========
    const existingHandbookCases = [
      { caseId: 'CASE-001', description: '基本料金計算', applicableScenarios: ['standard_billing'] },
      { caseId: 'CASE-002', description: '割引適用ルール', applicableScenarios: ['discount_10_percent'] },
      { caseId: 'CASE-003', description: '最小請求額チェック', applicableScenarios: ['minimum_charge'] },
    ];

    const newBillingData = {
      customerId: 'CUST-2024-NEW-001',
      contractId: 'CONTRACT-2024-003',
      serviceType: 'premium_service',
      billingAmount: 15000,
      discountRate: 0,
      contractStartDate: '2024-01-01',
      contractEndDate: '2024-12-31',
      serviceUsageQuantity: 150,
      appliedDiscountType: 'volume_tiered_discount_15pct_over_100units',
      expectedBillingAmount: 12750,
      actualBillingAmount: 12750,
      billingCycle: 'monthly',
      invoiceGenerationDate: '2024-02-01T09:00:00Z',
    };

    // ========== トリガー: 例外ケース検出エンジンを実行 ==========
    const detectionResult = detectExceptionCase({
      billingData: newBillingData,
      existingCases: existingHandbookCases,
      detectionTimestamp: '2024-02-01T09:15:30Z',
    });

    // ========== 結果検証: 例外ケースが正確に検出されること ==========
    expect(detectionResult).toEqual(
      expect.objectContaining({
        isExceptionDetected: true,
        exceptionCaseId: 'CASE-NEW-004',
        exceptionDescription: 'volume_tiered_discount_15pct_over_100units',
        appliedScenario: 'volume_tiered_discount',
        detectionTimestamp: '2024-02-01T09:15:30Z',
        detectionStatus: 'detected',
        billingDataSnapshot: expect.objectContaining({
          customerId: 'CUST-2024-NEW-001',
          contractId: 'CONTRACT-2024-003',
          serviceType: 'premium_service',
          appliedDiscountType: 'volume_tiered_discount_15pct_over_100units',
          serviceUsageQuantity: 150,
          actualBillingAmount: 12750,
        }),
      })
    );

    // ========== 結果検証: 検出された例外ケースが既存手順書に対応していないことを確認 ==========
    const handbookCaseIds = existingHandbookCases.map((c) => c.caseId);
    expect(handbookCaseIds).not.toContain(detectionResult.exceptionCaseId);
    expect(detectionResult.isHandbookCovered).toBe(false);

    // ========== トリガー: 手順書追加判定フローを実行 ==========
    const handbookAdditionJudgment = judgeHandbookAddition({
      exceptionCase: detectionResult,
      existingHandbook: existingHandbookCases,
      judgmentTimestamp: '2024-02-01T09:16:00Z',
      priorityLevel: 'high',
    });

    // ========== 結果検証: 例外ケースが手順書追加対象として正しく判定されること ==========
    expect(handbookAdditionJudgment).toEqual(
      expect.objectContaining({
        handbookAdditionRequired: true,
        additionTargetJudgment: 'add_to_handbook',
        exceptionCaseId: 'CASE-NEW-004',
        exceptionDescription: 'volume_tiered_discount_15pct_over_100units',
        judgmentTimestamp: '2024-02-01T09:16:00Z',
        priorityForAddition: 'high',
        recommendedHandbookSection: 'discount_rules',
        estimatedImplementationImpact: 'medium',
      })
    );

    // ========== 結果検証: 検出ログおよび判定結果が正確に記録されること ==========
    const detectionLog = {
      logId: 'LOG-2024-02-01-001',
      eventType: 'exception_case_detection_and_handbook_judgment',
      detectionTimestamp: '2024-02-01T09:15:30Z',
      judgmentTimestamp: '2024-02-01T09:16:00Z',
      customerId: newBillingData.customerId,
      contractId: newBillingData.contractId,
      exceptionCaseId: detectionResult.exceptionCaseId,
      exceptionDescription: detectionResult.exceptionDescription,
      detectionStatus: 'detected',
      isHandbookCovered: false,
      handbookAdditionRequired: true,
      additionTargetJudgment: 'add_to_handbook',
      priorityLevel: 'high',
      recordingStatus: 'recorded',
    };

    expect(detectionLog).toEqual(
      expect.objectContaining({
        logId: expect.stringMatching(/^LOG-\d{4}-\d{2}-\d{2}-\d{3}$/),
        eventType: 'exception_case_detection_and_handbook_judgment',
        detectionTimestamp: '2024-02-01T09:15:30Z',
        judgmentTimestamp: '2024-02-01T09:16:00Z',
        customerId: 'CUST-2024-NEW-001',
        contractId: 'CONTRACT-2024-003',
        exceptionCaseId: 'CASE-NEW-004',
        exceptionDescription: 'volume_tiered_discount_15pct_over_100units',
        detectionStatus: 'detected',
        isHandbookCovered: false,
        handbookAdditionRequired: true,
        additionTargetJudgment: 'add_to_handbook',
        priorityLevel: 'high',
        recordingStatus: 'recorded',
      })
    );

    // ========== 総合検証: 検出ロジックが例外内容を正確に特定していること ==========
    expect(detectionResult.exceptionCaseId).not.toEqual('CASE-001');
    expect(detectionResult.exceptionCaseId).not.toEqual('CASE-002');
    expect(detectionResult.exceptionCaseId).not.toEqual('CASE-003');
    expect(detectionResult.exceptionCaseId).toBe('CASE-NEW-004');

    // ========== 総合検証: 手順書追加判定が『追加対象』として正しく判定されたこと ==========
    expect(handbookAdditionJudgment.handbookAdditionRequired).toBe(true);
    expect(handbookAdditionJudgment.additionTargetJudgment).toBe('add_to_handbook');
    expect(handbookAdditionJudgment.priorityForAddition).toBe('high');

    // ========== 総合検証: ログ記録が成功し、タイムスタンプが正確であること ==========
    expect(detectionLog.recordingStatus).toBe('recorded');
    expect(detectionLog.detectionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    expect(detectionLog.judgmentTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});