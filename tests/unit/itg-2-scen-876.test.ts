import { generateExplanationMaterial } from "../../src/logic/it-6-2-2-1";

describe("判定根拠統合・説明資料自動生成機能", () => {
  // SCEN-876
  test("相場乖離率・乖離額・参照データ・補正係数を全て含める説明資料が生成される", () => {
    const assessmentData = {
      quotation_id: "Q20240115001",
      deviation_rate: 12.5,
      deviation_amount: 125000,
      reference_data_count: 42,
      reference_data_details: [
        {
          past_project_id: "P20231201001",
          region: "東京都",
          work_type: "鉄骨工事",
          reference_date: "2023-12-01",
          reference_amount: 1000000,
        },
        {
          past_project_id: "P20231215002",
          region: "東京都",
          work_type: "鉄骨工事",
          reference_date: "2023-12-15",
          reference_amount: 1025000,
        },
      ],
      adjustment_coefficient: 1.08,
      adjustment_reason: "地域別・季節別補正",
      material_price_index: "2024年1月版物価本",
      material_price_index_date: "2024-01-01",
      assessor_name: "田中太郎",
      assessment_date: "2024-01-15T10:30:00Z",
      judgment_logic_applied: "相場判定ロジック_v2",
    };

    const result = generateExplanationMaterial(assessmentData);

    expect(result).toBeDefined();
    expect(result.material_id).toBeDefined();
    expect(result.material_id).toMatch(/^MAT_/);

    expect(result.content.deviation_rate).toBe(12.5);
    expect(result.content.deviation_amount).toBe(125000);
    expect(result.content.reference_data_count).toBe(42);

    expect(result.content.reference_data_details).toEqual([
      {
        past_project_id: "P20231201001",
        region: "東京都",
        work_type: "鉄骨工事",
        reference_date: "2023-12-01",
        reference_amount: 1000000,
      },
      {
        past_project_id: "P20231215002",
        region: "東京都",
        work_type: "鉄骨工事",
        reference_date: "2023-12-15",
        reference_amount: 1025000,
      },
    ]);

    expect(result.content.adjustment_coefficient).toBe(1.08);
    expect(result.content.adjustment_reason).toBe("地域別・季節別補正");

    expect(result.content.material_price_index).toBe("2024年1月版物価本");
    expect(result.content.material_price_index_date).toBe("2024-01-01");

    expect(result.content.assessor_name).toBe("田中太郎");
    expect(result.content.assessment_date).toBe("2024-01-15T10:30:00Z");
    expect(result.content.judgment_logic_applied).toBe("相場判定ロジック_v2");

    expect(result.format).toBe("PDF");
    expect(result.layout_validated).toBe(true);

    expect(result.sections).toEqual([
      "deviation_summary",
      "reference_data",
      "adjustment_details",
      "material_price_basis",
      "judgment_basis",
    ]);

    expect(result.generated_at).toBeDefined();
    expect(result.generated_at).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );

    expect(result.quotation_id).toBe("Q20240115001");
    expect(result.status).toBe("completed");
  });
});