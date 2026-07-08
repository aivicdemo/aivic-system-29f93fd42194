import { diagnoseLearningDataBias } from "../../src/logic/it-6-2-2-1";

describe("学習データ偏り診断機能", () => {
  // SCEN-1465: [normal] 学習データ偏り診断機能 - 学習データの偏り・季節変動対応不足・過去案件データ欠落を定量的に診断できる
  test("データ偏り、季節変動対応不足、過去案件データ欠落の3項目について定量的スコアを正確に計算・表示できる", () => {
    const learning_data_input = {
      past_cases: [
        {
          case_id: "case001",
          region: "tokyo",
          work_type: "concrete",
          month: 1,
          amount: 5000000,
        },
        {
          case_id: "case002",
          region: "tokyo",
          work_type: "concrete",
          month: 1,
          amount: 5100000,
        },
        {
          case_id: "case003",
          region: "tokyo",
          work_type: "concrete",
          month: 1,
          amount: 5200000,
        },
        {
          case_id: "case004",
          region: "tokyo",
          work_type: "concrete",
          month: 2,
          amount: 5300000,
        },
        {
          case_id: "case005",
          region: "osaka",
          work_type: "steel",
          month: 6,
          amount: 6000000,
        },
        {
          case_id: "case006",
          region: "osaka",
          work_type: "steel",
          month: 6,
          amount: 6100000,
        },
      ],
      price_book_items: [
        {
          item_id: "item001",
          region: "tokyo",
          work_type: "concrete",
          unit_price: 100000,
          effective_month: 1,
        },
        {
          item_id: "item002",
          region: "tokyo",
          work_type: "concrete",
          unit_price: 101000,
          effective_month: 2,
        },
        {
          item_id: "item003",
          region: "osaka",
          work_type: "steel",
          unit_price: 120000,
          effective_month: 6,
        },
      ],
    };

    const result = diagnoseLearningDataBias(learning_data_input);

    // 1. データ偏りスコアの検証 (0-100の数値)
    expect(result.data_bias_score).toBeGreaterThanOrEqual(0);
    expect(result.data_bias_score).toBeLessThanOrEqual(100);
    expect(typeof result.data_bias_score).toBe("number");

    // Tokyo/Concrete が過度に集中しているため、偏りスコアは高い (70以上)
    expect(result.data_bias_score).toBeGreaterThanOrEqual(70);

    // 2. 季節変動対応不足の定量的指標の検証
    expect(result.seasonal_coverage_rate).toBeGreaterThanOrEqual(0);
    expect(result.seasonal_coverage_rate).toBeLessThanOrEqual(100);
    expect(typeof result.seasonal_coverage_rate).toBe("number");

    // 過去案件に月1,2,6しかないため、カバー率は低い (33.33%)
    // 12ヶ月中3ヶ月のみ: 3/12 = 0.25, パーセント表示で 25% (33.33% は 4ヶ月以上に当たる)
    // 実際には 3/12 = 25%
    expect(result.seasonal_coverage_rate).toBeLessThanOrEqual(33);

    // 3. 過去案件データ欠落率の検証
    expect(result.missing_case_rate).toBeGreaterThanOrEqual(0);
    expect(result.missing_case_rate).toBeLessThanOrEqual(100);
    expect(typeof result.missing_case_rate).toBe("number");

    // 3アイテム中、有効な過去案件データが6件のうち全て対応
    // しかし、region/work_type/month の組み合わせで見ると不足
    expect(result.missing_case_rate).toBeGreaterThanOrEqual(40);

    // 4. 欠落件数の検証 (絶対値)
    expect(result.missing_case_count).toBeGreaterThanOrEqual(0);
    expect(typeof result.missing_case_count).toBe("number");

    // 期待: 各アイテム(3個)に対して複数地域月別組み合わせが期待されるが
    // Tokyo/Concrete は月1,2のみ(2ヶ月)、Osaka/Steel は月6のみ(1ヶ月)
    // 想定: 各アイテムに対して12ヶ月 × 1以上地域が必要
    // Tokyo/Concrete: 月1,2のみ → 10ヶ月欠落
    // Osaka/Steel: 月6のみ → 11ヶ月欠落
    // ざっくり計算: 3アイテム × (平均10ヶ月欠落) = 30件程度の欠落
    expect(result.missing_case_count).toBeGreaterThanOrEqual(20);

    // 5. 地域偏りスコアの検証
    expect(result.region_bias_score).toBeGreaterThanOrEqual(0);
    expect(result.region_bias_score).toBeLessThanOrEqual(100);
    expect(typeof result.region_bias_score).toBe("number");

    // Tokyo が 4/6 (67%), Osaka が 2/6 (33%)
    // 不均衡度: max(67, 33) が高いほど偏りスコアが高い
    expect(result.region_bias_score).toBeGreaterThanOrEqual(60);

    // 6. 工種偏りスコアの検証
    expect(result.work_type_bias_score).toBeGreaterThanOrEqual(0);
    expect(result.work_type_bias_score).toBeLessThanOrEqual(100);
    expect(typeof result.work_type_bias_score).toBe("number");

    // Concrete が 4/6 (67%), Steel が 2/6 (33%)
    // 工種の偏りスコアも高い
    expect(result.work_type_bias_score).toBeGreaterThanOrEqual(60);

    // 7. 総合診断スコア (各スコアの平均値)
    expect(result.overall_diagnosis_score).toBeGreaterThanOrEqual(0);
    expect(result.overall_diagnosis_score).toBeLessThanOrEqual(100);
    expect(typeof result.overall_diagnosis_score).toBe("number");

    // 各スコアが60-70程度なので、総合は65程度
    expect(result.overall_diagnosis_score).toBeGreaterThanOrEqual(50);
    expect(result.overall_diagnosis_score).toBeLessThanOrEqual(85);

    // 8. 診断結果の詳細レポート構造の検証
    expect(result.detail_report).toBeDefined();
    expect(typeof result.detail_report).toBe("object");

    // レポートには改善提案を含む
    expect(result.detail_report.recommendations).toBeDefined();
    expect(Array.isArray(result.detail_report.recommendations)).toBe(true);
    expect(result.detail_report.recommendations.length).toBeGreaterThan(0);

    // 改善提案の例: 季節データ、地域データ、工種データの追加指示
    const has_seasonal_recommendation = result.detail_report.recommendations.some(
      (rec: { type: string }) => rec.type === "季節変動",
    );
    expect(has_seasonal_recommendation).toBe(true);

    const has_region_recommendation = result.detail_report.recommendations.some(
      (rec: { type: string }) => rec.type === "地域偏り",
    );
    expect(has_region_recommendation).toBe(true);

    // 9. 欠落領域の特定結果の検証
    expect(result.detail_report.missing_segments).toBeDefined();
    expect(Array.isArray(result.detail_report.missing_segments)).toBe(true);
    expect(result.detail_report.missing_segments.length).toBeGreaterThan(0);

    // 例: Tokyo/Concrete の月3-12が欠落
    const has_tokyo_concrete_gap = result.detail_report.missing_segments.some(
      (seg: { region: string; work_type: string; missing_months: number[] }) =>
        seg.region === "tokyo" &&
        seg.work_type === "concrete" &&
        seg.missing_months.includes(3),
    );
    expect(has_tokyo_concrete_gap).toBe(true);

    // 10. 推奨アクション優先度の検証
    expect(result.detail_report.priority_actions).toBeDefined();
    expect(Array.isArray(result.detail_report.priority_actions)).toBe(true);
    expect(result.detail_report.priority_actions.length).toBeGreaterThan(0);

    // 優先度フィールドが存在し、数値であることを確認
    result.detail_report.priority_actions.forEach(
      (action: { priority_score: number }) => {
        expect(action.priority_score).toBeGreaterThanOrEqual(0);
        expect(action.priority_score).toBeLessThanOrEqual(100);
      },
    );

    // 11. レポート生成成功フラグ
    expect(result.report_generated).toBe(true);
    expect(typeof result.report_generated).toBe("boolean");

    // 12. タイムスタンプ (ISO 8601形式)
    expect(result.diagnosis_timestamp).toBeDefined();
    expect(typeof result.diagnosis_timestamp).toBe("string");
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(result.diagnosis_timestamp)).toBe(true);
  });

  // エラーケース: 空の学習データセット
  test("空の学習データセット入力時にエラーを出力", () => {
    const empty_input = {
      past_cases: [],
      price_book_items: [],
    };

    expect(() => diagnoseLearningDataBias(empty_input)).toThrow(/学習データ/);
  });

  // エラーケース: 過去案件データなし
  test("過去案件データなし時にエラーを出力", () => {
    const no_cases_input = {
      past_cases: [],
      price_book_items: [
        {
          item_id: "item001",
          region: "tokyo",
          work_type: "concrete",
          unit_price: 100000,
          effective_month: 1,
        },
      ],
    };

    expect(() => diagnoseLearningDataBias(no_cases_input)).toThrow(/過去案件/);
  });

  // エラーケース: 物価本データなし
  test("物価本データなし時にエラーを出力", () => {
    const no_price_book_input = {
      past_cases: [
        {
          case_id: "case001",
          region: "tokyo",
          work_type: "concrete",
          month: 1,
          amount: 5000000,
        },
      ],
      price_book_items: [],
    };

    expect(() => diagnoseLearningDataBias(no_price_book_input)).toThrow(/物価本/);
  });

  // 境界値テスト: 最小限の正常データ (1件)
  test("最小限の学習データセット (過去案件1件、物価本1件) で診断完了", () => {
    const minimal_input = {
      past_cases: [
        {
          case_id: "case001",
          region: "tokyo",
          work_type: "concrete",
          month: 1,
          amount: 5000000,
        },
      ],
      price_book_items: [
        {
          item_id: "item001",
          region: "tokyo",
          work_type: "concrete",
          unit_price: 100000,
          effective_month: 1,
        },
      ],
    };

    const result = diagnoseLearningDataBias(minimal_input);

    // 診断が成功し、スコアが計算される
    expect(result.data_bias_score).toBeGreaterThanOrEqual(0);
    expect(result.data_bias_score).toBeLessThanOrEqual(100);
    expect(result.report_generated).toBe(true);

    // 単一地域・単一工種なので、偏りスコアは高い (90以上)
    expect(result.region_bias_score).toBeGreaterThanOrEqual(90);
    expect(result.work_type_bias_score).toBeGreaterThanOrEqual(90);

    // 季節カバー率は低い (1/12 = 8.33%)
    expect(result.seasonal_coverage_rate).toBeLessThanOrEqual(10);
  });

  // 完全な学習データセット (全地域、全工種、全月対応)
  test("完全な学習データセット (全地域・全工種・全月対応) で診断結果が平衡的", () => {
    const complete_input = {
      past_cases: [
        // Tokyo/Concrete 各月
        ...Array.from({ length: 12 }, (_, i) => ({
          case_id: `tokyo_concrete_${i + 1}`,
          region: "tokyo",
          work_type: "concrete",
          month: i + 1,
          amount: 5000000 + i * 100000,
        })),
        // Osaka/Steel 各月
        ...Array.from({ length: 12 }, (_, i) => ({
          case_id: `osaka_steel_${i + 1}`,
          region: "osaka",
          work_type: "steel",
          month: i + 1,
          amount: 6000000 + i * 100000,
        })),
      ],
      price_book_items: [
        {
          item_id: "item001",
          region: "tokyo",
          work_type: "concrete",
          unit_price: 100000,
          effective_month: 1,
        },
        {
          item_id: "item002",
          region: "osaka",
          work_type: "steel",
          unit_price: 120000,
          effective_month: 1,
        },
      ],
    };

    const result = diagnoseLearningDataBias(complete_input);

    // 地域・工種が均衡しているため、偏りスコアは低い (30以下)
    expect(result.region_bias_score).toBeLessThanOrEqual(30);
    expect(result.work_type_bias_score).toBeLessThanOrEqual(30);

    // 季節カバー率は高い (全12ヶ月対応で100%)
    expect(result.seasonal_coverage_rate).toBe(100);

    // 欠落件数はゼロまたは最小
    expect(result.missing_case_count).toBeLessThanOrEqual(2);

    // 総合診断スコアは低い (20-40程度)
    expect(result.overall_diagnosis_score).toBeLessThanOrEqual(40);

    // 改善提案は最小限
    expect(result.detail_report.recommendations.length).toBeLessThanOrEqual(2);
  });
});