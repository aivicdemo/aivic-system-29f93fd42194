import { describe, test, expect } from '@jest/globals';
import { calculateBillingAmountFromMetadata } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目のメタデータ管理機能', () => {
  test('SCEN-704: メタデータで定義された計算ロジックに基づいて請求額が正しく計算される', () => {
    // テストケース 1: 基本的な請求額計算（売上額 + 割引適用）
    const input_1 = {
      salesAmount: 100000,
      discountRate: 0.1,
      taxRate: 0.1,
      metadata: {
        salesAmountField: 'salesAmount',
        discountRateField: 'discountRate',
        taxRateField: 'taxRate',
        formula: 'roundDown((salesAmount * (1 - discountRate)) * (1 + taxRate), 0)',
        calculationSteps: [
          { step: 1, description: '割引前売上額', formula: 'salesAmount', expected: 100000 },
          { step: 2, description: '割引額計算', formula: 'salesAmount * discountRate', expected: 10000 },
          { step: 3, description: '割引後売上額', formula: 'salesAmount * (1 - discountRate)', expected: 90000 },
          { step: 4, description: '税金計算', formula: '(salesAmount * (1 - discountRate)) * taxRate', expected: 9000 },
          { step: 5, description: '最終請求額', formula: 'roundDown((salesAmount * (1 - discountRate)) * (1 + taxRate), 0)', expected: 99000 }
        ]
      }
    };

    const result_1 = calculateBillingAmountFromMetadata(input_1);

    expect(result_1).toEqual({
      finalBillingAmount: 99000,
      intermediateCalculations: [
        { step: 1, description: '割引前売上額', value: 100000 },
        { step: 2, description: '割引額計算', value: 10000 },
        { step: 3, description: '割引後売上額', value: 90000 },
        { step: 4, description: '税金計算', value: 9000 },
        { step: 5, description: '最終請求額', value: 99000 }
      ],
      appliedMetadataRules: {
        salesAmountField: 'salesAmount',
        discountRateField: 'discountRate',
        taxRateField: 'taxRate',
        formula: 'roundDown((salesAmount * (1 - discountRate)) * (1 + taxRate), 0)'
      },
      isCalculationTraceableAndAccurate: true
    });

    expect(result_1.finalBillingAmount).toBe(99000);
    expect(result_1.intermediateCalculations[0].value).toBe(100000);
    expect(result_1.intermediateCalculations[2].value).toBe(90000);
    expect(result_1.intermediateCalculations[4].value).toBe(99000);

    // テストケース 2: 複数割引適用（割引率が複数）
    const input_2 = {
      salesAmount: 500000,
      discountRate1: 0.05,
      discountRate2: 0.03,
      taxRate: 0.08,
      metadata: {
        salesAmountField: 'salesAmount',
        discountFields: ['discountRate1', 'discountRate2'],
        taxRateField: 'taxRate',
        formula: 'roundDown((salesAmount * (1 - discountRate1) * (1 - discountRate2)) * (1 + taxRate), 0)',
        calculationSteps: [
          { step: 1, description: '割引前売上額', formula: 'salesAmount', expected: 500000 },
          { step: 2, description: '第1割引適用後', formula: 'salesAmount * (1 - discountRate1)', expected: 475000 },
          { step: 3, description: '第2割引適用後', formula: 'salesAmount * (1 - discountRate1) * (1 - discountRate2)', expected: 460250 },
          { step: 4, description: '税金計算', formula: '(salesAmount * (1 - discountRate1) * (1 - discountRate2)) * taxRate', expected: 36820 },
          { step: 5, description: '最終請求額', formula: 'roundDown((salesAmount * (1 - discountRate1) * (1 - discountRate2)) * (1 + taxRate), 0)', expected: 497070 }
        ]
      }
    };

    const result_2 = calculateBillingAmountFromMetadata(input_2);

    expect(result_2).toEqual({
      finalBillingAmount: 497070,
      intermediateCalculations: [
        { step: 1, description: '割引前売上額', value: 500000 },
        { step: 2, description: '第1割引適用後', value: 475000 },
        { step: 3, description: '第2割引適用後', value: 460250 },
        { step: 4, description: '税金計算', value: 36820 },
        { step: 5, description: '最終請求額', value: 497070 }
      ],
      appliedMetadataRules: {
        salesAmountField: 'salesAmount',
        discountFields: ['discountRate1', 'discountRate2'],
        taxRateField: 'taxRate',
        formula: 'roundDown((salesAmount * (1 - discountRate1) * (1 - discountRate2)) * (1 + taxRate), 0)'
      },
      isCalculationTraceableAndAccurate: true
    });

    expect(result_2.finalBillingAmount).toBe(497070);
    expect(result_2.intermediateCalculations[1].value).toBe(475000);
    expect(result_2.intermediateCalculations[2].value).toBe(460250);
    expect(result_2.intermediateCalculations[4].value).toBe(497070);

    // テストケース 3: 複数税率適用（異なるサービスカテゴリ）
    const input_3 = {
      baseAmount: 300000,
      serviceAAmount: 150000,
      serviceBAmount: 150000,
      taxRateA: 0.08,
      taxRateB: 0.1,
      commonDiscount: 0.05,
      metadata: {
        baseAmountField: 'baseAmount',
        serviceAmountFields: ['serviceAAmount', 'serviceBAmount'],
        taxRateFields: { serviceA: 'taxRateA', serviceB: 'taxRateB' },
        discountField: 'commonDiscount',
        formula: 'roundDown((serviceAAmount * (1 - commonDiscount) * (1 + taxRateA)) + (serviceBAmount * (1 - commonDiscount) * (1 + taxRateB)), 0)',
        calculationSteps: [
          { step: 1, description: 'サービスA売上', formula: 'serviceAAmount', expected: 150000 },
          { step: 2, description: 'サービスB売上', formula: 'serviceBAmount', expected: 150000 },
          { step: 3, description: 'サービスA割引後', formula: 'serviceAAmount * (1 - commonDiscount)', expected: 142500 },
          { step: 4, description: 'サービスB割引後', formula: 'serviceBAmount * (1 - commonDiscount)', expected: 142500 },
          { step: 5, description: 'サービスA税金', formula: '(serviceAAmount * (1 - commonDiscount)) * taxRateA', expected: 11400 },
          { step: 6, description: 'サービスB税金', formula: '(serviceBAmount * (1 - commonDiscount)) * taxRateB', expected: 14250 },
          { step: 7, description: '最終請求額', formula: 'roundDown((serviceAAmount * (1 - commonDiscount) * (1 + taxRateA)) + (serviceBAmount * (1 - commonDiscount) * (1 + taxRateB)), 0)', expected: 310650 }
        ]
      }
    };

    const result_3 = calculateBillingAmountFromMetadata(input_3);

    expect(result_3).toEqual({
      finalBillingAmount: 310650,
      intermediateCalculations: [
        { step: 1, description: 'サービスA売上', value: 150000 },
        { step: 2, description: 'サービスB売上', value: 150000 },
        { step: 3, description: 'サービスA割引後', value: 142500 },
        { step: 4, description: 'サービスB割引後', value: 142500 },
        { step: 5, description: 'サービスA税金', value: 11400 },
        { step: 6, description: 'サービスB税金', value: 14250 },
        { step: 7, description: '最終請求額', value: 310650 }
      ],
      appliedMetadataRules: {
        baseAmountField: 'baseAmount',
        serviceAmountFields: ['serviceAAmount', 'serviceBAmount'],
        taxRateFields: { serviceA: 'taxRateA', serviceB: 'taxRateB' },
        discountField: 'commonDiscount',
        formula: 'roundDown((serviceAAmount * (1 - commonDiscount) * (1 + taxRateA)) + (serviceBAmount * (1 - commonDiscount) * (1 + taxRateB)), 0)'
      },
      isCalculationTraceableAndAccurate: true
    });

    expect(result_3.finalBillingAmount).toBe(310650);
    expect(result_3.intermediateCalculations[0].value).toBe(150000);
    expect(result_3.intermediateCalculations[1].value).toBe(150000);
    expect(result_3.intermediateCalculations[6].value).toBe(310650);

    // エラーテスト: メタデータの計算ロジックが定義されていない場合
    const input_error_1 = {
      salesAmount: 100000,
      discountRate: 0.1,
      taxRate: 0.1,
      metadata: {
        salesAmountField: 'salesAmount',
        discountRateField: 'discountRate',
        taxRateField: 'taxRate',
        formula: undefined,
        calculationSteps: []
      }
    };

    expect(() => calculateBillingAmountFromMetadata(input_error_1)).toThrow(/計算ロジック/);

    // エラーテスト: 必須フィールドが入力データに不足している場合
    const input_error_2 = {
      salesAmount: 100000,
      // discountRate が欠落
      taxRate: 0.1,
      metadata: {
        salesAmountField: 'salesAmount',
        discountRateField: 'discountRate',
        taxRateField: 'taxRate',
        formula: 'roundDown((salesAmount * (1 - discountRate)) * (1 + taxRate), 0)',
        calculationSteps: []
      }
    };

    expect(() => calculateBillingAmountFromMetadata(input_error_2)).toThrow(/フィールド/);

    // エラーテスト: メタデータのフィールド定義が入力データと一致しない場合
    const input_error_3 = {
      sales_amount: 100000,
      discount_rate: 0.1,
      tax_rate: 0.1,
      metadata: {
        salesAmountField: 'salesAmount',
        discountRateField: 'discountRate',
        taxRateField: 'taxRate',
        formula: 'roundDown((salesAmount * (1 - discountRate)) * (1 + taxRate), 0)',
        calculationSteps: []
      }
    };

    expect(() => calculateBillingAmountFromMetadata(input_error_3)).toThrow(/マッピング/);

    // 検証: 計算結果が請求書に正しく反映されるための確認
    expect(result_1.isCalculationTraceableAndAccurate).toBe(true);
    expect(result_2.isCalculationTraceableAndAccurate).toBe(true);
    expect(result_3.isCalculationTraceableAndAccurate).toBe(true);

    // 検証: 中間計算値の数が計算ステップ数と一致
    expect(result_1.intermediateCalculations.length).toBe(5);
    expect(result_2.intermediateCalculations.length).toBe(5);
    expect(result_3.intermediateCalculations.length).toBe(7);

    // 検証: 適用されたメタデータルールが記録されている
    expect(result_1.appliedMetadataRules).toBeDefined();
    expect(result_2.appliedMetadataRules).toBeDefined();
    expect(result_3.appliedMetadataRules).toBeDefined();

    expect(result_1.appliedMetadataRules.formula).toBe('roundDown((salesAmount * (1 - discountRate)) * (1 + taxRate), 0)');
    expect(result_2.appliedMetadataRules.formula).toBe('roundDown((salesAmount * (1 - discountRate1) * (1 - discountRate2)) * (1 + taxRate), 0)');
    expect(result_3.appliedMetadataRules.formula).toBe('roundDown((serviceAAmount * (1 - commonDiscount) * (1 + taxRateA)) + (serviceBAmount * (1 - commonDiscount) * (1 + taxRateB)), 0)');
  });
});