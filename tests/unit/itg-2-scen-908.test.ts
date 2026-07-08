import { cleanAndUnifyDataset } from "../../src/logic/it-6-2-1-1";

describe("査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  test("SCEN-908: 学習データクリーニング・外れ値除外 - 欠損値を補完して統一形式のデータセットを生成する", () => {
    // 【テストデータ準備】複数の欠損値を含む査定データセット
    const rawDataset = [
      {
        project_id: "PRJ001",
        construction_type: "建築",
        price_band: "1000-5000",
        assessed_price: 3500,
        market_price: null, // 欠損値：平均値補完対象
        deviation_rate: 5.2,
        quantity: 100,
        unit_price: 35,
        assessor_id: "A001",
        assessment_date: "2024-01-15",
        region: "東京",
      },
      {
        project_id: "PRJ002",
        construction_type: "土木",
        price_band: "5000-10000",
        assessed_price: 7500,
        market_price: 7200,
        deviation_rate: null, // 欠損値：計算式補完対象
        quantity: 200,
        unit_price: null, // 欠損値：前方充填対象
        assessor_id: "A002",
        assessment_date: "2024-01-16",
        region: "大阪",
      },
      {
        project_id: "PRJ003",
        construction_type: "建築",
        price_band: "10000-50000",
        assessed_price: 25000,
        market_price: 24000,
        deviation_rate: 4.2,
        quantity: null, // 欠損値：後方充填対象
        unit_price: 100,
        assessor_id: "A001",
        assessment_date: "2024-01-17",
        region: "名古屋",
      },
      {
        project_id: "PRJ004",
        construction_type: "建築",
        price_band: "1000-5000",
        assessed_price: 4200,
        market_price: 4000,
        deviation_rate: 5.0,
        quantity: 150,
        unit_price: 28,
        assessor_id: "A003",
        assessment_date: "2024-01-18",
        region: "東京",
      },
    ];

    // 【補完ルール定義】
    const imputation_rules = {
      market_price: "mean", // 平均値補完
      deviation_rate: "formula", // (assessed_price - market_price) / market_price * 100
      unit_price: "forward_fill", // 前方充填
      quantity: "backward_fill", // 後方充填
    };

    // 【統一形式仕様】
    const unified_format = {
      assessed_price: { type: "number", min: 0, max: 999999 },
      market_price: { type: "number", min: 0, max: 999999 },
      deviation_rate: { type: "number", min: -100, max: 100 },
      quantity: { type: "number", min: 0, max: 999999 },
      unit_price: { type: "number", min: 0, max: 99999 },
    };

    // 【メイン処理】クリーニング・外れ値除外・統一形式データセット生成
    const result = cleanAndUnifyDataset({
      raw_data: rawDataset,
      imputation_rules: imputation_rules,
      unified_format: unified_format,
      outlier_threshold: 3, // 標準偏差の3倍を超える値を外れ値と判定
    });

    // ────────────────────────────────────────────────────
    // 【Assertion 1】すべての欠損値が補完されていることを確認
    // ────────────────────────────────────────────────────
    expect(result.cleaned_dataset.length).toBe(4);

    // PRJ001: market_price は平均値で補完される
    // 平均値 = (7200 + 24000 + 4000) / 3 = 11733.33
    const prj001_cleaned = result.cleaned_dataset.find(
      (d: any) => d.project_id === "PRJ001"
    );
    expect(prj001_cleaned).toBeDefined();
    expect(prj001_cleaned.market_price).toBeCloseTo(11733.33, 1);

    // PRJ002: deviation_rate は計算式で補完される
    // (7500 - 7200) / 7200 * 100 = 4.167
    const prj002_cleaned = result.cleaned_dataset.find(
      (d: any) => d.project_id === "PRJ002"
    );
    expect(prj002_cleaned).toBeDefined();
    expect(prj002_cleaned.deviation_rate).toBeCloseTo(4.167, 2);

    // PRJ002: unit_price は前方充填で補完される
    // 前のレコード（PRJ001）の unit_price = 35
    expect(prj002_cleaned.unit_price).toBe(35);

    // PRJ003: quantity は後方充填で補完される
    // 次のレコード（PRJ004）の quantity = 150
    const prj003_cleaned = result.cleaned_dataset.find(
      (d: any) => d.project_id === "PRJ003"
    );
    expect(prj003_cleaned).toBeDefined();
    expect(prj003_cleaned.quantity).toBe(150);

    // ────────────────────────────────────────────────────
    // 【Assertion 2】補完されたデータが統一形式に従っていることを確認
    // ────────────────────────────────────────────────────
    result.cleaned_dataset.forEach((record: any) => {
      // assessed_price: 型確認 + 値域確認
      expect(typeof record.assessed_price).toBe("number");
      expect(record.assessed_price).toBeGreaterThanOrEqual(0);
      expect(record.assessed_price).toBeLessThanOrEqual(999999);

      // market_price: 型確認 + 値域確認
      expect(typeof record.market_price).toBe("number");
      expect(record.market_price).toBeGreaterThanOrEqual(0);
      expect(record.market_price).toBeLessThanOrEqual(999999);

      // deviation_rate: 型確認 + 値域確認
      expect(typeof record.deviation_rate).toBe("number");
      expect(record.deviation_rate).toBeGreaterThanOrEqual(-100);
      expect(record.deviation_rate).toBeLessThanOrEqual(100);

      // quantity: 型確認 + 値域確認
      expect(typeof record.quantity).toBe("number");
      expect(record.quantity).toBeGreaterThanOrEqual(0);
      expect(record.quantity).toBeLessThanOrEqual(999999);

      // unit_price: 型確認 + 値域確認
      expect(typeof record.unit_price).toBe("number");
      expect(record.unit_price).toBeGreaterThanOrEqual(0);
      expect(record.unit_price).toBeLessThanOrEqual(99999);
    });

    // ────────────────────────────────────────────────────
    // 【Assertion 3】補完前後でデータの整合性が保たれていることを確認
    // ────────────────────────────────────────────────────
    const prj004_cleaned = result.cleaned_dataset.find(
      (d: any) => d.project_id === "PRJ004"
    );
    expect(prj004_cleaned).toBeDefined();
    expect(prj004_cleaned.assessed_price).toBe(4200);
    expect(prj004_cleaned.market_price).toBe(4000);
    expect(prj004_cleaned.deviation_rate).toBe(5.0);
    expect(prj004_cleaned.quantity).toBe(150);
    expect(prj004_cleaned.unit_price).toBe(28);

    // プロジェクトIDと日付は変更されていないことを確認
    expect(prj001_cleaned.project_id).toBe("PRJ001");
    expect(prj001_cleaned.assessment_date).toBe("2024-01-15");
    expect(prj002_cleaned.project_id).toBe("PRJ002");
    expect(prj002_cleaned.assessment_date).toBe("2024-01-16");

    // ────────────────────────────────────────────────────
    // 【Assertion 4】生成されたデータセットのエクスポート形式確認
    // ────────────────────────────────────────────────────
    expect(result.export_format).toBe("csv");
    expect(result.export_filename).toMatch(/cleaned_dataset_\d{8}\.csv/);
    expect(result.record_count).toBe(4);
    expect(result.imputed_field_count).toBe(5); // 5個のフィールドで補完が発生

    // ────────────────────────────────────────────────────
    // 【Assertion 5】統計的な異常がないことを確認（分布の確認）
    // ────────────────────────────────────────────────────
    expect(result.statistical_summary).toBeDefined();
    expect(result.statistical_summary.assessed_price_mean).toBeCloseTo(10050, 0);
    expect(result.statistical_summary.assessed_price_std).toBeCloseTo(9787.87, 1);

    // 外れ値フラグが設定されていないことを確認
    result.cleaned_dataset.forEach((record: any) => {
      expect(record.is_outlier).toBe(false);
    });

    // ────────────────────────────────────────────────────
    // 【Assertion 6】補完メタデータが正しく記録されていること
    // ────────────────────────────────────────────────────
    expect(result.imputation_log).toBeDefined();
    expect(result.imputation_log.length).toBeGreaterThan(0);

    const market_price_imputation = result.imputation_log.find(
      (log: any) => log.field_name === "market_price"
    );
    expect(market_price_imputation).toBeDefined();
    expect(market_price_imputation.method).toBe("mean");
    expect(market_price_imputation.imputed_count).toBe(1);
    expect(market_price_imputation.mean_value).toBeCloseTo(11733.33, 1);

    const deviation_rate_imputation = result.imputation_log.find(
      (log: any) => log.field_name === "deviation_rate"
    );
    expect(deviation_rate_imputation).toBeDefined();
    expect(deviation_rate_imputation.method).toBe("formula");
    expect(deviation_rate_imputation.imputed_count).toBe(1);

    const unit_price_imputation = result.imputation_log.find(
      (log: any) => log.field_name === "unit_price"
    );
    expect(unit_price_imputation).toBeDefined();
    expect(unit_price_imputation.method).toBe("forward_fill");
    expect(unit_price_imputation.imputed_count).toBe(1);

    const quantity_imputation = result.imputation_log.find(
      (log: any) => log.field_name === "quantity"
    );
    expect(quantity_imputation).toBeDefined();
    expect(quantity_imputation.method).toBe("backward_fill");
    expect(quantity_imputation.imputed_count).toBe(1);

    // ────────────────────────────────────────────────────
    // 【Assertion 7】クリーニング処理の完了状態確認
    // ────────────────────────────────────────────────────
    expect(result.status).toBe("completed");
    expect(result.is_ready_for_training).toBe(true);
    expect(result.quality_check_passed).toBe(true);
  });
});