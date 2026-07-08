import { analyzeDegradationRootCauses } from "../../src/logic/it-6-2-2-2";

describe("査定員別の判定精度・乖離パターン分析ダッシュボード", () => {
  // SCEN-1150
  test("精度低下根本原因特定機能 - 複数の根本原因が同時に検出される場合の優先順位を正しく決定する", () => {
    // Arrange: 判定ロジックの乖離パターンが異常増加した状態をシミュレート
    const degenerationData = {
      current_ocr_accuracy: 68.5, // 前月比で5%以上低下（基準値 >= 70%）
      previous_ocr_accuracy: 75.2,
      current_judgment_accuracy: 72.1, // 基準値未満
      previous_judgment_accuracy: 78.9,
      anomalous_deviation_pattern_increase_rate: 42.7, // 異常増加を検出
      feedback_count_surge_rate: 18.5, // フィードバック件数の増加率
      learning_data_coverage: 68.0, // 過去案件データのカバレッジが低い（基準値: 75%）
      price_book_staleness_days: 32, // 物価本が32日間未更新（基準値: 30日以内）
      model_parameter_drift_score: 58.3, // モデルパラメータの乖離スコア（0-100）
      format_change_detection: true, // 見積フォーマット変化を検出
    };

    // Act: 複数の根本原因が同時に検出されるシナリオで関数を実行
    const result = analyzeDegradationRootCauses(degenerationData);

    // Assert: 複数根本原因が優先順位付きで返却されることを検証
    expect(result).toBeDefined();
    expect(result.root_causes).toBeDefined();
    expect(Array.isArray(result.root_causes)).toBe(true);
    expect(result.root_causes.length).toBeGreaterThan(0);

    // Assert: 検出される根本原因が期待される複数要素を含むことを確認
    const root_cause_types = result.root_causes.map(
      (cause) => cause.root_cause_type
    );
    expect(root_cause_types).toContain("学習データ偏り");
    expect(root_cause_types).toContain("物価本未更新");
    expect(root_cause_types).toContain("モデルドリフト");
    expect(root_cause_types.length).toBeGreaterThanOrEqual(3);

    // Assert: 各根本原因に優先順位スコアが割り当てられていることを確認
    result.root_causes.forEach((cause) => {
      expect(cause.priority_score).toBeDefined();
      expect(typeof cause.priority_score).toBe("number");
      expect(cause.priority_score).toBeGreaterThanOrEqual(0);
      expect(cause.priority_score).toBeLessThanOrEqual(100);
    });

    // Assert: 優先順位が降順でソートされていることを検証
    for (let i = 0; i < result.root_causes.length - 1; i++) {
      expect(result.root_causes[i].priority_score).toBeGreaterThanOrEqual(
        result.root_causes[i + 1].priority_score
      );
    }

    // Assert: 最優先度の根本原因が「学習データ偏り」であることを検証
    // （影響度42.7% + 発生頻度18.5% + カバレッジ低下68.0% の複合要因で最高スコア）
    const highest_priority_cause = result.root_causes[0];
    expect(highest_priority_cause.root_cause_type).toBe("学習データ偏り");
    expect(highest_priority_cause.priority_score).toBeGreaterThan(75);

    // Assert: 優先順位スコアの計算根拠が記録されていることを確認
    result.root_causes.forEach((cause) => {
      expect(cause.impact_score).toBeDefined();
      expect(typeof cause.impact_score).toBe("number");
      expect(cause.impact_score).toBeGreaterThanOrEqual(0);
      expect(cause.impact_score).toBeLessThanOrEqual(100);

      expect(cause.frequency_score).toBeDefined();
      expect(typeof cause.frequency_score).toBe("number");
      expect(cause.frequency_score).toBeGreaterThanOrEqual(0);
      expect(cause.frequency_score).toBeLessThanOrEqual(100);

      expect(cause.severity_score).toBeDefined();
      expect(typeof cause.severity_score).toBe("number");
      expect(cause.severity_score).toBeGreaterThanOrEqual(0);
      expect(cause.severity_score).toBeLessThanOrEqual(100);
    });

    // Assert: 各スコアから優先度スコアが正しく計算されていることを検証
    // priority_score = (impact_score × 0.4) + (frequency_score × 0.35) + (severity_score × 0.25)
    result.root_causes.forEach((cause) => {
      const calculated_priority =
        cause.impact_score * 0.4 +
        cause.frequency_score * 0.35 +
        cause.severity_score * 0.25;
      expect(cause.priority_score).toBeCloseTo(calculated_priority, 1);
    });

    // Assert: 根本原因ごとに改善提案が含まれていることを確認
    result.root_causes.forEach((cause) => {
      expect(cause.recommended_action).toBeDefined();
      expect(typeof cause.recommended_action).toBe("string");
      expect(cause.recommended_action.length).toBeGreaterThan(0);
    });

    // Assert: 学習データ偏りの推奨アクションが適切であることを検証
    const learning_data_cause = result.root_causes.find(
      (c) => c.root_cause_type === "学習データ偏り"
    );
    expect(learning_data_cause).toBeDefined();
    expect(learning_data_cause!.recommended_action).toMatch(
      /過去案件データ|追加|カバレッジ/
    );

    // Assert: 物価本未更新の推奨アクションが適切であることを検証
    const price_book_cause = result.root_causes.find(
      (c) => c.root_cause_type === "物価本未更新"
    );
    expect(price_book_cause).toBeDefined();
    expect(price_book_cause!.recommended_action).toMatch(
      /物価本|更新|新版/
    );

    // Assert: 統計的一貫性の確認 - 同じ入力で同じ優先順位が得られることを検証
    const result_second_run = analyzeDegradationRootCauses(degenerationData);
    expect(result_second_run.root_causes.length).toBe(
      result.root_causes.length
    );
    expect(result_second_run.root_causes[0].priority_score).toBe(
      result.root_causes[0].priority_score
    );
    expect(result_second_run.root_causes[0].root_cause_type).toBe(
      result.root_causes[0].root_cause_type
    );

    // Assert: 優先順位スコアの一貫性を全要素で検証
    for (let i = 0; i < result.root_causes.length; i++) {
      expect(result_second_run.root_causes[i].priority_score).toBe(
        result.root_causes[i].priority_score
      );
      expect(result_second_run.root_causes[i].root_cause_type).toBe(
        result.root_causes[i].root_cause_type
      );
    }

    // Assert: 全体の総スコアが適切な範囲内であることを確認
    expect(result.total_degradation_severity_score).toBeDefined();
    expect(typeof result.total_degradation_severity_score).toBe("number");
    expect(result.total_degradation_severity_score).toBeGreaterThan(0);
    expect(result.total_degradation_severity_score).toBeLessThanOrEqual(100);

    // Assert: 複数根本原因が存在する場合のステータスが「要改善」であることを検認
    expect(result.status).toBe("複数根本原因_要改善");
  });
});