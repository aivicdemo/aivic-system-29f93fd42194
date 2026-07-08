import { detectAndPrioritizeAnomalies } from '../../src/logic/it-1-br-6-2-1';

describe('複数異常指標の相互影響度を考慮した優先度付け', () => {
  test('SCEN-1189: 複数指標が同時に異常値を示した場合に相互影響度を考慮した優先度が決定される', () => {
    // ========== 準備: テストデータ設定 ==========
    // 複数の異常指標を同時に異常値で定義
    const assessment_variance_rate = 45.5; // 査定額乖離率 (%)、許容範囲外
    const processing_time_minutes = 85; // 処理時間 (分)、許容範囲外
    const evaluator_agreement_rate = 62.0; // 評価者間合意度 (%)、許容範囲外
    const ocr_accuracy_rate = 78.5; // OCR精度 (%)、許容範囲内
    const ai_judgment_accuracy_rate = 81.0; // AI判定精度 (%)、許容範囲内

    // 相互影響度マトリクス定義
    // 行・列は指標の種類 (assessment_variance / processing_time / evaluator_agreement / ocr_accuracy / ai_judgment_accuracy)
    const mutual_impact_matrix = [
      // assessment_variance | processing_time | evaluator_agreement | ocr_accuracy | ai_judgment_accuracy
      [1.0, 0.3, 0.85, 0.6, 0.7], // assessment_variance
      [0.3, 1.0, 0.2, 0.5, 0.4], // processing_time
      [0.85, 0.2, 1.0, 0.55, 0.75], // evaluator_agreement
      [0.6, 0.5, 0.55, 1.0, 0.8], // ocr_accuracy
      [0.7, 0.4, 0.75, 0.8, 1.0], // ai_judgment_accuracy
    ];

    // 異常判定閾値
    const thresholds = {
      assessment_variance_rate_upper: 30.0,
      processing_time_minutes_upper: 60.0,
      evaluator_agreement_rate_lower: 70.0,
      ocr_accuracy_rate_lower: 85.0,
      ai_judgment_accuracy_rate_lower: 85.0,
    };

    // ========== 実行: 異常指標検出・優先度付けロジック ==========
    const result = detectAndPrioritizeAnomalies({
      assessment_variance_rate,
      processing_time_minutes,
      evaluator_agreement_rate,
      ocr_accuracy_rate,
      ai_judgment_accuracy_rate,
      mutual_impact_matrix,
      thresholds,
    });

    // ========== 検証1: 異常指標の正確な検出 ==========
    // 異常値として検出されるべき指標: assessment_variance, processing_time, evaluator_agreement
    expect(result.detected_anomalies).toHaveLength(3);
    expect(result.detected_anomalies).toEqual(
      expect.arrayContaining([
        'assessment_variance_rate',
        'processing_time_minutes',
        'evaluator_agreement_rate',
      ])
    );

    // ========== 検証2: 優先度スコアの相互影響度を考慮した計算 ==========
    // 指標インデックス: assessment_variance=0, processing_time=1, evaluator_agreement=2
    // 相互影響度を考慮した優先度スコアの期待値を計算
    // 優先度スコア = 指標の異常度 × Σ(相互影響度マトリクスの行合計) × ビジネスインパクト係数

    // assessment_variance_rate の異常度: (45.5 - 30.0) / 30.0 = 0.517
    // 相互影響度行の合計: 1.0 + 0.3 + 0.85 + 0.6 + 0.7 = 3.45
    // ビジネスインパクト係数（査定額乖離率は最も重要）: 1.0
    // スコア = 0.517 × 3.45 × 1.0 = 1.783

    // processing_time_minutes の異常度: (85 - 60) / 60 = 0.417
    // 相互影響度行の合計: 0.3 + 1.0 + 0.2 + 0.5 + 0.4 = 2.4
    // ビジネスインパクト係数（処理時間は独立性が高い）: 0.65
    // スコア = 0.417 × 2.4 × 0.65 = 0.653

    // evaluator_agreement_rate の異常度: (70.0 - 62.0) / 70.0 = 0.114
    // 相互影響度行の合計: 0.85 + 0.2 + 1.0 + 0.55 + 0.75 = 3.35
    // ビジネスインパクト係数（評価者間合意度はバッファ）: 0.85
    // スコア = 0.114 × 3.35 × 0.85 = 0.324

    expect(result.anomaly_priorities).toHaveLength(3);

    // 優先度スコアは降順（高い方が優先）
    const first_priority = result.anomaly_priorities[0];
    const second_priority = result.anomaly_priorities[1];
    const third_priority = result.anomaly_priorities[2];

    expect(first_priority.indicator_name).toBe('assessment_variance_rate');
    expect(first_priority.priority_score).toBeCloseTo(1.783, 2);
    expect(first_priority.priority_rank).toBe(1);

    expect(second_priority.indicator_name).toBe('processing_time_minutes');
    expect(second_priority.priority_score).toBeCloseTo(0.653, 2);
    expect(second_priority.priority_rank).toBe(2);

    expect(third_priority.indicator_name).toBe('evaluator_agreement_rate');
    expect(third_priority.priority_score).toBeCloseTo(0.324, 2);
    expect(third_priority.priority_rank).toBe(3);

    // ========== 検証3: スコア降順での正しいランク付け ==========
    expect(first_priority.priority_score).toBeGreaterThan(second_priority.priority_score);
    expect(second_priority.priority_score).toBeGreaterThan(third_priority.priority_score);

    // ========== 検証4: 最高優先度指標が相互影響度最高の組み合わせを反映 ==========
    // assessment_variance と evaluator_agreement の相互影響度が 0.85 と最も高い
    // assessment_variance が最高優先度として選定されたことを確認
    expect(first_priority.indicator_name).toBe('assessment_variance_rate');
    expect(first_priority.highest_mutual_impact_pair).toEqual({
      indicator_1: 'assessment_variance_rate',
      indicator_2: 'evaluator_agreement_rate',
      mutual_impact_coefficient: 0.85,
    });

    // ========== 検証5: ビジネスインパクトスコアの計算 ==========
    // ビジネスインパクトスコア = (異常指標が経営層に直結する度合い) × (影響範囲) × (補正係数)
    expect(first_priority.business_impact_score).toBeCloseTo(8.5, 1); // 最高優先度の影響度

    // ========== 検証6: 異常値の詳細情報 ==========
    expect(first_priority.current_value).toBe(45.5);
    expect(first_priority.threshold_value).toBe(30.0);
    expect(first_priority.deviation_percentage).toBeCloseTo(51.7, 1); // (45.5-30)/30 * 100

    // ========== 検証7: 推奨アクションの決定 ==========
    // 最高優先度指標に対して適切なアクションが推奨されているか
    expect(first_priority.recommended_action).toMatch(/学習データ/);
    expect(second_priority.recommended_action).toMatch(/人員配置/);
    expect(third_priority.recommended_action).toMatch(/教育指導/);

    // ========== 検証8: 検出時刻のタイムスタンプ ==========
    const detection_time = new Date(result.detection_timestamp);
    expect(detection_time.getTime()).toBeLessThanOrEqual(Date.now());

    // ========== 検証9: 異常指標が正常値のみの場合（境界値テスト） ==========
    // 正常値のケース
    const normal_result = detectAndPrioritizeAnomalies({
      assessment_variance_rate: 25.0, // 閾値30.0以下 → 正常
      processing_time_minutes: 55.0, // 閾値60以下 → 正常
      evaluator_agreement_rate: 75.0, // 閾値70以上 → 正常
      ocr_accuracy_rate: 90.0, // 閾値85以上 → 正常
      ai_judgment_accuracy_rate: 88.0, // 閾値85以上 → 正常
      mutual_impact_matrix,
      thresholds,
    });

    expect(normal_result.detected_anomalies).toHaveLength(0);
    expect(normal_result.anomaly_priorities).toHaveLength(0);
    expect(normal_result.has_critical_anomaly).toBe(false);

    // ========== 検証10: 単一異常指標のケース ==========
    // 1つの異常指標のみが異常値の場合
    const single_anomaly_result = detectAndPrioritizeAnomalies({
      assessment_variance_rate: 50.0, // 異常値
      processing_time_minutes: 55.0, // 正常
      evaluator_agreement_rate: 75.0, // 正常
      ocr_accuracy_rate: 90.0, // 正常
      ai_judgment_accuracy_rate: 88.0, // 正常
      mutual_impact_matrix,
      thresholds,
    });

    expect(single_anomaly_result.detected_anomalies).toHaveLength(1);
    expect(single_anomaly_result.detected_anomalies[0]).toBe('assessment_variance_rate');
    expect(single_anomaly_result.anomaly_priorities).toHaveLength(1);
    expect(single_anomaly_result.anomaly_priorities[0].priority_rank).toBe(1);

    // ========== 検証11: 相互影響度マトリクスの対称性 ==========
    // マトリクスが対称であることを確認（相互影響度は双方向）
    for (let i = 0; i < mutual_impact_matrix.length; i++) {
      for (let j = 0; j < mutual_impact_matrix[i].length; j++) {
        expect(mutual_impact_matrix[i][j]).toBe(mutual_impact_matrix[j][i]);
      }
    }

    // ========== 検証12: 優先度スコアの総合判定 ==========
    // 最高優先度スコアが全体の複合スコア計算に反映されているか
    const combined_anomaly_score = result.anomaly_priorities.reduce(
      (sum, anomaly) => sum + anomaly.priority_score,
      0
    );
    expect(combined_anomaly_score).toBeCloseTo(2.76, 1);

    // 複合スコアが閾値を超えた場合は critical_anomaly フラグが立つ
    if (combined_anomaly_score > 2.5) {
      expect(result.has_critical_anomaly).toBe(true);
    }
  });
});