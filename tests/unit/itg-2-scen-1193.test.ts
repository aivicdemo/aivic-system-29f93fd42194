import { generatePrecisionDropHypotheses } from "../../src/logic/it-6-2-1-1";

describe("精度低下原因仮説立案機能 - AI判定精度低下時に各原因仮説に対する信頼度スコアが算出される", () => {
  test("SCEN-1193: AI判定精度が低下した査定案件データから原因仮説を抽出し、各仮説に信頼度スコアを付与", () => {
    // 【テストデータ準備】
    // AI判定精度が低下した査定案件データセット
    const assessment_cases = [
      {
        case_id: "case_001",
        ocr_confidence: 0.75,
        ai_judgment_confidence: 0.62,
        reference_data_count: 8,
        model_drift_indicator: 0.18,
        learning_data_coverage_rate: 0.72,
        judgment_result: "approval",
        actual_market_result: "rejection",
        is_mismatch: true,
      },
      {
        case_id: "case_002",
        ocr_confidence: 0.68,
        ai_judgment_confidence: 0.58,
        reference_data_count: 5,
        model_drift_indicator: 0.22,
        learning_data_coverage_rate: 0.65,
        judgment_result: "approval",
        actual_market_result: "rejection",
        is_mismatch: true,
      },
      {
        case_id: "case_003",
        ocr_confidence: 0.71,
        ai_judgment_confidence: 0.60,
        reference_data_count: 6,
        model_drift_indicator: 0.20,
        learning_data_coverage_rate: 0.68,
        judgment_result: "approval",
        actual_market_result: "rejection",
        is_mismatch: true,
      },
      {
        case_id: "case_004",
        ocr_confidence: 0.72,
        ai_judgment_confidence: 0.61,
        reference_data_count: 7,
        model_drift_indicator: 0.19,
        learning_data_coverage_rate: 0.70,
        judgment_result: "approval",
        actual_market_result: "rejection",
        is_mismatch: true,
      },
      {
        case_id: "case_005",
        ocr_confidence: 0.69,
        ai_judgment_confidence: 0.59,
        reference_data_count: 6,
        model_drift_indicator: 0.21,
        learning_data_coverage_rate: 0.66,
        judgment_result: "approval",
        actual_market_result: "rejection",
        is_mismatch: true,
      },
    ];

    // 【精度低下の閾値設定】
    const precision_drop_threshold = 0.05;
    const baseline_ai_judgment_precision = 0.75;
    const current_ai_judgment_precision = 0.60;

    // 【関数実行】
    const result = generatePrecisionDropHypotheses({
      assessment_cases,
      baseline_precision: baseline_ai_judgment_precision,
      current_precision: current_ai_judgment_precision,
      precision_drop_threshold,
    });

    // 【Assertion 1】複数の原因仮説が抽出されていることを確認
    expect(result.hypotheses).toBeDefined();
    expect(Array.isArray(result.hypotheses)).toBe(true);
    expect(result.hypotheses.length).toBeGreaterThan(0);

    // 【Assertion 2】仮説リストが信頼度スコアの高い順で降順ソートされていることを確認
    const hypothesis_scores = result.hypotheses.map(
      (h: { confidence_score: number }) => h.confidence_score
    );
    for (let i = 0; i < hypothesis_scores.length - 1; i++) {
      expect(hypothesis_scores[i]).toBeGreaterThanOrEqual(hypothesis_scores[i + 1]);
    }

    // 【Assertion 3】各仮説の信頼度スコアが0.0～1.0の範囲内であることを確認
    result.hypotheses.forEach(
      (hypothesis: { confidence_score: number; hypothesis_name: string }) => {
        expect(hypothesis.confidence_score).toBeGreaterThanOrEqual(0.0);
        expect(hypothesis.confidence_score).toBeLessThanOrEqual(1.0);
      }
    );

    // 【Assertion 4】「学習データ偏差」仮説の信頼度スコアが最も高いことを確認
    // 理由: 過去案件データの有効カバレッジが72%～66%と低いため
    const learning_data_bias_hypothesis = result.hypotheses.find(
      (h: { hypothesis_name: string }) => h.hypothesis_name === "learning_data_bias"
    );
    expect(learning_data_bias_hypothesis).toBeDefined();
    expect(learning_data_bias_hypothesis.confidence_score).toBe(0.58);

    // 【Assertion 5】「モデルドリフト」仮説の信頼度スコアが第2位であることを確認
    // 理由: model_drift_indicator が平均 0.20 と、ベースラインからの乖離が明確
    const model_drift_hypothesis = result.hypotheses.find(
      (h: { hypothesis_name: string }) => h.hypothesis_name === "model_drift"
    );
    expect(model_drift_hypothesis).toBeDefined();
    expect(model_drift_hypothesis.confidence_score).toBe(0.52);

    // 【Assertion 6】「参照データ不足」仮説の信頼度スコアが確認されることを確認
    // 理由: reference_data_count が 5～8 件と、判定基準となるデータセットが小規模
    const insufficient_reference_data_hypothesis = result.hypotheses.find(
      (h: { hypothesis_name: string }) =>
        h.hypothesis_name === "insufficient_reference_data"
    );
    expect(insufficient_reference_data_hypothesis).toBeDefined();
    expect(insufficient_reference_data_hypothesis.confidence_score).toBe(0.45);

    // 【Assertion 7】「OCR読取精度不足」仮説が確認されることを確認
    // 理由: ocr_confidence が平均 0.71 と、許容基準 0.85 以上より低い
    const ocr_quality_issue_hypothesis = result.hypotheses.find(
      (h: { hypothesis_name: string }) => h.hypothesis_name === "ocr_quality_issue"
    );
    expect(ocr_quality_issue_hypothesis).toBeDefined();
    expect(ocr_quality_issue_hypothesis.confidence_score).toBe(0.38);

    // 【Assertion 8】各仮説が根拠となるメトリクスを保持していることを確認
    result.hypotheses.forEach(
      (hypothesis: { supporting_metrics: Record<string, unknown> }) => {
        expect(hypothesis.supporting_metrics).toBeDefined();
        expect(typeof hypothesis.supporting_metrics).toBe("object");
        expect(Object.keys(hypothesis.supporting_metrics).length).toBeGreaterThan(0);
      }
    );

    // 【Assertion 9】「学習データ偏差」仮説の根拠メトリクスが正確に計算されていることを確認
    const learning_bias_metrics = learning_data_bias_hypothesis.supporting_metrics;
    expect(learning_bias_metrics.average_coverage_rate).toBe(0.682);
    expect(learning_bias_metrics.affected_case_count).toBe(5);
    expect(learning_bias_metrics.coverage_shortfall_ratio).toBeCloseTo(0.318, 3);

    // 【Assertion 10】「モデルドリフト」仮説の根拠メトリクスが正確に計算されていることを確認
    const model_drift_metrics = model_drift_hypothesis.supporting_metrics;
    expect(model_drift_metrics.average_model_drift_indicator).toBe(0.20);
    expect(model_drift_metrics.affected_case_count).toBe(5);
    expect(model_drift_metrics.drift_magnitude_level).toBe("moderate");

    // 【Assertion 11】「参照データ不足」仮説の根拠メトリクスが正確に計算されていることを確認
    const ref_data_metrics =
      insufficient_reference_data_hypothesis.supporting_metrics;
    expect(ref_data_metrics.average_reference_data_count).toBe(6.4);
    expect(ref_data_metrics.minimum_reference_data_count).toBe(5);
    expect(ref_data_metrics.affected_case_count).toBe(5);
    expect(ref_data_metrics.data_sufficiency_status).toBe("insufficient");

    // 【Assertion 12】「OCR読取精度不足」仮説の根拠メトリクスが正確に計算されていることを確認
    const ocr_metrics = ocr_quality_issue_hypothesis.supporting_metrics;
    expect(ocr_metrics.average_ocr_confidence).toBeCloseTo(0.71, 2);
    expect(ocr_metrics.minimum_ocr_confidence).toBe(0.68);
    expect(ocr_metrics.affected_case_count).toBe(5);
    expect(ocr_metrics.confidence_below_threshold_count).toBe(5);

    // 【Assertion 13】全体の精度低下率が正確に計算されていることを確認
    const precision_drop_rate =
      (baseline_ai_judgment_precision - current_ai_judgment_precision) /
      baseline_ai_judgment_precision;
    expect(result.overall_precision_drop_rate).toBeCloseTo(0.2, 1);
    expect(precision_drop_rate).toBeCloseTo(0.2, 1);

    // 【Assertion 14】結果に全体サマリーが含まれていることを確認
    expect(result.summary).toBeDefined();
    expect(result.summary.total_hypotheses_generated).toBe(4);
    expect(result.summary.highest_confidence_hypothesis_name).toBe(
      "learning_data_bias"
    );
    expect(result.summary.highest_confidence_score).toBe(0.58);

    // 【Assertion 15】複数の精度低下パターンに対して信頼度スコアが正確に算出されることを検証
    // パターン1: 学習データカバレッジが低い場合、learning_data_bias スコア > 0.50
    expect(learning_data_bias_hypothesis.confidence_score).toBeGreaterThan(0.5);
    // パターン2: モデルドリフト指標が高い場合、model_drift スコア > 0.40
    expect(model_drift_hypothesis.confidence_score).toBeGreaterThan(0.4);
    // パターン3: 参照データが不足している場合、insufficient_reference_data スコア > 0.30
    expect(insufficient_reference_data_hypothesis.confidence_score).toBeGreaterThan(
      0.3
    );
    // パターン4: OCR信頼度が低い場合、ocr_quality_issue スコア > 0.30
    expect(ocr_quality_issue_hypothesis.confidence_score).toBeGreaterThan(0.3);
  });
});