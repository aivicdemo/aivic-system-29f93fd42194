import { validateSalesReportCalculation } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業報告書集計検証 - 計算式妥当性チェック', () => {
  // SCEN-1100
  test('不正な計算式が適用された営業報告書を検証すると、エラーが検出・通知される', () => {
    const invalidReportData = {
      reportId: 'RPT-2024-01-001',
      period: '2024-01',
      customerId: 'CUST-A001',
      serviceId: 'SVC-001',
      items: [
        {
          itemId: 'ITEM-001',
          itemName: 'アポイント数',
          plannedValue: 100,
          actualValue: 95,
          formula: 'SUM(A2:A10)',
          isExcludedFromFormula: false,
          formulaReferenceCells: ['A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10']
        },
        {
          itemId: 'ITEM-002',
          itemName: '成約数',
          plannedValue: 50,
          actualValue: 48,
          formula: 'SUM(B2:B10,C15)',
          isExcludedFromFormula: false,
          formulaReferenceCells: ['B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9', 'B10', 'C15']
        },
        {
          itemId: 'ITEM-003',
          itemName: '成約率',
          plannedValue: 0.48,
          actualValue: 0.505,
          formula: 'ITEM-002 / ITEM-001',
          isExcludedFromFormula: false,
          formulaReferenceCells: ['ITEM-002', 'ITEM-001']
        }
      ],
      excludedItems: ['ITEM-EXCLUDED-001'],
      calculationErrors: []
    };

    const result = validateSalesReportCalculation(invalidReportData);

    expect(result).toEqual(
      expect.objectContaining({
        isValid: false,
        hasErrors: true,
        errorCount: expect.any(Number),
        errorDetails: expect.arrayContaining([
          expect.objectContaining({
            errorCode: expect.stringMatching(/CALC_FORMULA/),
            errorMessage: expect.stringMatching(/計算式|参照|不正/),
            itemId: expect.any(String),
            itemName: expect.any(String),
            detectedFormula: expect.any(String),
            severity: expect.stringMatching(/error|critical/),
            suggestedFix: expect.any(String),
            timestamp: expect.any(String)
          })
        ]),
        adminNotificationRequired: true,
        adminEmailAddresses: expect.arrayContaining([
          expect.stringMatching(/@/)
        ]),
        shouldBlockAutomaticBilling: true,
        recordedInSystemLog: true,
        systemLogId: expect.stringMatching(/LOG-/)
      })
    );

    expect(result.errorCount).toBeGreaterThan(0);
    expect(result.shouldBlockAutomaticBilling).toBe(true);
    expect(result.adminNotificationRequired).toBe(true);

    const calculationErrors = result.errorDetails.filter(
      (err: { errorCode: string }) => err.errorCode.includes('CALC_FORMULA')
    );
    expect(calculationErrors.length).toBeGreaterThan(0);

    const invalidFormulaError = result.errorDetails.find(
      (err: { itemId: string; detectedFormula: string }) =>
        err.itemId === 'ITEM-002' &&
        err.detectedFormula.includes('C15')
    );
    expect(invalidFormulaError).toBeDefined();
    if (invalidFormulaError) {
      expect(invalidFormulaError.suggestedFix).toMatch(/参照セル|修正/);
    }

    expect(result.recordedInSystemLog).toBe(true);
    expect(result.systemLogId).toMatch(/^LOG-/);
  });
});