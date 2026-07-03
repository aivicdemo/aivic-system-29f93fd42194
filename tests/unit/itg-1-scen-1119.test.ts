import { applyMultipleFormatConversionRules } from '../../src/logic/it-1-br-1781935279444-1-2-1';

describe('月次サマリーテンプレートの定義・管理機能', () => {
  test('SCEN-1119: 標準フォーマット変換ルール検証 - 複数の変換ルールが適用される場合に全て正しく実行される', () => {
    // テストデータセット: 複数の変換ルール（日付形式変換、通貨形式変換、文字エンコーディング変換）を含む
    const test_data_set = {
      date_field: '2024-01-15',
      currency_field: '10000',
      encoding_field: 'テスト_DATA_001',
    };

    // 複数の変換ルール定義（優先順位付き）
    const conversion_rules_priority_order_1 = [
      {
        rule_id: 'rule_001',
        rule_type: 'date_format',
        source_format: 'YYYY-MM-DD',
        target_format: 'YYYY/MM/DD',
        priority: 1,
      },
      {
        rule_id: 'rule_002',
        rule_type: 'currency_format',
        source_currency_symbol: '',
        target_currency_symbol: '¥',
        priority: 2,
      },
      {
        rule_id: 'rule_003',
        rule_type: 'encoding_normalization',
        source_encoding: 'UTF-8',
        target_encoding: 'ASCII_UPPERCASE',
        priority: 3,
      },
    ];

    // ルール適用順序1での変換実行
    const result_order_1 = applyMultipleFormatConversionRules(
      test_data_set,
      conversion_rules_priority_order_1
    );

    // 期待値（優先順位順に適用）
    // rule_001: 日付形式 2024-01-15 → 2024/01/15
    // rule_002: 通貨形式 10000 → ¥10000
    // rule_003: エンコーディング テスト_DATA_001 → TEST_DATA_001
    const expected_result_order_1 = {
      date_field: '2024/01/15',
      currency_field: '¥10000',
      encoding_field: 'TEST_DATA_001',
      conversion_log: [
        {
          rule_id: 'rule_001',
          rule_type: 'date_format',
          source_value: '2024-01-15',
          converted_value: '2024/01/15',
          execution_timestamp: expect.any(String),
          execution_status: 'SUCCESS',
        },
        {
          rule_id: 'rule_002',
          rule_type: 'currency_format',
          source_value: '10000',
          converted_value: '¥10000',
          execution_timestamp: expect.any(String),
          execution_status: 'SUCCESS',
        },
        {
          rule_id: 'rule_003',
          rule_type: 'encoding_normalization',
          source_value: 'テスト_DATA_001',
          converted_value: 'TEST_DATA_001',
          execution_timestamp: expect.any(String),
          execution_status: 'SUCCESS',
        },
      ],
    };

    // 優先順位順に全ルール適用されたか検証
    expect(result_order_1.date_field).toBe('2024/01/15');
    expect(result_order_1.currency_field).toBe('¥10000');
    expect(result_order_1.encoding_field).toBe('TEST_DATA_001');
    expect(result_order_1.conversion_log).toHaveLength(3);
    expect(result_order_1.conversion_log[0].rule_id).toBe('rule_001');
    expect(result_order_1.conversion_log[0].execution_status).toBe('SUCCESS');
    expect(result_order_1.conversion_log[1].rule_id).toBe('rule_002');
    expect(result_order_1.conversion_log[1].execution_status).toBe('SUCCESS');
    expect(result_order_1.conversion_log[2].rule_id).toBe('rule_003');
    expect(result_order_1.conversion_log[2].execution_status).toBe('SUCCESS');

    // ルール適用順序を変更（優先順位を逆順に）
    const conversion_rules_priority_order_2 = [
      {
        rule_id: 'rule_003',
        rule_type: 'encoding_normalization',
        source_encoding: 'UTF-8',
        target_encoding: 'ASCII_UPPERCASE',
        priority: 1,
      },
      {
        rule_id: 'rule_002',
        rule_type: 'currency_format',
        source_currency_symbol: '',
        target_currency_symbol: '¥',
        priority: 2,
      },
      {
        rule_id: 'rule_001',
        rule_type: 'date_format',
        source_format: 'YYYY-MM-DD',
        target_format: 'YYYY/MM/DD',
        priority: 3,
      },
    ];

    // 異なる優先順位での変換実行
    const result_order_2 = applyMultipleFormatConversionRules(
      test_data_set,
      conversion_rules_priority_order_2
    );

    // 異なる順序でも各ルールが正確に実行されたか検証
    // 順序は異なるが同じフィールド値に到達するはず
    expect(result_order_2.date_field).toBe('2024/01/15');
    expect(result_order_2.currency_field).toBe('¥10000');
    expect(result_order_2.encoding_field).toBe('TEST_DATA_001');
    expect(result_order_2.conversion_log).toHaveLength(3);
    // 優先順位3のルール（元は1）が最後に実行される
    expect(result_order_2.conversion_log[0].rule_id).toBe('rule_003');
    expect(result_order_2.conversion_log[1].rule_id).toBe('rule_002');
    expect(result_order_2.conversion_log[2].rule_id).toBe('rule_001');

    // データ整合性チェック: 両方の順序で同じ最終結果に到達しているか
    expect(result_order_1.date_field).toBe(result_order_2.date_field);
    expect(result_order_1.currency_field).toBe(result_order_2.currency_field);
    expect(result_order_1.encoding_field).toBe(result_order_2.encoding_field);

    // 変換ログの記録内容を検証
    expect(result_order_1.conversion_log[0]).toMatchObject({
      rule_id: 'rule_001',
      rule_type: 'date_format',
      source_value: '2024-01-15',
      converted_value: '2024/01/15',
      execution_status: 'SUCCESS',
    });
    expect(result_order_1.conversion_log[0].execution_timestamp).toBeDefined();
    expect(typeof result_order_1.conversion_log[0].execution_timestamp).toBe(
      'string'
    );

    expect(result_order_1.conversion_log[1]).toMatchObject({
      rule_id: 'rule_002',
      rule_type: 'currency_format',
      source_value: '10000',
      converted_value: '¥10000',
      execution_status: 'SUCCESS',
    });

    expect(result_order_1.conversion_log[2]).toMatchObject({
      rule_id: 'rule_003',
      rule_type: 'encoding_normalization',
      source_value: 'テスト_DATA_001',
      converted_value: 'TEST_DATA_001',
      execution_status: 'SUCCESS',
    });
  });
});