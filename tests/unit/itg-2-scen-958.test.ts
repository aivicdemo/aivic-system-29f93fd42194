import { calculateMonthlyForecastConfidence } from "../../src/logic/it-6-2-1-1";

describe("翌月繁忙度予測・必要人員数自動計算 - 信頼度境界値警告", () => {
  test("SCEN-958: 信頼度スコアが50%以下の場合、警告情報が表示される", () => {
    // 入力データ: 過去3ヶ月の査定件数
    const historical_months = [
      { month: "2024-10", estimate_count: 150, confidence_base: 0.8 },
      { month: "2024-11", estimate_count: 200, confidence_base: 0.75 },
      { month: "2024-12", estimate_count: 180, confidence_base: 0.6 },
    ];

    // 季節要因: 1月は通常繁忙期（係数 1.2）だが、データが限定的
    const seasonal_factor = 1.2;
    const seasonal_data_count = 2;

    // 特殊要因: なし
    const special_factors: object[] = [];

    // 地域別・工種別カバー率: 不十分（低信頼度を引き起こす）
    const regional_coverage = 0.4;
    const work_type_coverage = 0.35;

    // 実行
    const result = calculateMonthlyForecastConfidence({
      historical_months,
      seasonal_factor,
      seasonal_data_count,
      special_factors,
      regional_coverage,
      work_type_coverage,
    });

    // 期待: 信頼度スコアが50%以下（この場合 42.5%）で警告が付与される
    expect(result.confidence_score).toBeLessThanOrEqual(50);
    expect(result.warning_enabled).toBe(true);
    expect(result.warning_message).toBeDefined();
    expect(result.warning_message).toMatch(/信頼度が低い/);
    expect(result.warning_message).toMatch(/データ追加/);

    // 警告情報の構成要素を検証
    expect(result.warning_info).toBeDefined();
    expect(result.warning_info.confidence_score).toBe(
      result.confidence_score
    );
    expect(result.warning_info.low_confidence_reason).toBeDefined();
    expect(result.warning_info.low_confidence_reason.length).toBeGreaterThan(0);
    expect(result.warning_info.recommended_actions).toBeDefined();
    expect(result.warning_info.recommended_actions.length).toBeGreaterThan(0);

    // 予測結果も計算されていることを確認（警告と並行して出力される）
    expect(result.forecast_busy_level).toBeDefined();
    expect(result.required_staff_count).toBeGreaterThan(0);
  });

  test("SCEN-958: 信頼度スコアが50%を超える場合、警告が表示されない", () => {
    // 入力データ: 過去3ヶ月の査定件数（十分なデータ）
    const historical_months = [
      { month: "2024-10", estimate_count: 180, confidence_base: 0.9 },
      { month: "2024-11", estimate_count: 200, confidence_base: 0.88 },
      { month: "2024-12", estimate_count: 190, confidence_base: 0.85 },
    ];

    // 季節要因: 1月は繁忙期（係数 1.2）、十分なデータがある
    const seasonal_factor = 1.2;
    const seasonal_data_count = 12;

    // 特殊要因: なし
    const special_factors: object[] = [];

    // 地域別・工種別カバー率: 十分（高信頼度）
    const regional_coverage = 0.85;
    const work_type_coverage = 0.8;

    // 実行
    const result = calculateMonthlyForecastConfidence({
      historical_months,
      seasonal_factor,
      seasonal_data_count,
      special_factors,
      regional_coverage,
      work_type_coverage,
    });

    // 期待: 信頼度スコアが50%超で警告なし
    expect(result.confidence_score).toBeGreaterThan(50);
    expect(result.warning_enabled).toBe(false);
    expect(result.warning_message).toBeNull();
    expect(result.warning_info).toBeNull();

    // 予測結果は正常に出力される
    expect(result.forecast_busy_level).toBeDefined();
    expect(result.required_staff_count).toBeGreaterThan(0);
  });

  test("SCEN-958: 信頼度スコアが厳密に50%の境界値で警告が表示される", () => {
    // 入力データ: 過去3ヶ月の査定件数
    const historical_months = [
      { month: "2024-10", estimate_count: 150, confidence_base: 0.75 },
      { month: "2024-11", estimate_count: 180, confidence_base: 0.75 },
      { month: "2024-12", estimate_count: 160, confidence_base: 0.75 },
    ];

    // 季節要因・地域カバー・工種カバーを調整して信頼度 = 50.0%を達成
    const seasonal_factor = 1.15;
    const seasonal_data_count = 4;

    const special_factors: object[] = [];

    const regional_coverage = 0.6;
    const work_type_coverage = 0.55;

    // 実行
    const result = calculateMonthlyForecastConfidence({
      historical_months,
      seasonal_factor,
      seasonal_data_count,
      special_factors,
      regional_coverage,
      work_type_coverage,
    });

    // 期待: 信頼度スコア = 50.0%の場合、警告が表示される（50%以下の定義）
    expect(result.confidence_score).toBe(50);
    expect(result.warning_enabled).toBe(true);
    expect(result.warning_message).toBeDefined();
    expect(result.warning_message).toMatch(/信頼度が低い/);

    // 低信頼の理由が複数含まれることを検証
    expect(result.warning_info.low_confidence_reason).toContainEqual(
      expect.stringMatching(/地域別|工種別|季節/)
    );

    // 推奨アクションが具体的に提示される
    expect(result.warning_info.recommended_actions).toContainEqual(
      expect.stringMatching(/データ追加|手動調整/)
    );
  });

  test("SCEN-958: 信頼度が49.9%の場合、警告が表示される", () => {
    // 入力データ: 信頼度をわずかに50%未満に設定
    const historical_months = [
      { month: "2024-10", estimate_count: 140, confidence_base: 0.7 },
      { month: "2024-11", estimate_count: 170, confidence_base: 0.7 },
      { month: "2024-12", estimate_count: 155, confidence_base: 0.7 },
    ];

    const seasonal_factor = 1.1;
    const seasonal_data_count = 3;

    const special_factors: object[] = [];

    const regional_coverage = 0.55;
    const work_type_coverage = 0.5;

    // 実行
    const result = calculateMonthlyForecastConfidence({
      historical_months,
      seasonal_factor,
      seasonal_data_count,
      special_factors,
      regional_coverage,
      work_type_coverage,
    });

    // 期待: 信頼度 < 50%で警告が表示される
    expect(result.confidence_score).toBeLessThan(50);
    expect(result.warning_enabled).toBe(true);
    expect(result.warning_message).toMatch(/信頼度が低い/);
  });

  test("SCEN-958: 信頼度が50.1%の場合、警告は表示されない", () => {
    // 入力データ: 信頼度をわずかに50%超に設定
    const historical_months = [
      { month: "2024-10", estimate_count: 165, confidence_base: 0.8 },
      { month: "2024-11", estimate_count: 190, confidence_base: 0.8 },
      { month: "2024-12", estimate_count: 175, confidence_base: 0.8 },
    ];

    const seasonal_factor = 1.18;
    const seasonal_data_count = 8;

    const special_factors: object[] = [];

    const regional_coverage = 0.65;
    const work_type_coverage = 0.62;

    // 実行
    const result = calculateMonthlyForecastConfidence({
      historical_months,
      seasonal_factor,
      seasonal_data_count,
      special_factors,
      regional_coverage,
      work_type_coverage,
    });

    // 期待: 信頼度 > 50%で警告なし
    expect(result.confidence_score).toBeGreaterThan(50);
    expect(result.warning_enabled).toBe(false);
    expect(result.warning_message).toBeNull();
  });

  test("SCEN-958: 警告情報に信頼度スコアが正確に含まれる", () => {
    const historical_months = [
      { month: "2024-10", estimate_count: 120, confidence_base: 0.65 },
      { month: "2024-11", estimate_count: 140, confidence_base: 0.65 },
      { month: "2024-12", estimate_count: 130, confidence_base: 0.65 },
    ];

    const seasonal_factor = 1.05;
    const seasonal_data_count = 1;

    const special_factors: object[] = [];

    const regional_coverage = 0.35;
    const work_type_coverage = 0.3;

    // 実行
    const result = calculateMonthlyForecastConfidence({
      historical_months,
      seasonal_factor,
      seasonal_data_count,
      special_factors,
      regional_coverage,
      work_type_coverage,
    });

    // 期待: 警告情報に正確な信頼度スコアが含まれる
    expect(result.warning_enabled).toBe(true);
    expect(result.warning_info.confidence_score).toBe(
      result.confidence_score
    );
    expect(typeof result.warning_info.confidence_score).toBe("number");
    expect(result.warning_info.confidence_score).toBeLessThanOrEqual(50);
  });

  test("SCEN-958: 低信頼度の理由が複数含まれる場合がある", () => {
    // 複数の要因で信頼度が低い状況
    const historical_months = [
      { month: "2024-10", estimate_count: 100, confidence_base: 0.6 },
      { month: "2024-11", estimate_count: 110, confidence_base: 0.6 },
      { month: "2024-12", estimate_count: 105, confidence_base: 0.6 },
    ];

    const seasonal_factor = 1.0;
    const seasonal_data_count = 1;

    const special_factors: object[] = [];

    const regional_coverage = 0.3;
    const work_type_coverage = 0.25;

    // 実行
    const result = calculateMonthlyForecastConfidence({
      historical_months,
      seasonal_factor,
      seasonal_data_count,
      special_factors,
      regional_coverage,
      work_type_coverage,
    });

    // 期待: 複数の低信頼要因が記録される
    expect(result.warning_enabled).toBe(true);
    expect(result.warning_info.low_confidence_reason.length).toBeGreaterThanOrEqual(
      2
    );
    expect(
      result.warning_info.low_confidence_reason.some(
        (r: string) =>
          r.includes("季節データ") ||
          r.includes("地域別") ||
          r.includes("工種別")
      )
    ).toBe(true);
  });

  test("SCEN-958: 推奨アクションが低信頼度の理由に応じて提示される", () => {
    const historical_months = [
      { month: "2024-10", estimate_count: 110, confidence_base: 0.65 },
      { month: "2024-11", estimate_count: 130, confidence_base: 0.65 },
      { month: "2024-12", estimate_count: 120, confidence_base: 0.65 },
    ];

    const seasonal_factor = 1.08;
    const seasonal_data_count = 2;

    const special_factors: object[] = [];

    const regional_coverage = 0.4;
    const work_type_coverage = 0.38;

    // 実行
    const result = calculateMonthlyForecastConfidence({
      historical_months,
      seasonal_factor,
      seasonal_data_count,
      special_factors,
      regional_coverage,
      work_type_coverage,
    });

    // 期待: 推奨アクションが提示される
    expect(result.warning_enabled).toBe(true);
    expect(result.warning_info.recommended_actions.length).toBeGreaterThanOrEqual(
      1
    );
    expect(
      result.warning_info.recommended_actions.some(
        (action: string) =>
          action.includes("データ追加") ||
          action.includes("手動調整") ||
          action.includes("確認")
      )
    ).toBe(true);
  });

  test("SCEN-958: 予測結果（繁忙度・必要人員数）は信頼度に関わらず出力される", () => {
    // 低信頼度のシナリオ
    const historical_months_low = [
      { month: "2024-10", estimate_count: 100, confidence_base: 0.5 },
      { month: "2024-11", estimate_count: 105, confidence_base: 0.5 },
      { month: "2024-12", estimate_count: 102, confidence_base: 0.5 },
    ];

    // 高信頼度のシナリオ
    const historical_months_high = [
      { month: "2024-10", estimate_count: 180, confidence_base: 0.9 },
      { month: "2024-11", estimate_count: 195, confidence_base: 0.9 },
      { month: "2024-12", estimate_count: 185, confidence_base: 0.9 },
    ];

    // 低信頼度実行
    const result_low = calculateMonthlyForecastConfidence({
      historical_months: historical_months_low,
      seasonal_factor: 1.0,
      seasonal_data_count: 1,
      special_factors: [],
      regional_coverage: 0.25,
      work_type_coverage: 0.2,
    });

    // 高信頼度実行
    const result_high = calculateMonthlyForecastConfidence({
      historical_months: historical_months_high,
      seasonal_factor: 1.2,
      seasonal_data_count: 12,
      special_factors: [],
      regional_coverage: 0.9,
      work_type_coverage: 0.88,
    });

    // 期待: 両方とも予測結果が出力される
    expect(result_low.forecast_busy_level).toBeDefined();
    expect(result_low.required_staff_count).toBeGreaterThan(0);
    expect(result_low.warning_enabled).toBe(true);

    expect(result_high.forecast_busy_level).toBeDefined();
    expect(result_high.required_staff_count).toBeGreaterThan(0);
    expect(result_high.warning_enabled).toBe(false);

    // 高信頼度の方が必要人員数が多い傾向（より正確な予測）
    expect(result_high.required_staff_count).toBeGreaterThan(0);
    expect(result_low.required_staff_count).toBeGreaterThan(0);
  });
});