import { validateExtractionRuleDefinition } from '../../src/logic/it-1-br-1781935279444-1-2-1';

describe('月次サマリーテンプレートの定義・管理機能', () => {
  // SCEN-998
  test('営業データ抽出・集計ルール定義 - 請求対象外の項目が誤って含められた場合に検出される', () => {
    const extractionRule = {
      rule_id: 'rule_001',
      rule_name: '月次営業成果集計ルール',
      target_items: [
        {
          item_id: 'apo_count',
          item_name: 'アポ数',
          billable: true,
        },
        {
          item_id: 'internal_memo',
          item_name: '内部メモ',
          billable: false,
        },
        {
          item_id: 'draft_status',
          item_name: '下書き状態データ',
          billable: false,
        },
        {
          item_id: 'contract_count',
          item_name: '成約数',
          billable: true,
        },
      ],
      extraction_enabled: true,
      created_at: new Date('2024-01-15T09:00:00Z'),
      created_by: 'operator_001',
    };

    expect(() => validateExtractionRuleDefinition(extractionRule)).toThrow(/請求対象外の項目が含まれています/);
  });

  test('営業データ抽出・集計ルール定義 - すべての項目が請求対象の場合は検証成功', () => {
    const extractionRule = {
      rule_id: 'rule_002',
      rule_name: '月次営業成果集計ルール',
      target_items: [
        {
          item_id: 'apo_count',
          item_name: 'アポ数',
          billable: true,
        },
        {
          item_id: 'contract_count',
          item_name: '成約数',
          billable: true,
        },
        {
          item_id: 'customer_response',
          item_name: '顧客反応',
          billable: true,
        },
      ],
      extraction_enabled: true,
      created_at: new Date('2024-01-15T09:00:00Z'),
      created_by: 'operator_001',
    };

    const result = validateExtractionRuleDefinition(extractionRule);
    expect(result).toEqual({
      is_valid: true,
      error_message: null,
      non_billable_items: [],
    });
  });

  test('営業データ抽出・集計ルール定義 - 複数の請求対象外項目が検出される', () => {
    const extractionRule = {
      rule_id: 'rule_003',
      rule_name: '月次営業成果集計ルール',
      target_items: [
        {
          item_id: 'apo_count',
          item_name: 'アポ数',
          billable: true,
        },
        {
          item_id: 'internal_memo',
          item_name: '内部メモ',
          billable: false,
        },
        {
          item_id: 'temporary_note',
          item_name: '一時メモ',
          billable: false,
        },
        {
          item_id: 'draft_status',
          item_name: '下書き状態データ',
          billable: false,
        },
      ],
      extraction_enabled: true,
      created_at: new Date('2024-01-15T09:00:00Z'),
      created_by: 'operator_001',
    };

    const result = () => validateExtractionRuleDefinition(extractionRule);
    expect(result).toThrow(/請求対象外の項目が含まれています/);
  });

  test('営業データ抽出・集計ルール定義 - 対象項目が空の場合は検証スキップ', () => {
    const extractionRule = {
      rule_id: 'rule_004',
      rule_name: '月次営業成果集計ルール',
      target_items: [],
      extraction_enabled: true,
      created_at: new Date('2024-01-15T09:00:00Z'),
      created_by: 'operator_001',
    };

    const result = validateExtractionRuleDefinition(extractionRule);
    expect(result).toEqual({
      is_valid: true,
      error_message: null,
      non_billable_items: [],
    });
  });
});