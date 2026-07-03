import { describe, test, expect } from '@jest/globals';
import { validateCalculationResultAgainstStandard } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  test('SCEN-959: 計算結果が手順書の基準をすべて満たす場合、承認可能と判定できる', () => {
    // テストデータ: 営業データの計算結果サンプル
    const calculationResult = {
      customerId: 'CUST-001',
      serviceId: 'SVC-A',
      periodStart: '2024-01-01',
      periodEnd: '2024-01-31',
      appointmentCount: 5,
      contractCount: 2,
      baseAmount: 50000,
      performanceBonus: 10000,
      discountRate: 0.1,
      discountAmount: 6000,
      finalAmount: 54000,
      calculationTimestamp: '2024-02-01T09:00:00Z',
      calculatedBy: 'OPERATOR-001'
    };

    // 手順書に定義された品質基準
    const standardCriteria = {
      precisionDecimalPlaces: 0, // 金額は整数
      formatRequirements: {
        customerId: { pattern: /^CUST-\d+$/, required: true },
        serviceId: { pattern: /^SVC-[A-Z]$/, required: true },
        periodStart: { pattern: /^\d{4}-\d{2}-\d{2}$/, required: true },
        periodEnd: { pattern: /^\d{4}-\d{2}-\d{2}$/, required: true }
      },
      logicValidation: {
        finalAmountFormula: (base, bonus, discount) => base + bonus - discount,
        discountAmountFormula: (baseAmount, discountRate) => baseAmount * discountRate,
        appointmentCountRange: { min: 0, max: 100 },
        contractCountRange: { min: 0, max: 50 },
        discountRateRange: { min: 0, max: 1 }
      },
      mandatoryFields: [
        'customerId',
        'serviceId',
        'periodStart',
        'periodEnd',
        'appointmentCount',
        'contractCount',
        'baseAmount',
        'performanceBonus',
        'discountRate',
        'discountAmount',
        'finalAmount',
        'calculationTimestamp',
        'calculatedBy'
      ]
    };

    // 計算結果が手順書の全ての基準項目に対して適合しているかを検証する
    const validationResults = {
      mandatoryFieldsCheck: standardCriteria.mandatoryFields.every(
        field => field in calculationResult && calculationResult[field] !== undefined && calculationResult[field] !== null
      ),
      customIdFormatCheck: /^CUST-\d+$/.test(calculationResult.customerId),
      serviceIdFormatCheck: /^SVC-[A-Z]$/.test(calculationResult.serviceId),
      periodStartFormatCheck: /^\d{4}-\d{2}-\d{2}$/.test(calculationResult.periodStart),
      periodEndFormatCheck: /^\d{4}-\d{2}-\d{2}$/.test(calculationResult.periodEnd),
      appointmentCountRangeCheck:
        calculationResult.appointmentCount >= 0 && calculationResult.appointmentCount <= 100,
      contractCountRangeCheck:
        calculationResult.contractCount >= 0 && calculationResult.contractCount <= 50,
      discountRateRangeCheck:
        calculationResult.discountRate >= 0 && calculationResult.discountRate <= 1,
      discountAmountLogicCheck:
        calculationResult.discountAmount ===
        standardCriteria.logicValidation.discountAmountFormula(
          calculationResult.baseAmount,
          calculationResult.discountRate
        ),
      finalAmountLogicCheck:
        calculationResult.finalAmount ===
        standardCriteria.logicValidation.finalAmountFormula(
          calculationResult.baseAmount,
          calculationResult.performanceBonus,
          calculationResult.discountAmount
        ),
      finalAmountPrecisionCheck: Number.isInteger(calculationResult.finalAmount)
    };

    // 各基準項目ごとの検証結果をアサーション
    expect(validationResults.mandatoryFieldsCheck).toBe(true);
    expect(validationResults.customIdFormatCheck).toBe(true);
    expect(validationResults.serviceIdFormatCheck).toBe(true);
    expect(validationResults.periodStartFormatCheck).toBe(true);
    expect(validationResults.periodEndFormatCheck).toBe(true);
    expect(validationResults.appointmentCountRangeCheck).toBe(true);
    expect(validationResults.contractCountRangeCheck).toBe(true);
    expect(validationResults.discountRateRangeCheck).toBe(true);
    expect(validationResults.discountAmountLogicCheck).toBe(true);
    expect(validationResults.finalAmountLogicCheck).toBe(true);
    expect(validationResults.finalAmountPrecisionCheck).toBe(true);

    // 全ての基準項目が満たされたことを統合判定
    const allCriteriaMet = Object.values(validationResults).every(result => result === true);
    expect(allCriteriaMet).toBe(true);

    // validateCalculationResultAgainstStandard 関数を呼び出し
    const approvalResult = validateCalculationResultAgainstStandard(calculationResult, standardCriteria);

    // 承認可能フラグがtrueに設定されることを確認
    expect(approvalResult.isApprovalPossible).toBe(true);
    expect(approvalResult.approvalStatus).toBe('APPROVABLE');

    // 承認可能と判定された計算結果の詳細情報が正常に記録されることを確認
    expect(approvalResult.validationDetails).toEqual({
      customerId: 'CUST-001',
      serviceId: 'SVC-A',
      periodStart: '2024-01-01',
      periodEnd: '2024-01-31',
      appointmentCount: 5,
      contractCount: 2,
      baseAmount: 50000,
      performanceBonus: 10000,
      discountRate: 0.1,
      discountAmount: 6000,
      finalAmount: 54000,
      calculationTimestamp: '2024-02-01T09:00:00Z',
      calculatedBy: 'OPERATOR-001'
    });

    expect(approvalResult.criteriaMetSummary).toEqual({
      totalCriteria: 11,
      criteriaMet: 11,
      compliancePercentage: 100
    });

    expect(approvalResult.recordedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    expect(typeof approvalResult.recordedAt).toBe('string');
  });
});