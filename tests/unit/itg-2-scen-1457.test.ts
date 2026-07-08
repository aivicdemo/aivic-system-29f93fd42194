import { describe, test, expect, beforeEach } from "@jest/globals";
import {
  classifyDeviationPatterns,
} from "../../src/logic/it-1-br-2-2-2-1";

describe("査定員ごとの判定結果と根拠の月次集計・分析ダッシュボード", () => {
  // SCEN-1457: [edge] 乖離パターン自動分類・可視化機能 - 乖離率が0または非常に小さい領域は分類から除外される
  test("乖離率0.0および0.0001以下のデータは自動分類対象から除外される", () => {
    const assessment_data = [
      {
        assessment_id: "A001",
        assessor_id: "ASSESSOR_001",
        region: "Tokyo",
        construction_type: "Building",
        deviation_rate: 0.0,
        deviation_amount: 0,
        reference_data_count: 5,
        assessment_date: "2024-01-10T09:00:00Z",
      },
      {
        assessment_id: "A002",
        assessor_id: "ASSESSOR_001",
        region: "Tokyo",
        construction_type: "Building",
        deviation_rate: 0.00005,
        deviation_amount: 50,
        reference_data_count: 5,
        assessment_date: "2024-01-11T10:30:00Z",
      },
      {
        assessment_id: "A003",
        assessor_id: "ASSESSOR_001",
        region: "Osaka",
        construction_type: "Civil",
        deviation_rate: 0.0001,
        deviation_amount: 100,
        reference_data_count: 8,
        assessment_date: "2024-01-12T14:15:00Z",
      },
      {
        assessment_id: "A004",
        assessor_id: "ASSESSOR_002",
        region: "Tokyo",
        construction_type: "Building",
        deviation_rate: 0.05,
        deviation_amount: 50000,
        reference_data_count: 10,
        assessment_date: "2024-01-13T11:45:00Z",
      },
      {
        assessment_id: "A005",
        assessor_id: "ASSESSOR_002",
        region: "Osaka",
        construction_type: "Civil",
        deviation_rate: 0.15,
        deviation_amount: 150000,
        reference_data_count: 12,
        assessment_date: "2024-01-14T13:20:00Z",
      },
      {
        assessment_id: "A006",
        assessor_id: "ASSESSOR_003",
        region: "Nagoya",
        construction_type: "Building",
        deviation_rate: 0.000099,
        deviation_amount: 10,
        reference_data_count: 3,
        assessment_date: "2024-01-15T09:00:00Z",
      },
    ];

    const exclusion_threshold = 0.0001;
    const visualization_enabled = true;

    const result = classifyDeviationPatterns({
      assessment_data,
      exclusion_threshold,
      visualization_enabled,
    });

    // 分類結果に含まれるべきデータは A004, A005 のみ (偏差率 >= 0.0001 かつ > threshold)
    expect(result.classified_data).toHaveLength(2);
    expect(result.classified_data.map((d: any) => d.assessment_id)).toEqual([
      "A004",
      "A005",
    ]);

    // 除外されたデータは A001, A002, A003, A006
    expect(result.excluded_data).toHaveLength(4);
    expect(result.excluded_data.map((d: any) => d.assessment_id)).toEqual([
      "A001",
      "A002",
      "A003",
      "A006",
    ]);

    // 分類処理がエラーなく完了
    expect(result.processing_status).toBe("success");

    // 除外ログが記録されている
    expect(result.exclusion_log).toBeDefined();
    expect(result.exclusion_log).toHaveLength(4);

    // 除外理由の確認
    const exclusion_entry_a001 = result.exclusion_log.find(
      (log: any) => log.assessment_id === "A001"
    );
    expect(exclusion_entry_a001).toBeDefined();
    expect(exclusion_entry_a001.exclusion_reason).toBe("deviation_rate_zero");
    expect(exclusion_entry_a001.exclusion_threshold_applied).toBe(0.0001);

    const exclusion_entry_a003 = result.exclusion_log.find(
      (log: any) => log.assessment_id === "A003"
    );
    expect(exclusion_entry_a003).toBeDefined();
    expect(exclusion_entry_a003.exclusion_reason).toMatch(/threshold/i);

    // 除外データ件数が正確にカウントされている
    expect(result.total_assessment_count).toBe(6);
    expect(result.classified_count).toBe(2);
    expect(result.excluded_count).toBe(4);

    // 分類結果の可視化グラフデータは除外データを含まない
    expect(result.visualization_data).toBeDefined();
    expect(result.visualization_data.chart_data).toHaveLength(2);
    const chart_assessment_ids = result.visualization_data.chart_data.map(
      (item: any) => item.assessment_id
    );
    expect(chart_assessment_ids).not.toContain("A001");
    expect(chart_assessment_ids).not.toContain("A002");
    expect(chart_assessment_ids).not.toContain("A003");
    expect(chart_assessment_ids).not.toContain("A006");

    // 除外基準が正しく設定されている
    expect(result.exclusion_criteria).toBeDefined();
    expect(result.exclusion_criteria.min_deviation_rate_threshold).toBe(0.0001);
    expect(result.exclusion_criteria.exclude_zero_deviation).toBe(true);
  });
});