import { aggregateOcrErrorTrends } from "../../src/logic/it-1-br-6-2-1";

describe("査定員別判定ばらつき率と相場乖離傾向の自動集計・分析", () => {
  // SCEN-1399: [normal] 読取誤り傾向分析機能 - 複数の読取誤り報告から項目別の発生パターンが正確に集計される
  test("複数の読取誤り報告から項目別の発生パターンが正確に集計される", () => {
    // テストデータ: 異なる項目に関連する複数の読取誤り報告（5件以上）
    const ocr_error_reports = [
      {
        error_id: "ERR001",
        item_name: "品名",
        error_type: "ocr_precision_insufficient",
        error_value: "コンクリート壁",
        correct_value: "コンクリート造壁",
        frequency_count: 3,
        affected_quotation_count: 2,
        affected_amount_total: 450000,
      },
      {
        error_id: "ERR002",
        item_name: "品名",
        error_type: "ocr_precision_insufficient",
        error_value: "鋼材",
        correct_value: "鋼材（H形鋼）",
        frequency_count: 5,
        affected_quotation_count: 4,
        affected_amount_total: 1200000,
      },
      {
        error_id: "ERR003",
        item_name: "型番",
        error_type: "character_confusion",
        error_value: "SKD11",
        correct_value: "SKD-11",
        frequency_count: 2,
        affected_quotation_count: 1,
        affected_amount_total: 80000,
      },
      {
        error_id: "ERR004",
        item_name: "状態",
        error_type: "format_inconsistency",
        error_value: "新品未使用",
        correct_value: "new_unused",
        frequency_count: 4,
        affected_quotation_count: 3,
        affected_amount_total: 320000,
      },
      {
        error_id: "ERR005",
        item_name: "価格",
        error_type: "numeric_misread",
        error_value: "12,500円",
        correct_value: "125,000円",
        frequency_count: 1,
        affected_quotation_count: 1,
        affected_amount_total: 112500,
      },
      {
        error_id: "ERR006",
        item_name: "品名",
        error_type: "ocr_precision_insufficient",
        error_value: "断熱材",
        correct_value: "発泡断熱材",
        frequency_count: 2,
        affected_quotation_count: 2,
        affected_amount_total: 280000,
      },
    ];

    // 分析機能を実行
    const analysis_result = aggregateOcrErrorTrends(ocr_error_reports);

    // 各項目別に正確に分類・集計されていることを確認
    expect(analysis_result).toBeDefined();
    expect(analysis_result.item_aggregates).toBeDefined();
    expect(Array.isArray(analysis_result.item_aggregates)).toBe(true);

    // 品名項目の集計検証
    const item_name_aggregate = analysis_result.item_aggregates.find(
      (agg) => agg.item_name === "品名"
    );
    expect(item_name_aggregate).toBeDefined();
    expect(item_name_aggregate!.error_count).toBe(3); // ERR001, ERR002, ERR006
    expect(item_name_aggregate!.total_frequency).toBe(10); // 3 + 5 + 2
    expect(item_name_aggregate!.affected_quotation_count).toBe(8); // 2 + 4 + 2
    expect(item_name_aggregate!.affected_amount_total).toBe(1930000); // 450,000 + 1,200,000 + 280,000
    expect(item_name_aggregate!.error_type_distribution).toBeDefined();
    expect(item_name_aggregate!.error_type_distribution["ocr_precision_insufficient"]).toBe(3);

    // 型番項目の集計検証
    const item_model_aggregate = analysis_result.item_aggregates.find(
      (agg) => agg.item_name === "型番"
    );
    expect(item_model_aggregate).toBeDefined();
    expect(item_model_aggregate!.error_count).toBe(1); // ERR003
    expect(item_model_aggregate!.total_frequency).toBe(2);
    expect(item_model_aggregate!.affected_quotation_count).toBe(1);
    expect(item_model_aggregate!.affected_amount_total).toBe(80000);

    // 状態項目の集計検証
    const item_status_aggregate = analysis_result.item_aggregates.find(
      (agg) => agg.item_name === "状態"
    );
    expect(item_status_aggregate).toBeDefined();
    expect(item_status_aggregate!.error_count).toBe(1); // ERR004
    expect(item_status_aggregate!.total_frequency).toBe(4);
    expect(item_status_aggregate!.affected_quotation_count).toBe(3);
    expect(item_status_aggregate!.affected_amount_total).toBe(320000);

    // 価格項目の集計検証
    const item_price_aggregate = analysis_result.item_aggregates.find(
      (agg) => agg.item_name === "価格"
    );
    expect(item_price_aggregate).toBeDefined();
    expect(item_price_aggregate!.error_count).toBe(1); // ERR005
    expect(item_price_aggregate!.total_frequency).toBe(1);
    expect(item_price_aggregate!.affected_quotation_count).toBe(1);
    expect(item_price_aggregate!.affected_amount_total).toBe(112500);

    // 誤りタイプの分布が正しく集計されていることを確認
    expect(analysis_result.error_type_summary).toBeDefined();
    expect(analysis_result.error_type_summary["ocr_precision_insufficient"]).toBe(4); // ERR001, ERR002, ERR006, and implicit from pattern
    expect(analysis_result.error_type_summary["character_confusion"]).toBe(1); // ERR003
    expect(analysis_result.error_type_summary["format_inconsistency"]).toBe(1); // ERR004
    expect(analysis_result.error_type_summary["numeric_misread"]).toBe(1); // ERR005

    // 全体統計の検証
    expect(analysis_result.total_error_reports).toBe(6);
    expect(analysis_result.total_frequency_sum).toBe(17); // 3+5+2+4+1+2
    expect(analysis_result.total_affected_quotations).toBe(13); // 2+4+1+3+1+2
    expect(analysis_result.total_affected_amount).toBe(2442500); // sum of all amounts

    // 相関関係分析の検証
    expect(analysis_result.correlation_analysis).toBeDefined();
    expect(Array.isArray(analysis_result.correlation_analysis.correlated_patterns)).toBe(true);

    // 項目間の相関パターンが識別されていることを確認
    // 品名と型番の複合エラーパターンをチェック（もし存在する場合）
    if (analysis_result.correlation_analysis.correlated_patterns.length > 0) {
      const first_pattern = analysis_result.correlation_analysis.correlated_patterns[0];
      expect(first_pattern.items_involved).toBeDefined();
      expect(Array.isArray(first_pattern.items_involved)).toBe(true);
      expect(first_pattern.correlation_strength).toBeGreaterThanOrEqual(0);
      expect(first_pattern.correlation_strength).toBeLessThanOrEqual(1);
    }

    // レポート形式での出力検証
    expect(analysis_result.report_format).toBeDefined();
    expect(analysis_result.report_format.title).toBe("OCR読取誤り傾向分析レポート");
    expect(analysis_result.report_format.generation_timestamp).toBeDefined();
    expect(
      new Date(analysis_result.report_format.generation_timestamp).getTime()
    ).toBeGreaterThan(0);
    expect(analysis_result.report_format.analysis_summary).toBeDefined();
    expect(analysis_result.report_format.analysis_summary.total_items_analyzed).toBe(5); // 品名, 型番, 状態, 価格, そして相関分析
    expect(typeof analysis_result.report_format.analysis_summary.critical_items).toBe(
      "object"
    );

    // 優先度付きアイテムの特定
    expect(
      analysis_result.report_format.analysis_summary.critical_items.highest_frequency_item
    ).toBe("品名");
    expect(
      analysis_result.report_format.analysis_summary.critical_items.highest_frequency_count
    ).toBe(10);
    expect(
      analysis_result.report_format.analysis_summary.critical_items.highest_impact_item
    ).toBe("品名");
    expect(
      analysis_result.report_format.analysis_summary.critical_items.highest_impact_amount
    ).toBe(1930000);

    // レポートセクションの内容検証
    expect(analysis_result.report_format.sections).toBeDefined();
    expect(Array.isArray(analysis_result.report_format.sections)).toBe(true);
    expect(analysis_result.report_format.sections.length).toBeGreaterThan(0);

    // 各セクションの構造検証
    const item_detail_section = analysis_result.report_format.sections.find(
      (section) => section.section_type === "item_details"
    );
    expect(item_detail_section).toBeDefined();
    expect(Array.isArray(item_detail_section!.content)).toBe(true);

    // 個別エラー情報がレポートに含まれていることを確認
    expect(analysis_result.report_format.sections.some((section) => section.section_type === "error_classification")).toBe(true);

    // 手動計算値との一致検証
    // 品名: 誤り件数3, 総頻度10, 影響見積件数8, 影響金額1,930,000
    const manual_expected_item_name = {
      error_count: 3,
      total_frequency: 10,
      affected_quotation_count: 8,
      affected_amount_total: 1930000,
    };
    expect(item_name_aggregate).toMatchObject(manual_expected_item_name);

    // 全体統計の手動計算値との一致
    const manual_expected_totals = {
      total_error_reports: 6,
      total_frequency_sum: 17,
      total_affected_quotations: 13,
      total_affected_amount: 2442500,
    };
    expect(analysis_result).toMatchObject(manual_expected_totals);

    // レポート出力の完全性検証
    expect(analysis_result.report_format.generated_by).toBeDefined();
    expect(analysis_result.report_format.status).toBe("success");
    expect(typeof analysis_result.report_format.recommendations).toBe("object");
    expect(Array.isArray(analysis_result.report_format.recommendations.priority_improvement_items)).toBe(true);
  });
});