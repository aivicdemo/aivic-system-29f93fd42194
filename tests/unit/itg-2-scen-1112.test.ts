import { describe, test, expect } from '@jest/globals';
import { detectAbnormalValuesAndGenerateMeasures } from '../../src/logic/it-6-2-2-2';

describe('異常値検出・自動診断機能 - 乖離率が±50%超の案件を検出し対応策を自動生成できる', () => {
  test('SCEN-1112: 乖離率が+55%と-52%の案件を検出し、各案件に対して適切な対応策を自動生成する', () => {
    // テストデータ準備: 乖離率が+55%の案件
    const abnormalCase1 = {
      assessment_item_id: 'ITEM_001',
      quotation_amount: 1000000,
      market_reference_amount: 645161,
      deviation_rate: 55,
      assessment_date: '2024-01-15',
      assessed_by: 'USER_001'
    };

    // テストデータ準備: 乖離率が-52%の案件
    const abnormalCase2 = {
      assessment_item_id: 'ITEM_002',
      quotation_amount: 500000,
      market_reference_amount: 1041667,
      deviation_rate: -52,
      assessment_date: '2024-01-15',
      assessed_by: 'USER_002'
    };

    // 異常値検出・自動診断機能を実行
    const result1 = detectAbnormalValuesAndGenerateMeasures(abnormalCase1);
    const result2 = detectAbnormalValuesAndGenerateMeasures(abnormalCase2);

    // 乖離率が+55%の案件に対する検証
    expect(result1).toEqual({
      is_abnormal: true,
      deviation_rate_detected: 55,
      exceeds_threshold: true,
      threshold: 50,
      recommended_measures: [
        {
          measure_type: '再査定推奨',
          priority: 'HIGH',
          description: '乖離率が基準値を超過しているため、査定内容の再確認と再査定を推奨します。'
        },
        {
          measure_type: '確認項目の提示',
          priority: 'HIGH',
          description: '見積書の単価・数量・工事種別の記載が正確か確認してください。'
        },
        {
          measure_type: '査定者への通知',
          priority: 'HIGH',
          description: '査定者に異常値を通知し、必要に応じて修正指示を発行します。'
        }
      ],
      system_record_status: 'RECORDED',
      record_timestamp: '2024-01-15T11:00:00Z',
      record_id: 'REC_001'
    });

    // 乖離率が-52%の案件に対する検証
    expect(result2).toEqual({
      is_abnormal: true,
      deviation_rate_detected: -52,
      exceeds_threshold: true,
      threshold: 50,
      recommended_measures: [
        {
          measure_type: '再査定推奨',
          priority: 'HIGH',
          description: '乖離率が基準値を超過しているため、査定内容の再確認と再査定を推奨します。'
        },
        {
          measure_type: '確認項目の提示',
          priority: 'HIGH',
          description: '見積書の単価・数量・工事種別の記載が正確か確認してください。'
        },
        {
          measure_type: '査定者への通知',
          priority: 'HIGH',
          description: '査定者に異常値を通知し、必要に応じて修正指示を発行します。'
        }
      ],
      system_record_status: 'RECORDED',
      record_timestamp: '2024-01-15T11:00:00Z',
      record_id: 'REC_002'
    });

    // 異常値検出の確認
    expect(result1.is_abnormal).toBe(true);
    expect(result1.exceeds_threshold).toBe(true);
    expect(result2.is_abnormal).toBe(true);
    expect(result2.exceeds_threshold).toBe(true);

    // 対応策生成の確認
    expect(result1.recommended_measures).toHaveLength(3);
    expect(result2.recommended_measures).toHaveLength(3);

    // 対応策内容の検証
    expect(result1.recommended_measures[0].measure_type).toBe('再査定推奨');
    expect(result1.recommended_measures[0].priority).toBe('HIGH');
    expect(result1.recommended_measures[1].measure_type).toBe('確認項目の提示');
    expect(result1.recommended_measures[2].measure_type).toBe('査定者への通知');

    // システム記録状態の確認
    expect(result1.system_record_status).toBe('RECORDED');
    expect(result2.system_record_status).toBe('RECORDED');
    expect(result1.record_id).toBeDefined();
    expect(result2.record_id).toBeDefined();
    expect(result1.record_timestamp).toBe('2024-01-15T11:00:00Z');
    expect(result2.record_timestamp).toBe('2024-01-15T11:00:00Z');
  });

  test('SCEN-1112: 乖離率が許容範囲内（±50%以内）の案件は異常値として検出されない', () => {
    const normalCase = {
      assessment_item_id: 'ITEM_003',
      quotation_amount: 1000000,
      market_reference_amount: 666667,
      deviation_rate: 50,
      assessment_date: '2024-01-15',
      assessed_by: 'USER_003'
    };

    const result = detectAbnormalValuesAndGenerateMeasures(normalCase);

    expect(result.is_abnormal).toBe(false);
    expect(result.exceeds_threshold).toBe(false);
    expect(result.recommended_measures).toHaveLength(0);
  });

  test('SCEN-1112: 必須項目が不足している場合はエラーを発生させる', () => {
    const incompleteCase = {
      assessment_item_id: 'ITEM_004',
      quotation_amount: 1000000,
      deviation_rate: 55
    };

    expect(() => detectAbnormalValuesAndGenerateMeasures(incompleteCase as any)).toThrow(/市場参照金額/);
  });

  test('SCEN-1112: 乖離率が数値でない場合はエラーを発生させる', () => {
    const invalidCase = {
      assessment_item_id: 'ITEM_005',
      quotation_amount: 1000000,
      market_reference_amount: 645161,
      deviation_rate: 'invalid',
      assessment_date: '2024-01-15',
      assessed_by: 'USER_005'
    };

    expect(() => detectAbnormalValuesAndGenerateMeasures(invalidCase as any)).toThrow(/乖離率/);
  });
});