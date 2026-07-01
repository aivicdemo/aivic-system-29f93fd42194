import { evaluateOnboardingGraduationRequirements } from '../../src/logic/it-1781935279444-2-2-1';

describe('新入スタッフ卒業要件判定機能', () => {
  // SCEN-1116: [normal] 新入スタッフ卒業要件判定機能 - 代表による確認・検証が完了し例外ケースがすべてドキュメント反映された場合、卒業要件達成状況が正確に判定される
  test('代表が新入スタッフの卒業要件を判定し、すべての例外ケースが反映された状態で結果が正確に保存される', () => {
    // Arrange: テストデータ準備
    const staff_id = 'STAFF-001';
    const representative_user_id = 'REP-USER-001';
    const staff_name = '新入スタッフA';
    const on_boarding_start_date = new Date('2024-01-01T00:00:00Z');
    const verification_completion_date = new Date('2024-02-15T10:30:00Z');
    const exception_cases_count = 3;
    const exception_cases_reflected_in_doc_count = 3;
    const invoice_creation_completion_flag = true;
    const sales_report_aggregation_completion_flag = true;
    const contract_management_completion_flag = true;
    const document_reflection_completion_flag = true;

    const on_boarding_record = {
      staff_id,
      staff_name,
      on_boarding_start_date,
      verification_completion_date,
      representative_user_id,
      exception_cases_count,
      exception_cases_reflected_in_doc_count,
      invoice_creation_completion_flag,
      sales_report_aggregation_completion_flag,
      contract_management_completion_flag,
      document_reflection_completion_flag,
    };

    // Act: 卒業要件判定機能を実行
    const graduation_judgment_result = evaluateOnboardingGraduationRequirements(on_boarding_record);

    // Assert: 判定結果を検証
    // 1. 各要件項目の達成状況を確認
    expect(graduation_judgment_result.invoice_creation_requirement_achievement).toBe(true);
    expect(graduation_judgment_result.sales_report_aggregation_requirement_achievement).toBe(true);
    expect(graduation_judgment_result.contract_management_requirement_achievement).toBe(true);

    // 2. 例外ケースドキュメント反映要件を確認
    expect(graduation_judgment_result.exception_cases_fully_reflected).toBe(true);
    expect(graduation_judgment_result.exception_cases_reflected_count).toBe(3);

    // 3. 代表による確認・検証完了状態を確認
    expect(graduation_judgment_result.representative_verification_completed).toBe(true);
    expect(graduation_judgment_result.verification_completion_timestamp).toEqual(verification_completion_date);

    // 4. 全体卒業要件達成判定を確認
    expect(graduation_judgment_result.graduation_requirement_achieved).toBe(true);

    // 5. 判定結果の保存情報を検証
    expect(graduation_judgment_result.judgment_result_saved).toBe(true);
    expect(graduation_judgment_result.judgment_result_id).toBeDefined();
    expect(typeof graduation_judgment_result.judgment_result_id).toBe('string');
    expect(graduation_judgment_result.judgment_result_id.length).toBeGreaterThan(0);

    // 6. 判定実行者情報が記録されていることを確認
    expect(graduation_judgment_result.judgment_executed_by_user_id).toBe(representative_user_id);
    expect(graduation_judgment_result.judgment_execution_timestamp).toBeDefined();

    // 7. 判定ログに必要な情報が含まれていることを確認
    expect(graduation_judgment_result.judgment_log).toBeDefined();
    expect(graduation_judgment_result.judgment_log.staff_id).toBe(staff_id);
    expect(graduation_judgment_result.judgment_log.staff_name).toBe(staff_name);
    expect(graduation_judgment_result.judgment_log.achievement_status_summary).toEqual({
      invoice_creation: true,
      sales_report_aggregation: true,
      contract_management: true,
      exception_cases_reflection: true,
    });

    // 8. 卒業要件達成の判定根拠が記録されていることを確認
    expect(graduation_judgment_result.judgment_rationale).toBeDefined();
    expect(graduation_judgment_result.judgment_rationale).toContain('invoice_creation_completed');
    expect(graduation_judgment_result.judgment_rationale).toContain('sales_report_aggregation_completed');
    expect(graduation_judgment_result.judgment_rationale).toContain('contract_management_completed');
    expect(graduation_judgment_result.judgment_rationale).toContain('exception_cases_fully_reflected');

    // 9. 判定結果がデータベースに保存されたことを確認
    expect(graduation_judgment_result.database_persistence_status).toBe('saved');
    expect(graduation_judgment_result.database_record_id).toBeDefined();
    expect(typeof graduation_judgment_result.database_record_id).toBe('string');

    // 10. すべての要件をクリアした卒業判定ステータスが正確であることを確認
    expect(graduation_judgment_result.overall_graduation_status).toBe('GRADUATED');
    expect(graduation_judgment_result.graduation_judgment_confidence_level).toBe(100);
  });
});