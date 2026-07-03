import { extractBillingDifferences } from '../../src/logic/it-1-2-1';

describe('契約変更条件と請求パターンの差分可視化機能', () => {
  test('SCEN-636: 請求データが存在しない契約の差分抽出でも変更条件のみが正確に表示される', () => {
    // テストデータ: 請求データが存在しない契約レコード
    const contract_id = 'CTR-20240615-001';
    const customer_id = 'CUST-A001';
    const service_id = 'SVC-PREMIUM';

    // 契約変更条件: 複数件の変更条件を設定
    const contract_changes = [
      {
        change_id: 'CHG-001',
        contract_id: contract_id,
        change_type: '料金プラン変更',
        change_date: '2024-06-15',
        change_time: '2024-06-15T09:30:00Z',
        previous_value: '基本プラン月額5000円',
        new_value: 'プレミアムプラン月額8000円',
        change_reason: '顧客要望による上位プランへの変更',
        approved_by: 'REP-001',
        approved_date: '2024-06-14T17:00:00Z',
      },
      {
        change_id: 'CHG-002',
        contract_id: contract_id,
        change_type: 'サービス追加',
        change_date: '2024-06-15',
        change_time: '2024-06-15T10:00:00Z',
        previous_value: 'ユーザー数5名まで',
        new_value: 'ユーザー数10名まで',
        change_reason: '拡張オプション追加',
        approved_by: 'REP-001',
        approved_date: '2024-06-14T17:00:00Z',
      },
    ];

    // 請求データは意図的に空配列 (存在しない状態)
    const billing_records: Array<{
      billing_id: string;
      contract_id: string;
      billing_date: string;
      amount: number;
    }> = [];

    // 期待される差分結果
    const expected_diff_result = {
      contract_id: contract_id,
      customer_id: customer_id,
      service_id: service_id,
      contract_changes_found: true,
      billing_records_found: false,
      billing_records_status: 'データなし',
      contract_changes: [
        {
          change_id: 'CHG-001',
          change_type: '料金プラン変更',
          change_date: '2024-06-15',
          change_time: '2024-06-15T09:30:00Z',
          previous_value: '基本プラン月額5000円',
          new_value: 'プレミアムプラン月額8000円',
          change_reason: '顧客要望による上位プランへの変更',
          approved_by: 'REP-001',
          approved_date: '2024-06-14T17:00:00Z',
        },
        {
          change_id: 'CHG-002',
          change_type: 'サービス追加',
          change_date: '2024-06-15',
          change_time: '2024-06-15T10:00:00Z',
          previous_value: 'ユーザー数5名まで',
          new_value: 'ユーザー数10名まで',
          change_reason: '拡張オプション追加',
          approved_by: 'REP-001',
          approved_date: '2024-06-14T17:00:00Z',
        },
      ],
      billing_pattern_diff: null,
      error_occurred: false,
      error_message: null,
      processing_timestamp: '2024-06-15T10:30:00Z',
    };

    // 差分可視化機能を実行
    const actual_result = extractBillingDifferences({
      contract_id: contract_id,
      customer_id: customer_id,
      service_id: service_id,
      contract_changes: contract_changes,
      billing_records: billing_records,
      timestamp: '2024-06-15T10:30:00Z',
    });

    // アサーション: エラーが発生していないこと
    expect(actual_result.error_occurred).toBe(false);
    expect(actual_result.error_message).toBeNull();

    // アサーション: 請求データが存在しないことが正しく検出されたこと
    expect(actual_result.billing_records_found).toBe(false);
    expect(actual_result.billing_records_status).toBe('データなし');

    // アサーション: 変更条件が完全に表示されていること
    expect(actual_result.contract_changes_found).toBe(true);
    expect(actual_result.contract_changes.length).toBe(2);

    // アサーション: 最初の変更条件が正確に表示されていること
    expect(actual_result.contract_changes[0].change_id).toBe('CHG-001');
    expect(actual_result.contract_changes[0].change_type).toBe('料金プラン変更');
    expect(actual_result.contract_changes[0].change_date).toBe('2024-06-15');
    expect(actual_result.contract_changes[0].previous_value).toBe(
      '基本プラン月額5000円'
    );
    expect(actual_result.contract_changes[0].new_value).toBe(
      'プレミアムプラン月額8000円'
    );

    // アサーション: 二番目の変更条件が正確に表示されていること
    expect(actual_result.contract_changes[1].change_id).toBe('CHG-002');
    expect(actual_result.contract_changes[1].change_type).toBe('サービス追加');
    expect(actual_result.contract_changes[1].previous_value).toBe(
      'ユーザー数5名まで'
    );
    expect(actual_result.contract_changes[1].new_value).toBe(
      'ユーザー数10名まで'
    );

    // アサーション: 請求パターン差分が null であること
    expect(actual_result.billing_pattern_diff).toBeNull();

    // アサーション: 全体の結果構造が期待値と一致すること
    expect(actual_result.contract_id).toBe(expected_diff_result.contract_id);
    expect(actual_result.customer_id).toBe(expected_diff_result.customer_id);
    expect(actual_result.service_id).toBe(expected_diff_result.service_id);
    expect(actual_result.processing_timestamp).toBe(
      expected_diff_result.processing_timestamp
    );
  });
});