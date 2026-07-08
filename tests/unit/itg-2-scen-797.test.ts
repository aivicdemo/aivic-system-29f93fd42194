import { describe, test, expect } from "@jest/globals";
import {
  recordJudgmentDifference,
  verifyLearningDataReflection,
  extractDifferenceByFilters,
} from "../../src/logic/it-6-2-2-2";

describe("査定員別の判定精度・乖離パターン分析ダッシュボード", () => {
  test("SCEN-797: 判定差異の記録が学習データ改善テーブルに正しく反映される", () => {
    // === Setup: テスト用の査定案件データ ===
    const case_id = "CASE-20240115-001";
    const assessor_id = "ASS-00042";
    const assessment_item_code = "COST_LABOR";
    const system_judgment_value = 2500000;
    const assessor_judgment_value = 2800000;
    const difference_reason =
      "Regional labor cost adjustment not reflected in learning data";
    const recorded_timestamp = new Date("2024-01-15T11:30:00Z");
    const difference_degree_percent = 12.0;

    // === Step 1: 判定差異を記録する ===
    const record_result = recordJudgmentDifference({
      case_id,
      assessor_id,
      assessment_item_code,
      system_judgment_value,
      assessor_judgment_value,
      difference_reason,
      recorded_timestamp,
    });

    // 記録が成功し、返される差異ID が生成される
    expect(record_result).toHaveProperty("difference_id");
    expect(record_result.difference_id).toMatch(/^DIFF-/);
    expect(record_result.case_id).toBe(case_id);
    expect(record_result.assessor_id).toBe(assessor_id);
    expect(record_result.assessment_item_code).toBe(assessment_item_code);

    // === Step 2: 計算された差異度が正確に記録される ===
    // 期待される差異度（%）: |2800000 - 2500000| / 2500000 * 100 = 12.0%
    expect(record_result.difference_degree_percent).toBe(difference_degree_percent);
    expect(record_result.system_judgment_value).toBe(system_judgment_value);
    expect(record_result.assessor_judgment_value).toBe(assessor_judgment_value);
    expect(record_result.difference_reason).toBe(difference_reason);

    // === Step 3: 学習データ改善テーブルへの反映を検証する ===
    const difference_id = record_result.difference_id;
    const reflection_result = verifyLearningDataReflection({
      difference_id,
      case_id,
      assessor_id,
    });

    // 記録が学習データ改善テーブルに即座に反映されている
    expect(reflection_result.is_reflected).toBe(true);
    expect(reflection_result.reflected_timestamp).toBeDefined();

    // === Step 4: 反映されたデータの各フィールドが正確に記録されていることを検証する ===
    const reflected_data = reflection_result.reflected_data;
    expect(reflected_data.difference_id).toBe(difference_id);
    expect(reflected_data.case_id).toBe(case_id);
    expect(reflected_data.assessor_id).toBe(assessor_id);
    expect(reflected_data.assessment_item_code).toBe(assessment_item_code);
    expect(reflected_data.system_judgment_value).toBe(system_judgment_value);
    expect(reflected_data.assessor_judgment_value).toBe(assessor_judgment_value);
    expect(reflected_data.difference_degree_percent).toBe(difference_degree_percent);
    expect(reflected_data.difference_reason).toBe(difference_reason);

    // タイムスタンプは記録時刻と一致
    expect(new Date(reflected_data.recorded_timestamp).getTime()).toBe(
      recorded_timestamp.getTime()
    );

    // === Step 5: フィルタリング機能を使用して当該判定差異を抽出できることを確認する ===
    const filter_by_case = extractDifferenceByFilters({
      case_id,
    });

    // 当該案件の差異レコードが抽出される
    expect(filter_by_case.differences.length).toBeGreaterThan(0);
    const found_by_case = filter_by_case.differences.find(
      (d) => d.difference_id === difference_id
    );
    expect(found_by_case).toBeDefined();
    expect(found_by_case?.case_id).toBe(case_id);

    // === Step 6: 査定員IDでのフィルタリング ===
    const filter_by_assessor = extractDifferenceByFilters({
      assessor_id,
    });

    expect(filter_by_assessor.differences.length).toBeGreaterThan(0);
    const found_by_assessor = filter_by_assessor.differences.find(
      (d) => d.difference_id === difference_id
    );
    expect(found_by_assessor).toBeDefined();
    expect(found_by_assessor?.assessor_id).toBe(assessor_id);

    // === Step 7: 査定項目コードでのフィルタリング ===
    const filter_by_item = extractDifferenceByFilters({
      assessment_item_code,
    });

    expect(filter_by_item.differences.length).toBeGreaterThan(0);
    const found_by_item = filter_by_item.differences.find(
      (d) => d.difference_id === difference_id
    );
    expect(found_by_item).toBeDefined();
    expect(found_by_item?.assessment_item_code).toBe(assessment_item_code);

    // === Step 8: 複合フィルタリング ===
    const filter_combined = extractDifferenceByFilters({
      case_id,
      assessor_id,
      assessment_item_code,
    });

    const found_combined = filter_combined.differences.find(
      (d) => d.difference_id === difference_id
    );
    expect(found_combined).toBeDefined();
    expect(found_combined?.case_id).toBe(case_id);
    expect(found_combined?.assessor_id).toBe(assessor_id);
    expect(found_combined?.assessment_item_code).toBe(assessment_item_code);

    // === Step 9: データ整合性の確認 ===
    // すべての抽出結果で同じレコード情報が一致している
    expect(found_by_case).toEqual(found_by_assessor);
    expect(found_by_assessor).toEqual(found_by_item);
    expect(found_by_item).toEqual(found_combined);

    // === Step 10: 判定差異が正確に分類・保存されている ===
    expect(reflected_data.difference_degree_percent).toBeGreaterThan(0);
    expect(reflected_data.difference_degree_percent).toBeLessThanOrEqual(100);
    expect(reflected_data.assessment_item_code).toMatch(/^[A-Z_]+$/);
    expect(reflected_data.difference_id).toMatch(/^DIFF-/);
  });
});