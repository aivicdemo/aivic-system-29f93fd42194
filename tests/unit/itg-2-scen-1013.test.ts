import { generateExplanationDocument } from "../../src/logic/it-1-br-2-2-2-1";

describe("査定員ごとの判定結果と根拠の月次集計・分析ダッシュボード", () => {
  // SCEN-1013: [edge] 説明資料の自動生成機能 - テンプレート内の可変データ領域が0件の場合に正常に生成される
  test("可変データ領域が0件のテンプレートで説明資料が正常に生成される", () => {
    const assessment_id = "ASS-202401-0001";
    const assessment_item = "鉄筋コンクリート造建物解体";
    const template_id = "TPL-EMPTY-001";
    const variable_data_count = 0;
    const mandatory_fields = {
      assessment_id: assessment_id,
      assessment_item: assessment_item,
      market_deviation_rate: 8.5,
      market_deviation_amount: 425000,
      reference_data_count: 0,
      price_book_source: "建設物価2024年1月号",
      adjustment_coefficient: 1.0,
      assessment_date: "2024-01-15",
      assessor_name: "査定員A",
    };

    const result = generateExplanationDocument({
      assessment_id: assessment_id,
      assessment_item: assessment_item,
      template_id: template_id,
      variable_data: [],
      mandatory_fields: mandatory_fields,
      output_format: "PDF",
    });

    expect(result).toBeDefined();
    expect(result.status).toBe("success");
    expect(result.file_format).toBe("PDF");
    expect(result.file_generated).toBe(true);
    expect(result.variable_data_area_status).toBe("empty");
    expect(result.mandatory_fields_included).toBe(true);
    expect(result.error_count).toBe(0);
    expect(result.warning_count).toBe(0);
    expect(result.assessment_id_in_output).toBe(assessment_id);
    expect(result.assessment_item_in_output).toBe(assessment_item);
    expect(result.market_deviation_rate_in_output).toBe(8.5);
    expect(result.market_deviation_amount_in_output).toBe(425000);
    expect(result.file_size_bytes).toBeGreaterThan(0);
    expect(result.generation_timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});