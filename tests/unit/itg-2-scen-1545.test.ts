import { generateOperationManual } from "../../src/logic/it-6-2-2-1";

describe("運用マニュアル初版自動生成機能", () => {
  test("SCEN-1545: 3ヶ月間の運用実績データから運用マニュアルが正しく生成される", () => {
    // テストデータ: 3ヶ月間の運用実績データ
    const operationalData = {
      period_start_date: "2024-01-01",
      period_end_date: "2024-03-31",
      ocr_processing_count: 1250,
      ocr_accuracy_rate: 94.8,
      ocr_min_accuracy_rate: 88.2,
      ocr_accuracy_threshold: 90.0,
      error_count: 18,
      error_patterns: [
        {
          error_type: "フォーマット_不一致",
          occurrence_count: 8,
          resolution_method: "手動確認後修正",
        },
        {
          error_type: "OCR読取_失敗",
          occurrence_count: 7,
          resolution_method: "画像品質改善",
        },
        {
          error_type: "判定ロジック_例外",
          occurrence_count: 3,
          resolution_method: "パラメータ調整",
        },
      ],
      judgment_logic_records: [
        {
          logic_id: "JL-001",
          rule_name: "相場乖離率判定",
          condition: "乖離率 > 15%",
          action: "要注意フラグ付与",
          application_count: 356,
        },
        {
          logic_id: "JL-002",
          rule_name: "単価補正係数適用",
          condition: "地域コード AND 時期コード",
          weighting: 0.92,
          application_count: 1089,
        },
        {
          logic_id: "JL-003",
          rule_name: "過去案件参照件数チェック",
          condition: "参照件数 < 5",
          action: "精度レベル低下",
          application_count: 127,
        },
      ],
      data_update_history: [
        {
          update_date: "2024-01-15",
          update_type: "物価本_新版反映",
          item_count: 234,
          version_number: "2024_Q1_v1",
        },
        {
          update_date: "2024-02-10",
          update_type: "過去案件データ_追加",
          item_count: 58,
          data_category: "冬季_北陸地域",
        },
        {
          update_date: "2024-03-22",
          update_type: "季節変動_反映",
          item_count: 112,
          seasonal_adjustment_rate: 1.05,
        },
      ],
      anomaly_response_records: [
        {
          anomaly_date: "2024-01-28",
          anomaly_type: "OCR精度_急低下",
          severity_level: "High",
          root_cause: "見積書フォーマット_変更",
          response_action: "学習データ再構成",
          resolution_date: "2024-02-01",
        },
        {
          anomaly_date: "2024-02-14",
          anomaly_type: "判定ロジック_不適合",
          severity_level: "Medium",
          root_cause: "地域別_補正係数_欠落",
          response_action: "補正係数データ_追加入力",
          resolution_date: "2024-02-15",
        },
        {
          anomaly_date: "2024-03-09",
          anomaly_type: "システム_稼働率低下",
          severity_level: "Medium",
          root_cause: "物価本データ_インポート_遅延",
          response_action: "スケジュール_前倒し",
          resolution_date: "2024-03-10",
        },
      ],
    };

    // 運用マニュアル自動生成関数を実行
    const generatedManual = generateOperationManual({
      operational_data: operationalData,
      generation_target_period: "過去3ヶ月間",
    });

    // 必須: マニュアル生成が成功したことを確認
    expect(generatedManual).toBeDefined();
    expect(generatedManual.document_id).toBeDefined();
    expect(generatedManual.generation_status).toBe("SUCCESS");
    expect(generatedManual.generated_date).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );

    // セクション1: OCR精度基準セクションの検証
    const ocr_accuracy_section = generatedManual.sections.find(
      (s) => s.section_id === "OCR_ACCURACY_STANDARD"
    );
    expect(ocr_accuracy_section).toBeDefined();
    expect(ocr_accuracy_section.section_title).toBe("OCR精度基準");
    expect(ocr_accuracy_section.content.average_accuracy_rate).toBe(94.8);
    expect(ocr_accuracy_section.content.minimum_accuracy_rate).toBe(88.2);
    expect(ocr_accuracy_section.content.required_threshold).toBe(90.0);
    expect(ocr_accuracy_section.content.total_processing_count).toBe(1250);
    expect(ocr_accuracy_section.content.period_covered).toBe(
      "2024-01-01 to 2024-03-31"
    );
    expect(ocr_accuracy_section.source_data_correlation).toEqual({
      metric_accuracy_average: "operationalData.ocr_accuracy_rate",
      metric_accuracy_minimum: "operationalData.ocr_min_accuracy_rate",
      metric_threshold: "operationalData.ocr_accuracy_threshold",
    });

    // セクション2: 判定ロジックセクションの検証
    const judgment_logic_section = generatedManual.sections.find(
      (s) => s.section_id === "JUDGMENT_LOGIC"
    );
    expect(judgment_logic_section).toBeDefined();
    expect(judgment_logic_section.section_title).toBe("判定ロジック");
    expect(judgment_logic_section.content.applied_rules).toHaveLength(3);

    // 判定ロジック詳細検証
    const rule_1 = judgment_logic_section.content.applied_rules.find(
      (r) => r.logic_id === "JL-001"
    );
    expect(rule_1).toBeDefined();
    expect(rule_1.rule_name).toBe("相場乖離率判定");
    expect(rule_1.condition_expression).toBe("乖離率 > 15%");
    expect(rule_1.execution_action).toBe("要注意フラグ付与");
    expect(rule_1.historical_application_count).toBe(356);

    const rule_2 = judgment_logic_section.content.applied_rules.find(
      (r) => r.logic_id === "JL-002"
    );
    expect(rule_2).toBeDefined();
    expect(rule_2.rule_name).toBe("単価補正係数適用");
    expect(rule_2.weighting_factor).toBe(0.92);
    expect(rule_2.historical_application_count).toBe(1089);

    const rule_3 = judgment_logic_section.content.applied_rules.find(
      (r) => r.logic_id === "JL-003"
    );
    expect(rule_3).toBeDefined();
    expect(rule_3.rule_name).toBe("過去案件参照件数チェック");
    expect(rule_3.condition_expression).toBe("参照件数 < 5");
    expect(rule_3.execution_action).toBe("精度レベル低下");

    expect(judgment_logic_section.source_data_correlation).toEqual({
      applied_rules: "operationalData.judgment_logic_records",
    });

    // セクション3: データ更新手順セクションの検証
    const data_update_section = generatedManual.sections.find(
      (s) => s.section_id === "DATA_UPDATE_PROCEDURE"
    );
    expect(data_update_section).toBeDefined();
    expect(data_update_section.section_title).toBe("データ更新手順");
    expect(data_update_section.content.update_frequency).toBe("月1回以上");
    expect(data_update_section.content.update_method_description).toBe(
      "システム管理画面からの自動インポート、または管理者の手動登録"
    );
    expect(data_update_section.content.required_administrator_role).toBe(
      "システム管理者"
    );
    expect(data_update_section.content.version_control_rule).toBe(
      "YYYY_Qn_vN形式で管理、過去3版を保持"
    );
    expect(data_update_section.content.historical_updates).toHaveLength(3);

    // 具体的な更新記録
    const update_1 = data_update_section.content.historical_updates.find(
      (u) => u.update_date === "2024-01-15"
    );
    expect(update_1).toBeDefined();
    expect(update_1.update_type).toBe("物価本_新版反映");
    expect(update_1.item_count).toBe(234);
    expect(update_1.version_identifier).toBe("2024_Q1_v1");

    const update_2 = data_update_section.content.historical_updates.find(
      (u) => u.update_date === "2024-02-10"
    );
    expect(update_2).toBeDefined();
    expect(update_2.update_type).toBe("過去案件データ_追加");
    expect(update_2.item_count).toBe(58);
    expect(update_2.data_category).toBe("冬季_北陸地域");

    expect(data_update_section.source_data_correlation).toEqual({
      update_records: "operationalData.data_update_history",
    });

    // セクション4: 異常対応フローセクションの検証
    const anomaly_response_section = generatedManual.sections.find(
      (s) => s.section_id === "ANOMALY_RESPONSE_FLOW"
    );
    expect(anomaly_response_section).toBeDefined();
    expect(anomaly_response_section.section_title).toBe("異常対応フロー");
    expect(anomaly_response_section.content.judgment_criteria).toEqual({
      severity_critical: "システム停止、全サービス利用不可",
      severity_high:
        "OCR精度低下(5%超)、判定ロジック全体不可、大規模データ不整合",
      severity_medium:
        "一部ロジック不適合、地域別偏り、軽微なデータ欠落",
    });
    expect(anomaly_response_section.content.execution_procedures).toHaveLength(
      3
    );

    // 異常対応記録の検証
    const procedure_1 = anomaly_response_section.content.execution_procedures.find(
      (p) => p.anomaly_date === "2024-01-28"
    );
    expect(procedure_1).toBeDefined();
    expect(procedure_1.anomaly_type).toBe("OCR精度_急低下");
    expect(procedure_1.severity_classification).toBe("High");
    expect(procedure_1.identified_root_cause).toBe(
      "見積書フォーマット_変更"
    );
    expect(procedure_1.response_action_taken).toBe("学習データ再構成");
    expect(procedure_1.resolution_date_actual).toBe("2024-02-01");
    expect(procedure_1.resolution_duration_days).toBe(4);

    const procedure_2 = anomaly_response_section.content.execution_procedures.find(
      (p) => p.anomaly_date === "2024-02-14"
    );
    expect(procedure_2).toBeDefined();
    expect(procedure_2.anomaly_type).toBe("判定ロジック_不適合");
    expect(procedure_2.severity_classification).toBe("Medium");
    expect(procedure_2.identified_root_cause).toBe(
      "地域別_補正係数_欠落"
    );
    expect(procedure_2.response_action_taken).toBe(
      "補正係数データ_追加入力"
    );
    expect(procedure_2.resolution_duration_days).toBe(1);

    const procedure_3 = anomaly_response_section.content.execution_procedures.find(
      (p) => p.anomaly_date === "2024-03-09"
    );
    expect(procedure_3).toBeDefined();
    expect(procedure_3.anomaly_type).toBe("システム_稼働率低下");
    expect(procedure_3.severity_classification).toBe("Medium");
    expect(procedure_3.identified_root_cause).toBe(
      "物価本データ_インポート_遅延"
    );

    expect(anomaly_response_section.source_data_correlation).toEqual({
      anomaly_records: "operationalData.anomaly_response_records",
    });

    // 全体的な整合性検証
    expect(generatedManual.sections).toHaveLength(4);
    expect(
      generatedManual.sections.map((s) => s.section_id)
    ).toEqual([
      "OCR_ACCURACY_STANDARD",
      "JUDGMENT_LOGIC",
      "DATA_UPDATE_PROCEDURE",
      "ANOMALY_RESPONSE_FLOW",
    ]);

    // マニュアルメタデータの検証
    expect(generatedManual.manual_metadata).toBeDefined();
    expect(generatedManual.manual_metadata.target_period_start).toBe(
      "2024-01-01"
    );
    expect(generatedManual.manual_metadata.target_period_end).toBe(
      "2024-03-31"
    );
    expect(generatedManual.manual_metadata.version_number).toBe("1.0");
    expect(generatedManual.manual_metadata.document_status).toBe(
      "DRAFT_GENERATED"
    );
    expect(generatedManual.manual_metadata.total_section_count).toBe(4);
    expect(generatedManual.manual_metadata.data_source_count).toBe(6);

    // 出力形式の検証
    expect(generatedManual.output_format).toBe("MARKDOWN");
    expect(generatedManual.exportable_formats).toEqual([
      "MARKDOWN",
      "PDF",
      "WORD",
    ]);
  });
});