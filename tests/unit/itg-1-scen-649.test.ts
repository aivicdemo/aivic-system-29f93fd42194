import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { detectAnomaliesAndGenerateCorrectionInstructions } from '../../src/logic/it-1781935279444-2-1-1';

describe('営業データ異常値検出・補正指示生成機能 - 検証ルール不正時エラー処理', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-649
  test('不正な検証ルール設定により異常値検出・補正指示生成がエラーで中断される', () => {
    // 前提: 不正な検証ルール設定が入力される
    // - 必須項目が未入力（項目名が空文字列）
    const invalidRuleWithMissingFieldName = {
      rule_id: 'rule_001',
      field_name: '', // 不正: 必須項目未入力
      rule_type: 'REQUIRED',
      condition: null,
      created_at: new Date('2024-01-15T09:00:00Z'),
      updated_at: new Date('2024-01-15T09:00:00Z'),
    };

    // データ型が無効（無効な rule_type）
    const invalidRuleWithBadDataType = {
      rule_id: 'rule_002',
      field_name: 'sales_amount',
      rule_type: 'INVALID_TYPE', // 不正: 無効なデータ型
      condition: null,
      created_at: new Date('2024-01-15T09:00:00Z'),
      updated_at: new Date('2024-01-15T09:00:00Z'),
    };

    // 条件式が構文エラー（condition が無効な構造）
    const invalidRuleWithSyntaxError = {
      rule_id: 'rule_003',
      field_name: 'appointment_date',
      rule_type: 'RANGE',
      condition: 'invalid_syntax {{{', // 不正: 構文エラー
      created_at: new Date('2024-01-15T09:00:00Z'),
      updated_at: new Date('2024-01-15T09:00:00Z'),
    };

    const salesData = {
      sales_id: 'sales_001',
      customer_id: 'cust_001',
      appointment_count: 5,
      sales_amount: -1000, // 異常値
      appointment_date: '2024-01-14',
      status: 'COMPLETED',
      recorded_at: new Date('2024-01-15T08:30:00Z'),
    };

    // 発生条件: 不正な検証ルール設定で異常値検出・補正指示生成機能を実行する
    // → 期待結果: 各不正パターンでエラーが発生し処理が中断される

    // テスト1: 必須項目未入力エラー
    expect(() =>
      detectAnomaliesAndGenerateCorrectionInstructions(
        [invalidRuleWithMissingFieldName],
        [salesData]
      )
    ).toThrow(/必須項目/);

    // テスト2: データ型不正エラー
    expect(() =>
      detectAnomaliesAndGenerateCorrectionInstructions(
        [invalidRuleWithBadDataType],
        [salesData]
      )
    ).toThrow(/データ型/);

    // テスト3: 条件式構文エラー
    expect(() =>
      detectAnomaliesAndGenerateCorrectionInstructions(
        [invalidRuleWithSyntaxError],
        [salesData]
      )
    ).toThrow(/構文エラー/);

    // テスト4: 複数の不正ルールが存在する場合、最初のエラーで中断
    const multipleInvalidRules = [
      invalidRuleWithMissingFieldName,
      invalidRuleWithBadDataType,
      invalidRuleWithSyntaxError,
    ];

    expect(() =>
      detectAnomaliesAndGenerateCorrectionInstructions(
        multipleInvalidRules,
        [salesData]
      )
    ).toThrow(/必須項目/); // 最初の不正ルールで中断

    // テスト5: 空の検証ルール配列でもエラー（最小限の検証が必要）
    expect(() =>
      detectAnomaliesAndGenerateCorrectionInstructions([], [salesData])
    ).toThrow(/検証ルール/);

    // テスト6: 営業データが空の配列の場合でも不正ルールがあればエラー
    expect(() =>
      detectAnomaliesAndGenerateCorrectionInstructions(
        [invalidRuleWithMissingFieldName],
        []
      )
    ).toThrow(/必須項目/);
  });
});