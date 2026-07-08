import { describePrecisionDegradationRootCause } from "../../src/logic/it-1-br-6-2-1";

describe("査定員別の判定ばらつき率と相場乖離傾向の自動集計・分析機能", () => {
  test("SCEN-1291: OCR精度・AI判定精度低下の原因特定と改善優先度決定 - 学習データ更新が30日以上遅延している場合", () => {
    // Arrange: テスト環境でのセットアップ
    const current_timestamp = new Date("2024-12-15T10:00:00Z");
    const last_data_update_timestamp = new Date("2024-11-14T10:00:00Z"); // 31日前
    const data_update_delay_days =
      Math.floor(
        (current_timestamp.getTime() - last_data_update_timestamp.getTime()) /
          (1000 * 60 * 60 * 24)
      );

    // 学習データの更新遅延が30日以上であることを確認
    expect(data_update_delay_days).toBeGreaterThanOrEqual(30);

    // OCR精度・AI判定精度の低下を模擬するテストデータセット
    const ocr_accuracy_current = 78.5; // 基準値87.0から低下
    const ai_judgment_accuracy_current = 82.3; // 基準値90.0から低下
    const ocr_accuracy_baseline = 87.0;
    const ai_judgment_accuracy_baseline = 90.0;

    // 精度低下の度合い
    const ocr_accuracy_degradation_rate =
      ((ocr_accuracy_baseline - ocr_accuracy_current) /
        ocr_accuracy_baseline) *
      100;
    const ai_judgment_accuracy_degradation_rate =
      ((ai_judgment_accuracy_baseline - ai_judgment_accuracy_current) /
        ai_judgment_accuracy_baseline) *
      100;

    expect(ocr_accuracy_degradation_rate).toBeCloseTo(9.77, 1);
    expect(ai_judgment_accuracy_degradation_rate).toBeCloseTo(8.56, 1);

    // Act: 精度低下の原因分析機能を実行
    const diagnosis_input = {
      current_timestamp: current_timestamp,
      last_data_update_timestamp: last_data_update_timestamp,
      ocr_accuracy_current: ocr_accuracy_current,
      ai_judgment_accuracy_current: ai_judgment_accuracy_current,
      ocr_accuracy_baseline: ocr_accuracy_baseline,
      ai_judgment_accuracy_baseline: ai_judgment_accuracy_baseline,
      data_quality_score: 72.0, // データ品質スコア（低下を示す）
      model_drift_score: 8.5, // モデルドリフト指標（やや高い）
      assessment_target_count: 245, // 当月の査定対象件数
      days_since_data_format_change: null, // フォーマット変更なし
    };

    const diagnosis_result = describePrecisionDegradationRootCause(
      diagnosis_input
    );

    // Assert: 診断結果の検証
    // 1. システムが学習データの更新遅延を主要因として識別したことを確認
    expect(diagnosis_result).toBeDefined();
    expect(diagnosis_result.root_cause_primary).toBe(
      "学習データ更新遅延"
    );
    expect(diagnosis_result.root_cause_primary_reason).toMatch(
      /更新遅延/
    );

    // 2. 改善優先度が最高レベル（Priority 1）であることを確認
    expect(diagnosis_result.improvement_priority_level).toBe(1);
    expect(diagnosis_result.improvement_priority_label).toBe("高");

    // 3. 学習データ更新遅延を最高優先度の改善要因として認定
    const primary_improvement_factors = diagnosis_result.improvement_factors.filter(
      (factor) => factor.priority_level === 1
    );
    expect(primary_improvement_factors.length).toBeGreaterThan(0);
    const learning_data_update_factor = primary_improvement_factors.find(
      (factor) => factor.factor_name === "学習データ更新遅延"
    );
    expect(learning_data_update_factor).toBeDefined();
    expect(learning_data_update_factor.impact_score).toBeGreaterThanOrEqual(8);

    // 4. 改善推奨アクションが『学習データの更新実施』であることを確認
    expect(diagnosis_result.recommended_actions).toBeDefined();
    expect(diagnosis_result.recommended_actions.length).toBeGreaterThan(0);
    const primary_action = diagnosis_result.recommended_actions.find(
      (action) => action.priority_level === 1
    );
    expect(primary_action).toBeDefined();
    expect(primary_action.action_name).toMatch(/学習データ.*更新/);
    expect(primary_action.expected_improvement_rate).toBeGreaterThanOrEqual(7);

    // 5. 診断レポートに詳細情報が含まれていることを確認
    expect(diagnosis_result.diagnostic_report).toBeDefined();
    expect(diagnosis_result.diagnostic_report).toMatch(
      /学習データ更新遅延/
    );
    expect(diagnosis_result.diagnostic_report).toMatch(/31日/);
    expect(diagnosis_result.diagnostic_report).toMatch(
      /OCR精度低下/
    );
    expect(diagnosis_result.diagnostic_report).toMatch(
      /AI判定精度低下/
    );

    // 6. 改善対策の実施期間目安が提示されていることを確認
    expect(diagnosis_result.implementation_timeline_days).toBeDefined();
    expect(diagnosis_result.implementation_timeline_days).toBeGreaterThan(0);
    expect(diagnosis_result.implementation_timeline_days).toBeLessThanOrEqual(
      30
    );

    // 7. 改善による期待効果が定量的に示されていることを確認
    expect(diagnosis_result.expected_ocr_accuracy_after_improvement).toBeGreaterThan(
      ocr_accuracy_current
    );
    expect(diagnosis_result.expected_ai_judgment_accuracy_after_improvement).toBeGreaterThan(
      ai_judgment_accuracy_current
    );
    expect(diagnosis_result.expected_ocr_accuracy_after_improvement).toBeCloseTo(
      86.0,
      0
    );
    expect(diagnosis_result.expected_ai_judgment_accuracy_after_improvement).toBeCloseTo(
      89.0,
      0
    );

    // 8. 次回モニタリング推奨日時が現在から適切な期間後に設定されていることを確認
    const next_monitoring_date = new Date(
      diagnosis_result.next_monitoring_recommended_timestamp
    );
    const monitoring_interval_days = Math.floor(
      (next_monitoring_date.getTime() - current_timestamp.getTime()) /
        (1000 * 60 * 60 * 24)
    );
    expect(monitoring_interval_days).toBeGreaterThanOrEqual(7);
    expect(monitoring_interval_days).toBeLessThanOrEqual(14);

    // 9. 診断結果が監査証跡として記録可能な形式で提供されていることを確認
    expect(diagnosis_result.diagnosis_id).toBeDefined();
    expect(diagnosis_result.diagnosis_id).toMatch(/^DIAG-/);
    expect(diagnosis_result.diagnosis_timestamp).toBeDefined();
    expect(new Date(diagnosis_result.diagnosis_timestamp)).toEqual(
      current_timestamp
    );
    expect(diagnosis_result.diagnosed_by).toBeDefined();
    expect(diagnosis_result.diagnosed_by).toBe("システム自動診断");
  });
});