import { describe, test, expect } from '@jest/globals';
import { validateSalesDataQuality } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データ品質チェック判定機能', () => {
  // SCEN-708: [normal] 営業データ品質基準チェック判定機能 - 必須項目・形式・矛盾がすべて合格条件を満たしたときチェック結果が『合格』と判定される
  test('必須項目・形式・矛盾がすべて合格条件を満たしたときチェック結果が合格と判定される', () => {
    // テストデータ準備: 必須項目がすべて入力され、形式が正しく、矛盾がない営業データ
    const salesData = {
      customer_name: '株式会社テスト販売',
      contact_date: '2024-01-15',
      contact_time: '14:30',
      contact_person_email: 'contact@test-sales.jp',
      contact_person_phone: '09012345678',
      product_service_type: 'コンサルティングサービス',
      sales_amount: 500000,
      estimated_delivery_date: '2024-02-28',
      billing_date: '2024-03-15',
      appointment_status: '確定',
      appointment_scheduled_date: '2024-01-20',
      contact_details: 'クライアントとの初期打ち合わせを実施。ニーズを確認',
      contract_status: '契約前',
      revenue_recognition_date: '2024-02-28',
      notes: '顧客の要望に基づいた提案資料を3営業日以内に提出予定',
      data_entry_timestamp: '2024-01-15T15:45:00Z',
      data_entry_user_id: 'user_001',
      last_updated_timestamp: '2024-01-15T15:45:00Z',
      last_updated_user_id: 'user_001'
    };

    // 期待される結果: 必須項目チェック・形式チェック・矛盾チェックすべてが合格
    const expectedResult = {
      overall_result: '合格',
      mandatory_field_check: {
        status: '合格',
        missing_fields: []
      },
      format_check: {
        status: '合格',
        format_errors: []
      },
      consistency_check: {
        status: '合格',
        inconsistencies: []
      },
      sub_check_results: [
        {
          check_name: '必須項目チェック',
          result: '合格'
        },
        {
          check_name: '形式チェック',
          result: '合格'
        },
        {
          check_name: '矛盾チェック',
          result: '合格'
        }
      ]
    };

    // チェック処理を実行
    const checkResult = validateSalesDataQuality(salesData);

    // チェック結果を確認: 総合結果が合格であること
    expect(checkResult.overall_result).toBe('合格');

    // 必須項目チェック結果が合格であること
    expect(checkResult.mandatory_field_check.status).toBe('合格');
    expect(checkResult.mandatory_field_check.missing_fields.length).toBe(0);

    // 形式チェック結果が合格であること
    expect(checkResult.format_check.status).toBe('合格');
    expect(checkResult.format_check.format_errors.length).toBe(0);

    // 矛盾チェック結果が合格であること
    expect(checkResult.consistency_check.status).toBe('合格');
    expect(checkResult.consistency_check.inconsistencies.length).toBe(0);

    // サブチェック結果のすべてが合格であること
    expect(checkResult.sub_check_results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ check_name: '必須項目チェック', result: '合格' }),
        expect.objectContaining({ check_name: '形式チェック', result: '合格' }),
        expect.objectContaining({ check_name: '矛盾チェック', result: '合格' })
      ])
    );

    // 全体の構造が期待値と一致していることを確認
    expect(checkResult).toEqual(expectedResult);
  });
});