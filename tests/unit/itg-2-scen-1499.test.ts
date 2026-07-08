import { aggregateAccuracyMetricsByAssessorWorkTypeAmountBand } from "../../src/logic/it-6-2-1-1";

describe("査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  // SCEN-1499: [edge] 学習データ分割・モデル学習機能 - 訓練セットが非常に小さい（データ総数の5%以下）場合、警告が発され学習品質への影響を通知する
  test("訓練セットがデータ総数の5%以下の場合、警告メッセージを発し学習品質への悪影響を通知", () => {
    const total_data_count = 1000;
    const train_set_size = 50; // 5%以下
    const recommended_min_train_set_size = Math.ceil(total_data_count * 0.1);

    const result = aggregateAccuracyMetricsByAssessorWorkTypeAmountBand({
      total_data_count,
      train_set_size,
      validation_set_size: 150,
      test_set_size: 800,
      assessor_id: "ASSESSOR_001",
      work_type_code: "WRK_A",
      amount_band_code: "BAND_100M",
    });

    // 警告フラグが true であることを検証
    expect(result.warning_triggered).toBe(true);

    // 警告メッセージに業務キーワードが含まれていることを検証
    expect(result.warning_message).toMatch(/訓練セット/);
    expect(result.warning_message).toMatch(/小さすぎる/);
    expect(result.warning_message).toMatch(/学習品質/);

    // 推奨される最小訓練セットサイズが警告詳細に含まれていることを検証
    expect(result.warning_detail.recommended_min_train_size).toBe(
      recommended_min_train_set_size
    );

    // 警告レベルが HIGH であることを検証
    expect(result.warning_level).toBe("HIGH");

    // 訓練セット分割比率が5%以下であることを確認
    const train_ratio = (train_set_size / total_data_count) * 100;
    expect(train_ratio).toBeLessThanOrEqual(5);

    // 学習処理が継続されていることを検証（learning_continued: true）
    expect(result.learning_continued).toBe(true);

    // システムログに警告記録が含まれていることを検証
    expect(result.system_log).toMatch(/警告/);
    expect(result.system_log).toMatch(/学習品質への影響/);

    // 警告詳細に「見直しを促す」内容が含まれていることを検証
    expect(result.warning_detail.recommendation).toMatch(/分割比率の見直し/);

    // 訓練セット分割比率が警告詳細に記録されていることを検証
    expect(result.warning_detail.actual_train_ratio_percent).toBe(5);

    // 精度指標の集計処理も正常に完了していることを検証（警告有りながらも処理継続）
    expect(result.accuracy_metrics).toBeDefined();
    expect(result.accuracy_metrics.assessor_id).toBe("ASSESSOR_001");
    expect(result.accuracy_metrics.work_type_code).toBe("WRK_A");
    expect(result.accuracy_metrics.amount_band_code).toBe("BAND_100M");
  });
});