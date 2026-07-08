import { calculateAccuracyIndicators } from "../../src/logic/it-6-2-1-1";

describe("相場判定精度検証と不合格判定記録", () => {
  // SCEN-1434
  test("修正後システムで処理した見積書の相場判定精度が合格基準未満の場合に不合格判定が記録される", () => {
    // 前提: 修正後システムにアクセスし、相場判定精度検証機能が開かれた状態
    // トリガー: テスト用見積書データ（相場判定精度が合格基準未満）を準備して処理

    // 入力: 修正後システムで処理した見積書の精度検証用データ
    const estimate_id = "EST-2024-001234";
    const processing_date = new Date("2024-02-15T10:30:00Z");
    const assessor_id = "ASSR-567";

    // 相場判定精度が合格基準未満となるテストデータ
    // （参照データ件数: 8件, 相場乖離率: 12.5%, 乖離額: 25000円）
    const accuracy_metrics = {
      reference_data_count: 8,
      deviation_rate_percent: 12.5,
      deviation_amount_yen: 25000,
      supplement_coefficient: 1.02,
    };

    // 合格基準: 参照データ件数 >= 10, 相場乖離率 <= 10%, または乖離額 <= 20000
    const pass_criteria = {
      min_reference_count: 10,
      max_deviation_rate_percent: 10.0,
      max_deviation_amount_yen: 20000,
    };

    // 検証実行: 精度指標を自動集計
    const verification_result = calculateAccuracyIndicators({
      estimate_id,
      processing_date,
      assessor_id,
      accuracy_metrics,
      pass_criteria,
    });

    // 期待結果1: 不合格判定が記録される
    expect(verification_result.judgement_status).toBe("fail");

    // 期待結果2: 不合格日時が記録される（処理日時と同日時）
    expect(verification_result.judgement_datetime).toEqual(processing_date);

    // 期待結果3: 対象見積書IDが記録される
    expect(verification_result.target_estimate_id).toBe("EST-2024-001234");

    // 期待結果4: 判定精度値が記録される
    expect(verification_result.measured_accuracy_rate).toBe(12.5);

    // 期待結果5: 不合格理由が複数含まれている（参照データ不足 & 乖離額超過）
    expect(verification_result.failure_reasons).toContain(
      "参照データ不足"
    );
    expect(verification_result.failure_reasons).toContain("乖離額超過");

    // 期待結果6: 不合格判定の詳細情報が記録される
    expect(verification_result.detail_info).toEqual({
      reference_data_count_actual: 8,
      reference_data_count_required: 10,
      deviation_rate_actual_percent: 12.5,
      deviation_rate_threshold_percent: 10.0,
      deviation_amount_actual_yen: 25000,
      deviation_amount_threshold_yen: 20000,
      supplement_coefficient_applied: 1.02,
    });

    // 期待結果7: 記録ログに不合格判定の情報が含まれている
    expect(verification_result.audit_log_entry).toMatchObject({
      timestamp: processing_date,
      estimate_id: "EST-2024-001234",
      assessor_id: "ASSR-567",
      judgement_status: "fail",
      accuracy_rate: 12.5,
      logged_at: expect.any(Date),
    });

    // 期待結果8: システムの品質管理機能が正常に動作していることを確認
    // （不合格判定が適切に記録され、今後の改善対象として使用可能な状態）
    expect(verification_result.quality_control_status).toBe("functioning");
    expect(verification_result.available_for_improvement_analysis).toBe(true);
  });
});