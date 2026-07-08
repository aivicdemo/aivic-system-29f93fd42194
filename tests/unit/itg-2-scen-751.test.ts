import { generateExplanationDocument } from "../../src/logic/it-1-br-2-2-2-1";

describe("査定員ごとの判定結果と根拠の月次集計・分析ダッシュボード", () => {
  // SCEN-751
  test("説明資料自動生成機能 - 判定根拠が複数存在するとき全て説明資料に含まれる", () => {
    const assessment_case_id = "ASSESS-20240115-001";
    const judgment_bases = [
      {
        base_id: "BASE-001",
        base_type: "past_project",
        reference_count: 15,
        region: "東京都",
        construction_type: "内装工事",
        base_amount: 850000,
        deviation_rate: 5.2,
      },
      {
        base_id: "BASE-002",
        base_type: "price_list",
        reference_source: "2024年1月物価本",
        base_amount: 820000,
        deviation_rate: 2.1,
      },
      {
        base_id: "BASE-003",
        base_type: "market_data",
        region: "神奈川県",
        period: "2023年Q4",
        base_amount: 880000,
        deviation_rate: 8.7,
      },
      {
        base_id: "BASE-004",
        base_type: "seasonal_adjustment",
        adjustment_factor: 0.96,
        base_amount: 835200,
        deviation_rate: 3.5,
      },
    ];
    const generated_at = "2024-01-15T14:30:00Z";
    const generated_by = "assessor_user_001";

    const result = generateExplanationDocument({
      assessment_case_id,
      judgment_bases,
      generated_at,
      generated_by,
    });

    expect(result).toEqual(
      expect.objectContaining({
        document_id: expect.any(String),
        assessment_case_id: "ASSESS-20240115-001",
        document_title: expect.any(String),
        content: expect.any(String),
        judgment_bases_count: 4,
        included_base_ids: [
          "BASE-001",
          "BASE-002",
          "BASE-003",
          "BASE-004",
        ],
        status: "generated",
        generated_at: "2024-01-15T14:30:00Z",
        generated_by: "assessor_user_001",
      })
    );

    expect(result.judgment_bases_count).toBe(4);
    expect(result.included_base_ids.length).toBe(4);
    expect(result.included_base_ids).toEqual([
      "BASE-001",
      "BASE-002",
      "BASE-003",
      "BASE-004",
    ]);

    expect(result.content).toContain("東京都");
    expect(result.content).toContain("内装工事");
    expect(result.content).toContain("15");
    expect(result.content).toContain("5.2");

    expect(result.content).toContain("2024年1月物価本");
    expect(result.content).toContain("2.1");

    expect(result.content).toContain("神奈川県");
    expect(result.content).toContain("2023年Q4");
    expect(result.content).toContain("8.7");

    expect(result.content).toContain("0.96");
    expect(result.content).toContain("3.5");

    expect(result.status).toBe("generated");
  });
});