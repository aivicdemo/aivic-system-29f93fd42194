import { generateExplanationMaterial } from "../../src/logic/it-6-3-1";

describe("査定判定ロジックの適用履歴と根拠の記録・検索機能", () => {
  test("SCEN-753: 査定結果説明資料の自動生成・配信機能 - 査定員が『査定結果をゼネコンに説明』ボタンクリック時に、相場乖離の数値・グラフと判定根拠を含む説明資料が生成される", () => {
    // 入力データの準備
    const assessment_case_id = "CASE-2024-001";
    const assessor_id = "ASSESSOR-100";
    const quotation_id = "QUOTE-2024-0542";
    const project_name = "○○建設工事一式";
    const contractor_name = "株式会社△△工務店";
    const quotation_amount = 5_000_000;
    const assessment_amount = 4_800_000;
    const divergence_amount = quotation_amount - assessment_amount;
    const divergence_rate = (divergence_amount / quotation_amount) * 100;
    const reference_data_count = 12;
    const reference_time_period = "2023年4月～2024年3月";
    const reference_region = "東京都";
    const construction_type = "建築工事";
    const assessment_date = "2024-06-15";
    const adjustment_factor = 1.05;
    const judgment_logic_id = "LOGIC-MARKET-001";
    const judgment_basis =
      "過去案件データ（12件）および物価本2024年版に基づき、東京都における類似工事の相場範囲との比較から判定。地域係数（1.05）を適用。";

    const input_params = {
      assessment_case_id,
      assessor_id,
      quotation_id,
      project_name,
      contractor_name,
      quotation_amount,
      assessment_amount,
      divergence_amount,
      divergence_rate,
      reference_data_count,
      reference_time_period,
      reference_region,
      construction_type,
      assessment_date,
      adjustment_factor,
      judgment_logic_id,
      judgment_basis,
    };

    // 関数実行
    const result = generateExplanationMaterial(input_params);

    // 出力形式の検証
    expect(result).toHaveProperty("material_id");
    expect(result).toHaveProperty("file_format");
    expect(result).toHaveProperty("file_path");
    expect(result).toHaveProperty("generation_timestamp");
    expect(result).toHaveProperty("material_content");

    // ファイル形式の検証
    expect(result.file_format).toMatch(/^(pdf|docx)$/);

    // 材料IDが適切に生成されていることを検証
    expect(result.material_id).toMatch(/^MAT-\d{4}-\d{8}$/);

    // 生成タイムスタンプが有効なISO形式であることを検証
    expect(new Date(result.generation_timestamp).toISOString()).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
    );

    // 材料内容の構造検証
    const content = result.material_content;
    expect(content).toHaveProperty("header_section");
    expect(content).toHaveProperty("divergence_analysis_section");
    expect(content).toHaveProperty("judgment_basis_section");
    expect(content).toHaveProperty("footer_section");

    // ヘッダーセクションの検証
    expect(content.header_section).toHaveProperty("project_title");
    expect(content.header_section).toHaveProperty("contractor_name");
    expect(content.header_section).toHaveProperty("assessment_date");
    expect(content.header_section.project_title).toBe(project_name);
    expect(content.header_section.contractor_name).toBe(contractor_name);
    expect(content.header_section.assessment_date).toBe(assessment_date);

    // 相場乖離分析セクションの数値検証
    const divergence_section = content.divergence_analysis_section;
    expect(divergence_section).toHaveProperty("quotation_amount_yen");
    expect(divergence_section).toHaveProperty("assessment_amount_yen");
    expect(divergence_section).toHaveProperty("divergence_amount_yen");
    expect(divergence_section).toHaveProperty("divergence_rate_percent");
    expect(divergence_section).toHaveProperty("graph_data");
    expect(divergence_section).toHaveProperty("reference_data_summary");

    // 相場乖離の具体値検証
    expect(divergence_section.quotation_amount_yen).toBe(5_000_000);
    expect(divergence_section.assessment_amount_yen).toBe(4_800_000);
    expect(divergence_section.divergence_amount_yen).toBe(200_000);
    expect(divergence_section.divergence_rate_percent).toBeCloseTo(4.0, 1);

    // グラフデータの検証
    expect(divergence_section.graph_data).toHaveProperty("chart_type");
    expect(divergence_section.graph_data).toHaveProperty("data_points");
    expect(divergence_section.graph_data).toHaveProperty("axis_labels");
    expect(divergence_section.graph_data.chart_type).toMatch(
      /^(bar|line|comparison)$/
    );
    expect(Array.isArray(divergence_section.graph_data.data_points)).toBe(true);
    expect(divergence_section.graph_data.data_points.length).toBeGreaterThan(0);

    // 参照データサマリーの検証
    const ref_summary = divergence_section.reference_data_summary;
    expect(ref_summary).toHaveProperty("reference_case_count");
    expect(ref_summary).toHaveProperty("reference_time_period");
    expect(ref_summary).toHaveProperty("reference_region");
    expect(ref_summary).toHaveProperty("construction_type");
    expect(ref_summary.reference_case_count).toBe(12);
    expect(ref_summary.reference_time_period).toBe("2023年4月～2024年3月");
    expect(ref_summary.reference_region).toBe("東京都");
    expect(ref_summary.construction_type).toBe("建築工事");

    // 判定根拠セクションの検証
    const judgment_section = content.judgment_basis_section;
    expect(judgment_section).toHaveProperty("logic_id");
    expect(judgment_section).toHaveProperty("basis_narrative");
    expect(judgment_section).toHaveProperty("adjustment_factor_applied");
    expect(judgment_section).toHaveProperty("key_findings");

    expect(judgment_section.logic_id).toBe(judgment_logic_id);
    expect(judgment_section.basis_narrative).toContain("過去案件データ");
    expect(judgment_section.basis_narrative).toContain("物価本");
    expect(judgment_section.adjustment_factor_applied).toBe(1.05);
    expect(Array.isArray(judgment_section.key_findings)).toBe(true);
    expect(judgment_section.key_findings.length).toBeGreaterThan(0);

    // フッターセクションの検証
    const footer = content.footer_section;
    expect(footer).toHaveProperty("confidential_mark");
    expect(footer).toHaveProperty("document_version");
    expect(footer).toHaveProperty("last_modified_date");

    // ファイルパスが生成されていることを検証
    expect(result.file_path).toMatch(/\/materials\/MAT-\d{4}-\d{8}\.(pdf|docx)$/);

    // 全体的な完全性検証：必須項目が揃っているか
    expect(result.material_id).toBeTruthy();
    expect(result.file_format).toBeTruthy();
    expect(result.file_path).toBeTruthy();
    expect(result.generation_timestamp).toBeTruthy();
    expect(result.material_content).toBeTruthy();

    // 相場乖離分析の数値が正しく計算されていることを検証
    expect(divergence_section.divergence_rate_percent).toBe(
      (divergence_amount / quotation_amount) * 100
    );

    // グラフが含まれていることを確認
    expect(divergence_section.graph_data.data_points).toContainEqual(
      expect.objectContaining({
        label: expect.stringContaining("見積"),
      })
    );
    expect(divergence_section.graph_data.data_points).toContainEqual(
      expect.objectContaining({
        label: expect.stringContaining("査定"),
      })
    );

    // ゼネコン向けフォーマットの確認：判定根拠が分かりやすく記載されている
    expect(judgment_section.basis_narrative).toContain(assessment_amount);
  });
});