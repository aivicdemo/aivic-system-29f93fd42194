import { evaluateNewStaffIntegrated } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目のメタデータ管理機能 - 新入スタッフ3業務統合評価', () => {
  test('SCEN-1083: 3業務のうち1つ以上が不合格の場合に修正指示フラグが生成される', () => {
    // ハッピーパス: 業務1合格、業務2不合格、業務3合格の場合
    const evaluation_partial_fail = {
      staff_id: 'STAFF_001',
      evaluation_date: '2024-01-31',
      business_1_sales_data_quality: {
        status: 'pass',
        score: 92,
        details: '営業データ品質管理：合格'
      },
      business_2_billing_automation: {
        status: 'fail',
        score: 65,
        details: '請求自動化：請求額計算エラーが2件検出'
      },
      business_3_data_validation: {
        status: 'pass',
        score: 88,
        details: 'データ検証：合格'
      }
    };

    const result_partial_fail = evaluateNewStaffIntegrated(evaluation_partial_fail);

    // 修正指示フラグが生成されていることを確認
    expect(result_partial_fail.has_correction_flag).toBe(true);
    expect(result_partial_fail.overall_status).toBe('requires_correction');
    
    // 不合格業務が明確に指摘されていることを確認
    expect(result_partial_fail.correction_instructions).toContain('business_2_billing_automation');
    expect(result_partial_fail.correction_instructions_detail).toMatch(/請求自動化/);
    expect(result_partial_fail.correction_instructions_detail).toMatch(/請求額計算エラー/);

    // 修正対象業務数が正確であること
    expect(result_partial_fail.failed_business_count).toBe(1);
    expect(result_partial_fail.passed_business_count).toBe(2);

    // 次のフェーズが進行不可となっていることを確認
    expect(result_partial_fail.next_phase_approved).toBe(false);

    // ===== エラー境界値テスト: 業務1不合格、業務2不合格、業務3不合格 =====
    const evaluation_all_fail = {
      staff_id: 'STAFF_002',
      evaluation_date: '2024-01-31',
      business_1_sales_data_quality: {
        status: 'fail',
        score: 55,
        details: '営業データ品質管理：必須項目の欠落を検出'
      },
      business_2_billing_automation: {
        status: 'fail',
        score: 48,
        details: '請求自動化：計算ロジック誤り、割引基準不適用'
      },
      business_3_data_validation: {
        status: 'fail',
        score: 62,
        details: 'データ検証：異常値検出ロジック未実装'
      }
    };

    const result_all_fail = evaluateNewStaffIntegrated(evaluation_all_fail);

    // 3業務すべてが不合格の場合も修正指示フラグが生成されることを確認
    expect(result_all_fail.has_correction_flag).toBe(true);
    expect(result_all_fail.overall_status).toBe('requires_correction');
    
    // すべての不合格業務が記録されていることを確認
    expect(result_all_fail.failed_business_count).toBe(3);
    expect(result_all_fail.passed_business_count).toBe(0);
    expect(result_all_fail.correction_instructions).toContain('business_1_sales_data_quality');
    expect(result_all_fail.correction_instructions).toContain('business_2_billing_automation');
    expect(result_all_fail.correction_instructions).toContain('business_3_data_validation');

    // 修正指示の詳細にすべての不合格業務の理由が含まれていることを確認
    expect(result_all_fail.correction_instructions_detail).toMatch(/営業データ品質管理/);
    expect(result_all_fail.correction_instructions_detail).toMatch(/請求自動化/);
    expect(result_all_fail.correction_instructions_detail).toMatch(/データ検証/);
    expect(result_all_fail.correction_instructions_detail).toMatch(/必須項目の欠落/);
    expect(result_all_fail.correction_instructions_detail).toMatch(/計算ロジック誤り/);
    expect(result_all_fail.correction_instructions_detail).toMatch(/異常値検出ロジック/);

    // 次フェーズへの進行が明示的に不可となっていることを確認
    expect(result_all_fail.next_phase_approved).toBe(false);

    // ===== エラーケース: 業務2不合格、業務1・3合格の場合も修正指示が生成されることを確認 =====
    const evaluation_middle_fail = {
      staff_id: 'STAFF_003',
      evaluation_date: '2024-01-31',
      business_1_sales_data_quality: {
        status: 'pass',
        score: 90,
        details: '営業データ品質管理：合格'
      },
      business_2_billing_automation: {
        status: 'fail',
        score: 70,
        details: '請求自動化：割引基準の適用漏れ'
      },
      business_3_data_validation: {
        status: 'pass',
        score: 85,
        details: 'データ検証：合格'
      }
    };

    const result_middle_fail = evaluateNewStaffIntegrated(evaluation_middle_fail);

    expect(result_middle_fail.has_correction_flag).toBe(true);
    expect(result_middle_fail.failed_business_count).toBe(1);
    expect(result_middle_fail.correction_instructions).toContain('business_2_billing_automation');
    expect(result_middle_fail.next_phase_approved).toBe(false);

    // ===== エッジケース: すべてが合格の場合は修正指示フラグが生成されないことを確認 =====
    const evaluation_all_pass = {
      staff_id: 'STAFF_004',
      evaluation_date: '2024-01-31',
      business_1_sales_data_quality: {
        status: 'pass',
        score: 95,
        details: '営業データ品質管理：合格'
      },
      business_2_billing_automation: {
        status: 'pass',
        score: 92,
        details: '請求自動化：合格'
      },
      business_3_data_validation: {
        status: 'pass',
        score: 90,
        details: 'データ検証：合格'
      }
    };

    const result_all_pass = evaluateNewStaffIntegrated(evaluation_all_pass);

    // すべてが合格の場合は修正指示フラグが生成されないことを確認
    expect(result_all_pass.has_correction_flag).toBe(false);
    expect(result_all_pass.overall_status).toBe('approved');
    expect(result_all_pass.failed_business_count).toBe(0);
    expect(result_all_pass.passed_business_count).toBe(3);
    expect(result_all_pass.next_phase_approved).toBe(true);
  });
});