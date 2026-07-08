import { generateImprovementResultReport } from "../../src/logic/it-6-2-1-1";

describe("改善結果レポート生成 - 根拠データ空の場合", () => {
  test("SCEN-1240: 根拠データが空である場合、レポート生成はエラーとなりエラーメッセージが表示される", () => {
    // Arrange: 根拠データが空の入力を準備
    const empty_basis_data = {
      report_id: "RPT-20240115-001",
      assessment_period_start: "2024-01-01",
      assessment_period_end: "2024-01-31",
      department_id: "DEPT-QA-001",
      basis_data: [],
      generated_timestamp: "2024-01-15T11:00:00Z",
      generated_by_user_id: "USER-AUDIT-001",
    };

    // Act & Assert: エラーがスローされることを確認
    expect(() =>
      generateImprovementResultReport(empty_basis_data)
    ).toThrow(/根拠データ/);
  });

  test("SCEN-1240: 根拠データが null である場合、レポート生成はエラーとなりエラーメッセージが表示される", () => {
    // Arrange: 根拠データが null の入力を準備
    const null_basis_data = {
      report_id: "RPT-20240115-002",
      assessment_period_start: "2024-01-01",
      assessment_period_end: "2024-01-31",
      department_id: "DEPT-QA-001",
      basis_data: null as any,
      generated_timestamp: "2024-01-15T11:00:00Z",
      generated_by_user_id: "USER-AUDIT-001",
    };

    // Act & Assert: エラーがスローされることを確認
    expect(() =>
      generateImprovementResultReport(null_basis_data)
    ).toThrow(/根拠データ/);
  });

  test("SCEN-1240: 根拠データが undefined である場合、レポート生成はエラーとなりエラーメッセージが表示される", () => {
    // Arrange: 根拠データが undefined の入力を準備
    const undefined_basis_data = {
      report_id: "RPT-20240115-003",
      assessment_period_start: "2024-01-01",
      assessment_period_end: "2024-01-31",
      department_id: "DEPT-QA-001",
      basis_data: undefined as any,
      generated_timestamp: "2024-01-15T11:00:00Z",
      generated_by_user_id: "USER-AUDIT-001",
    };

    // Act & Assert: エラーがスローされることを確認
    expect(() =>
      generateImprovementResultReport(undefined_basis_data)
    ).toThrow(/根拠データ/);
  });

  test("SCEN-1240: 根拠データが正常に存在する場合、レポートが正常に生成される", () => {
    // Arrange: 根拠データが正常に存在する入力を準備
    const valid_basis_data = {
      report_id: "RPT-20240115-004",
      assessment_period_start: "2024-01-01",
      assessment_period_end: "2024-01-31",
      department_id: "DEPT-QA-001",
      basis_data: [
        {
          assessor_id: "ASSESSOR-001",
          trade_type_code: "001",
          price_band_code: "MID",
          improvement_rate_pct: 8.5,
          accuracy_before: 78,
          accuracy_after: 86.5,
        },
        {
          assessor_id: "ASSESSOR-002",
          trade_type_code: "002",
          price_band_code: "HIGH",
          improvement_rate_pct: 12.3,
          accuracy_before: 72,
          accuracy_after: 84.3,
        },
      ],
      generated_timestamp: "2024-01-15T11:00:00Z",
      generated_by_user_id: "USER-AUDIT-001",
    };

    // Act: レポート生成を実行
    const result = generateImprovementResultReport(valid_basis_data);

    // Assert: レポートが正常に生成されることを確認
    expect(result).toEqual({
      report_id: "RPT-20240115-004",
      status: "生成完了",
      assessment_period_start: "2024-01-01",
      assessment_period_end: "2024-01-31",
      department_id: "DEPT-QA-001",
      total_assessor_count: 2,
      average_improvement_rate_pct: 10.4,
      aggregated_metrics: [
        {
          assessor_id: "ASSESSOR-001",
          trade_type_code: "001",
          price_band_code: "MID",
          improvement_rate_pct: 8.5,
          accuracy_before: 78,
          accuracy_after: 86.5,
        },
        {
          assessor_id: "ASSESSOR-002",
          trade_type_code: "002",
          price_band_code: "HIGH",
          improvement_rate_pct: 12.3,
          accuracy_before: 72,
          accuracy_after: 84.3,
        },
      ],
      generated_timestamp: "2024-01-15T11:00:00Z",
      generated_by_user_id: "USER-AUDIT-001",
    });
  });
});