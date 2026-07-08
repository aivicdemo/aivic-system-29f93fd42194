import { evaluatePricingAccuracyAndGenerateRetrainingProposal } from "../../src/logic/it-6-2-2-1";

describe("相場判定精度の乖離率監視と再学習提案生成", () => {
  // SCEN-865
  test("相場判定精度の乖離率が基準値を超えた場合、再学習提案が生成される", () => {
    // ===== Setup: テスト用入力データ準備 =====
    // 相場判定結果: 実際のAIモデルが出力した判定値
    const currentPricingResults = [
      {
        estimate_id: "EST-001",
        item_name: "鉄筋工",
        ai_judged_unit_price: 850,
        reference_market_price: 1000,
        deviation_rate: -15.0,
        deviation_amount: -150,
      },
      {
        estimate_id: "EST-002",
        item_name: "型枠工",
        ai_judged_unit_price: 1200,
        reference_market_price: 1100,
        deviation_rate: 9.09,
        deviation_amount: 100,
      },
      {
        estimate_id: "EST-003",
        item_name: "コンクリート工",
        ai_judged_unit_price: 5500,
        reference_market_price: 5000,
        deviation_rate: 10.0,
        deviation_amount: 500,
      },
      {
        estimate_id: "EST-004",
        item_name: "左官工",
        ai_judged_unit_price: 950,
        reference_market_price: 1000,
        deviation_rate: -5.0,
        deviation_amount: -50,
      },
      {
        estimate_id: "EST-005",
        item_name: "防水工",
        ai_judged_unit_price: 3200,
        reference_market_price: 3000,
        deviation_rate: 6.67,
        deviation_amount: 200,
      },
    ];

    // 正解データ（過去案件の相場基準値）
    const correct_reference_prices = [
      {
        estimate_id: "EST-001",
        item_name: "鉄筋工",
        correct_market_price: 1000,
      },
      {
        estimate_id: "EST-002",
        item_name: "型枠工",
        correct_market_price: 1100,
      },
      {
        estimate_id: "EST-003",
        item_name: "コンクリート工",
        correct_market_price: 5000,
      },
      {
        estimate_id: "EST-004",
        item_name: "左官工",
        correct_market_price: 1000,
      },
      {
        estimate_id: "EST-005",
        item_name: "防水工",
        correct_market_price: 3000,
      },
    ];

    // 精度監視基準値
    const accuracy_threshold_deviation_rate = 5.0; // 許容乖離率 ± 5%
    const accuracy_threshold_count = 3; // 3件以上の超過で再学習推奨

    // 監視期間とモデルのメタデータ
    const monitoring_config = {
      model_version: "v1.2.0",
      monitoring_period_days: 30,
      measurement_date: "2024-06-15T10:30:00Z",
      data_source_region: "Kanto",
      construction_type: "structural_concrete",
    };

    // ===== Execution: 精度評価と再学習提案生成ロジック実行 =====
    const result = evaluatePricingAccuracyAndGenerateRetrainingProposal({
      current_pricing_results: currentPricingResults,
      correct_reference_prices: correct_reference_prices,
      accuracy_threshold_deviation_rate: accuracy_threshold_deviation_rate,
      accuracy_threshold_count: accuracy_threshold_count,
      monitoring_config: monitoring_config,
    });

    // ===== Assertion: 精度低下検知と再学習提案の生成を検証 =====

    // 1. 乖離率の計算と超過件数の確認
    expect(result).toHaveProperty("deviation_analysis");
    expect(result.deviation_analysis).toHaveProperty("total_items_analyzed");
    expect(result.deviation_analysis.total_items_analyzed).toBe(5);

    // 乖離率が基準値（±5%）を超える項目の抽出
    const items_exceeding_threshold = result.deviation_analysis.items_exceeding_threshold;
    expect(items_exceeding_threshold.length).toBeGreaterThanOrEqual(
      accuracy_threshold_count
    );

    // 超過件数が3件以上（再学習推奨の閾値）を確認
    const exceeding_count = items_exceeding_threshold.filter(
      (item: any) =>
        Math.abs(item.deviation_rate_percent) > accuracy_threshold_deviation_rate
    ).length;
    expect(exceeding_count).toBeGreaterThanOrEqual(3);

    // 2. 再学習提案の生成確認
    expect(result).toHaveProperty("retraining_proposal_triggered");
    expect(result.retraining_proposal_triggered).toBe(true);

    // 3. 生成された再学習提案の構造検証
    expect(result).toHaveProperty("retraining_proposal");
    const proposal = result.retraining_proposal;

    // 提案タイプ: モデル再学習
    expect(proposal).toHaveProperty("proposal_type");
    expect(proposal.proposal_type).toBe("model_retraining");

    // 対象モデル
    expect(proposal).toHaveProperty("target_model_version");
    expect(proposal.target_model_version).toBe("v1.2.0");

    // 優先度レベル
    expect(proposal).toHaveProperty("priority_level");
    expect(["high", "medium", "low"]).toContain(proposal.priority_level);

    // 乖離率が高い場合は優先度 high
    const average_deviation_rate =
      items_exceeding_threshold.reduce(
        (sum: number, item: any) => sum + Math.abs(item.deviation_rate_percent),
        0
      ) / items_exceeding_threshold.length;

    if (average_deviation_rate > 8.0) {
      expect(proposal.priority_level).toBe("high");
    }

    // 4. 提案の詳細内容検証
    expect(proposal).toHaveProperty("recommended_training_data_scope");
    expect(proposal.recommended_training_data_scope).toHaveProperty(
      "region"
    );
    expect(proposal.recommended_training_data_scope).toHaveProperty(
      "construction_type"
    );

    // 提案スコープが監視期間の設定と一致
    expect(proposal.recommended_training_data_scope.region).toBe("Kanto");
    expect(proposal.recommended_training_data_scope.construction_type).toBe(
      "structural_concrete"
    );

    // 推奨実行日時
    expect(proposal).toHaveProperty("recommended_execution_date_time");
    const proposed_datetime = new Date(
      proposal.recommended_execution_date_time
    );
    expect(proposed_datetime.getTime()).toBeGreaterThan(
      new Date("2024-06-15T10:30:00Z").getTime()
    );

    // 5. 期待される精度改善率の計算
    expect(proposal).toHaveProperty("expected_accuracy_improvement_rate_percent");
    expect(typeof proposal.expected_accuracy_improvement_rate_percent).toBe(
      "number"
    );
    expect(proposal.expected_accuracy_improvement_rate_percent).toBeGreaterThan(
      0
    );
    expect(proposal.expected_accuracy_improvement_rate_percent).toBeLessThanOrEqual(
      30
    );

    // 具体値: 乖離率が平均 9.68% の場合、期待改善率は約 7.26% - 9.68% を目指す
    // Formula: 期待改善率 = min(平均乖離率 - 許容値, 30%)
    // = min(9.68 - 5.0, 30) = 4.68 ≈ 5.0 (四捨五入)
    const expected_improvement_rough =
      Math.min(average_deviation_rate - accuracy_threshold_deviation_rate, 30);
    expect(
      proposal.expected_accuracy_improvement_rate_percent
    ).toBeCloseTo(expected_improvement_rough, 1);

    // 6. 対象データの詳細リスト
    expect(proposal).toHaveProperty("target_items_for_retraining");
    expect(Array.isArray(proposal.target_items_for_retraining)).toBe(true);
    expect(proposal.target_items_for_retraining.length).toBeGreaterThanOrEqual(
      exceeding_count
    );

    // 各対象アイテムに必須フィールドが含まれているか検証
    proposal.target_items_for_retraining.forEach((item: any) => {
      expect(item).toHaveProperty("estimate_id");
      expect(item).toHaveProperty("item_name");
      expect(item).toHaveProperty("current_deviation_rate_percent");
      expect(item).toHaveProperty("reason_for_inclusion");
    });

    // 7. システムログ記録の確認
    expect(result).toHaveProperty("system_log_record");
    const log_record = result.system_log_record;

    expect(log_record).toHaveProperty("log_timestamp");
    expect(log_record).toHaveProperty("log_level");
    expect(log_record.log_level).toBe("INFO");

    expect(log_record).toHaveProperty("event_type");
    expect(log_record.event_type).toBe("retraining_proposal_generated");

    expect(log_record).toHaveProperty("model_version");
    expect(log_record.model_version).toBe("v1.2.0");

    expect(log_record).toHaveProperty("deviation_stats");
    expect(log_record.deviation_stats).toHaveProperty("max_deviation_rate_percent");
    expect(log_record.deviation_stats).toHaveProperty("avg_deviation_rate_percent");
    expect(log_record.deviation_stats.max_deviation_rate_percent).toBe(15.0);
    expect(log_record.deviation_stats.avg_deviation_rate_percent).toBeCloseTo(
      average_deviation_rate,
      1
    );

    // 8. ユーザーインターフェース出力形式の確認
    expect(result).toHaveProperty("ui_display_format");
    const ui_format = result.ui_display_format;

    expect(ui_format).toHaveProperty("display_title");
    expect(typeof ui_format.display_title).toBe("string");
    expect(ui_format.display_title.length).toBeGreaterThan(0);

    expect(ui_format).toHaveProperty("severity_badge");
    expect(["🔴 Critical", "🟠 High", "🟡 Medium", "🟢 Low"]).toContain(
      ui_format.severity_badge
    );

    // 優先度 high の場合、severity_badge は 🔴 Critical または 🟠 High
    if (proposal.priority_level === "high") {
      expect(["🔴 Critical", "🟠 High"]).toContain(ui_format.severity_badge);
    }

    expect(ui_format).toHaveProperty("summary_message");
    expect(typeof ui_format.summary_message).toBe("string");

    expect(ui_format).toHaveProperty("action_buttons");
    expect(Array.isArray(ui_format.action_buttons)).toBe(true);
    expect(ui_format.action_buttons.length).toBeGreaterThan(0);

    // 9. 提案管理情報の確認
    expect(result).toHaveProperty("proposal_management_info");
    const mgmt_info = result.proposal_management_info;

    expect(mgmt_info).toHaveProperty("proposal_id");
    expect(typeof mgmt_info.proposal_id).toBe("string");
    expect(mgmt_info.proposal_id).toMatch(/^PROP-\d{8}-\d{6}$/);

    expect(mgmt_info).toHaveProperty("generated_at");
    const generated_at = new Date(mgmt_info.generated_at);
    expect(generated_at.getTime()).toBeCloseTo(
      new Date("2024-06-15T10:30:00Z").getTime(),
      -2
    );

    expect(mgmt_info).toHaveProperty("generated_by_system");
    expect(mgmt_info.generated_by_system).toBe(
      "accuracy_monitoring_automated_service"
    );

    expect(mgmt_info).toHaveProperty("status");
    expect(mgmt_info.status).toBe("pending_review");

    // 10. 提案が管理画面で参照可能な形式で出力されているか確認
    expect(result).toHaveProperty("audit_trail");
    expect(Array.isArray(result.audit_trail)).toBe(true);
    expect(result.audit_trail.length).toBeGreaterThan(0);

    const final_audit_entry = result.audit_trail[result.audit_trail.length - 1];
    expect(final_audit_entry).toHaveProperty("timestamp");
    expect(final_audit_entry).toHaveProperty("action");
    expect(final_audit_entry.action).toBe("proposal_generated_and_logged");

    expect(final_audit_entry).toHaveProperty("details");
    expect(final_audit_entry.details).toContain(
      `Proposal ID: ${mgmt_info.proposal_id}`
    );

    // 11. 総合判定: 再学習提案が正しく機能しているか
    expect(result.retraining_proposal_triggered).toBe(true);
    expect(proposal.proposal_type).toBe("model_retraining");
    expect(log_record.event_type).toBe("retraining_proposal_generated");
    expect(mgmt_info.status).toBe("pending_review");
  });
});