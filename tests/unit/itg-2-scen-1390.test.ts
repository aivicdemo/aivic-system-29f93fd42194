import { recordProcessHistory, retrieveProcessHistory, validateAuditTrail } from '../../src/logic/it-6-2-2-1';

describe('検証プロセス履歴の一元管理・監査記録機能', () => {
  test('SCEN-1390: フォーマット差異分析から原因分析までの全プロセスが時系列で記録される', () => {
    // 1. 対象案件と処理実行者の初期化
    const case_id = 'CASE-20240115-001';
    const appraiser_id = 'USR-APP-0042';
    const appraiser_name = '山田太郎';

    // 2. フォーマット差異分析処理の実行と記録
    const format_diff_start_time = new Date('2024-01-15T09:30:00Z');
    const format_diff_process_id = 'PROC-FMTDIFF-20240115-001';
    const format_diff_analysis = {
      process_id: format_diff_process_id,
      case_id: case_id,
      appraiser_id: appraiser_id,
      appraiser_name: appraiser_name,
      process_type: 'FORMAT_DIFFERENCE_ANALYSIS',
      process_step: 'STEP_1_FORMAT_COMPARISON',
      start_time: format_diff_start_time,
      end_time: new Date('2024-01-15T09:35:15Z'),
      execution_result: 'SUCCESS',
      execution_status: 'COMPLETED',
      detected_differences: 3,
      difference_categories: ['FIELD_STRUCTURE', 'VALUE_TYPE', 'FIELD_NAME_MISMATCH'],
      summary: 'フォーマット構造の差異を検出'
    };

    // フォーマット差異分析履歴を記録
    const format_diff_history_id = recordProcessHistory(format_diff_analysis);
    expect(typeof format_diff_history_id).toBe('string');
    expect(format_diff_history_id.length).toBeGreaterThan(0);

    // 3. 原因分析プロセス（ステップ1: データ検証）の実行と記録
    const root_cause_step1_start = new Date('2024-01-15T09:36:00Z');
    const root_cause_process_id = 'PROC-ROOTCAUSE-20240115-001';
    const root_cause_step1_data_validation = {
      process_id: root_cause_process_id,
      case_id: case_id,
      appraiser_id: appraiser_id,
      appraiser_name: appraiser_name,
      process_type: 'ROOT_CAUSE_ANALYSIS',
      process_step: 'STEP_2_DATA_VALIDATION',
      parent_process_id: format_diff_process_id,
      start_time: root_cause_step1_start,
      end_time: new Date('2024-01-15T09:40:30Z'),
      execution_result: 'SUCCESS',
      execution_status: 'COMPLETED',
      validation_target: 'HISTORICAL_CASE_DATA',
      data_count: 1240,
      validation_errors: 2,
      validation_summary: '過去案件データの形式妥当性チェック完了'
    };

    const step1_history_id = recordProcessHistory(root_cause_step1_data_validation);
    expect(typeof step1_history_id).toBe('string');

    // 4. 原因分析プロセス（ステップ2: ルール照合）の実行と記録
    const root_cause_step2_start = new Date('2024-01-15T09:41:00Z');
    const root_cause_step2_rule_matching = {
      process_id: root_cause_process_id,
      case_id: case_id,
      appraiser_id: appraiser_id,
      appraiser_name: appraiser_name,
      process_type: 'ROOT_CAUSE_ANALYSIS',
      process_step: 'STEP_3_RULE_MATCHING',
      parent_process_id: format_diff_process_id,
      start_time: root_cause_step2_start,
      end_time: new Date('2024-01-15T09:45:45Z'),
      execution_result: 'SUCCESS',
      execution_status: 'COMPLETED',
      rule_base_version: '2024-01-v1.2',
      matched_rules: 5,
      unmatched_items: 1,
      matching_summary: '判定ロジックとの照合完了、1項目不一致'
    };

    const step2_history_id = recordProcessHistory(root_cause_step2_rule_matching);
    expect(typeof step2_history_id).toBe('string');

    // 5. 原因分析プロセス（ステップ3: 判定）の実行と記録
    const root_cause_step3_start = new Date('2024-01-15T09:46:00Z');
    const root_cause_step3_judgment = {
      process_id: root_cause_process_id,
      case_id: case_id,
      appraiser_id: appraiser_id,
      appraiser_name: appraiser_name,
      process_type: 'ROOT_CAUSE_ANALYSIS',
      process_step: 'STEP_4_JUDGMENT',
      parent_process_id: format_diff_process_id,
      start_time: root_cause_step3_start,
      end_time: new Date('2024-01-15T09:50:20Z'),
      execution_result: 'SUCCESS',
      execution_status: 'COMPLETED',
      judgment_reason: 'フォーマット差異はデータ品質不足が根本原因',
      root_cause_category: 'LEARNING_DATA_INSUFFICIENCY',
      root_cause_detail: '特定地域・工種の過去案件データが不足',
      recommended_action: '過去案件データ追加・学習モデル再学習'
    };

    const step3_history_id = recordProcessHistory(root_cause_step3_judgment);
    expect(typeof step3_history_id).toBe('string');

    // 6. 記録済みプロセス履歴を時系列で取得
    const retrieved_history = retrieveProcessHistory({
      case_id: case_id,
      start_time: new Date('2024-01-15T09:00:00Z'),
      end_time: new Date('2024-01-15T10:00:00Z'),
      sort_order: 'ASC'
    });

    // 7. 履歴が正しい時系列順で記録されていることを確認
    expect(Array.isArray(retrieved_history)).toBe(true);
    expect(retrieved_history.length).toBe(4);

    // 8. 各プロセスが正しい順序で記録されていることを検証
    const history_0 = retrieved_history[0];
    expect(history_0.process_type).toBe('FORMAT_DIFFERENCE_ANALYSIS');
    expect(history_0.process_step).toBe('STEP_1_FORMAT_COMPARISON');
    expect(new Date(history_0.start_time).getTime()).toBe(format_diff_start_time.getTime());

    const history_1 = retrieved_history[1];
    expect(history_1.process_type).toBe('ROOT_CAUSE_ANALYSIS');
    expect(history_1.process_step).toBe('STEP_2_DATA_VALIDATION');
    expect(history_1.parent_process_id).toBe(format_diff_process_id);

    const history_2 = retrieved_history[2];
    expect(history_2.process_type).toBe('ROOT_CAUSE_ANALYSIS');
    expect(history_2.process_step).toBe('STEP_3_RULE_MATCHING');

    const history_3 = retrieved_history[3];
    expect(history_3.process_type).toBe('ROOT_CAUSE_ANALYSIS');
    expect(history_3.process_step).toBe('STEP_4_JUDGMENT');

    // 9. 各履歴レコードにタイムスタンプ、実行ユーザー、処理内容、結果ステータスが含まれていることを確認
    retrieved_history.forEach((record: any) => {
      expect(record.start_time).toBeDefined();
      expect(record.end_time).toBeDefined();
      expect(record.appraiser_id).toBe(appraiser_id);
      expect(record.appraiser_name).toBe(appraiser_name);
      expect(record.process_type).toBeDefined();
      expect(record.process_step).toBeDefined();
      expect(record.execution_result).toBe('SUCCESS');
      expect(record.execution_status).toBe('COMPLETED');
      expect(typeof record.start_time).toBe('object');
      expect(typeof record.end_time).toBe('object');
    });

    // 10. タイムスタンプの正確性を検証
    expect(new Date(history_0.start_time).getTime()).toBe(new Date('2024-01-15T09:30:00Z').getTime());
    expect(new Date(history_0.end_time).getTime()).toBe(new Date('2024-01-15T09:35:15Z').getTime());
    expect(new Date(history_1.start_time).getTime()).toBe(new Date('2024-01-15T09:36:00Z').getTime());
    expect(new Date(history_3.end_time).getTime()).toBe(new Date('2024-01-15T09:50:20Z').getTime());

    // 11. タイムスタンプの連続性を検証（各ステップの終了時刻が次ステップの開始時刻以前であること）
    expect(new Date(history_0.end_time).getTime()).toBeLessThanOrEqual(
      new Date(history_1.start_time).getTime()
    );
    expect(new Date(history_1.end_time).getTime()).toBeLessThanOrEqual(
      new Date(history_2.start_time).getTime()
    );
    expect(new Date(history_2.end_time).getTime()).toBeLessThanOrEqual(
      new Date(history_3.start_time).getTime()
    );

    // 12. 監査記録ログを検証
    const audit_trail = validateAuditTrail({
      case_id: case_id,
      process_ids: [format_diff_process_id, root_cause_process_id]
    });

    expect(typeof audit_trail).toBe('object');
    expect(audit_trail.audit_status).toBe('VERIFIED');
    expect(Array.isArray(audit_trail.audit_records)).toBe(true);
    expect(audit_trail.audit_records.length).toBe(4);

    // 13. 各監査レコードの内容を検証
    const audit_records = audit_trail.audit_records;

    expect(audit_records[0].process_id).toBe(format_diff_process_id);
    expect(audit_records[0].audit_timestamp).toBeDefined();
    expect(audit_records[0].execution_user).toBe(appraiser_id);
    expect(audit_records[0].process_content).toBe('FORMAT_DIFFERENCE_ANALYSIS');
    expect(audit_records[0].result_status).toBe('SUCCESS');

    expect(audit_records[1].process_id).toBe(root_cause_process_id);
    expect(audit_records[1].audit_timestamp).toBeDefined();
    expect(audit_records[1].execution_user).toBe(appraiser_id);
    expect(audit_records[1].process_content).toContain('DATA_VALIDATION');

    expect(audit_records[2].process_id).toBe(root_cause_process_id);
    expect(audit_records[2].process_content).toContain('RULE_MATCHING');

    expect(audit_records[3].process_id).toBe(root_cause_process_id);
    expect(audit_records[3].process_content).toContain('JUDGMENT');

    // 14. 履歴レコード数と監査レコード数が一致していることを確認
    expect(retrieved_history.length).toBe(audit_trail.audit_records.length);

    // 15. 全プロセスが正常に完了し、トレーサビリティが確保されていることを最終確認
    expect(audit_trail.complete_traceability).toBe(true);
    expect(audit_trail.all_records_verified).toBe(true);
    expect(audit_trail.temporal_order_valid).toBe(true);
  });
});