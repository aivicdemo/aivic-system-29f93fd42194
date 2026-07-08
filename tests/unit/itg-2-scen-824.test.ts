import { describe, test, expect } from "@jest/globals";
import {
  recordAssessorFeedback,
  calculatePriorityScores,
} from "../../src/logic/it-6-2-2-1";

describe("査定員フィードバック記録・学習データ優先度自動算出機能", () => {
  test("SCEN-824: 複数の修正指示が同時に記録される場合、優先度が重複なく正確に算出される", () => {
    const assessor_id = "A001";
    const case_id = "CASE-20240515-001";
    const record_timestamp = new Date("2024-05-15T10:30:00Z");

    const feedback_items = [
      {
        feedback_id: "FB-001",
        case_id: case_id,
        assessor_id: assessor_id,
        correction_type: "price_evaluation_error",
        importance_level: "high",
        description: "見積金額の相場評価が過大",
        impact_count: 5,
        attribute_category: "finance",
        recorded_at: record_timestamp,
      },
      {
        feedback_id: "FB-002",
        case_id: case_id,
        assessor_id: assessor_id,
        correction_type: "condition_judgment_error",
        importance_level: "high",
        description: "工事状態の判定ロジック誤り",
        impact_count: 3,
        attribute_category: "logic",
        recorded_at: record_timestamp,
      },
      {
        feedback_id: "FB-003",
        case_id: case_id,
        assessor_id: assessor_id,
        correction_type: "classification_error",
        importance_level: "medium",
        description: "工種分類の誤分類",
        impact_count: 2,
        attribute_category: "data",
        recorded_at: record_timestamp,
      },
      {
        feedback_id: "FB-004",
        case_id: case_id,
        assessor_id: assessor_id,
        correction_type: "region_supplement_error",
        importance_level: "low",
        description: "地域補正係数の適用漏れ",
        impact_count: 1,
        attribute_category: "parameter",
        recorded_at: record_timestamp,
      },
    ];

    const recorded_feedback = recordAssessorFeedback({
      assessor_id: assessor_id,
      case_id: case_id,
      feedback_items: feedback_items,
      recorded_timestamp: record_timestamp,
    });

    expect(recorded_feedback.status).toBe("recorded");
    expect(recorded_feedback.total_items_recorded).toBe(4);
    expect(recorded_feedback.assessor_id).toBe(assessor_id);

    const priority_calculation_result = calculatePriorityScores({
      feedback_records: recorded_feedback.feedback_records,
      importance_weights: {
        high: 100,
        medium: 60,
        low: 30,
      },
      attribute_weights: {
        finance: 1.5,
        logic: 1.3,
        data: 1.1,
        parameter: 1.0,
      },
      impact_weight_factor: 0.5,
    });

    expect(priority_calculation_result.calculation_status).toBe("success");
    expect(priority_calculation_result.priority_scores.length).toBe(4);

    const assigned_priority_numbers = priority_calculation_result.priority_scores.map(
      (score: any) => score.priority_number
    );

    const unique_priorities = new Set(assigned_priority_numbers);
    expect(unique_priorities.size).toBe(4);

    const sorted_scores = [...priority_calculation_result.priority_scores].sort(
      (a: any, b: any) => a.priority_number - b.priority_number
    );

    expect(sorted_scores[0].feedback_id).toBe("FB-001");
    expect(sorted_scores[0].priority_number).toBe(1);
    expect(Math.round(sorted_scores[0].calculated_score * 10) / 10).toBe(
      Math.round((100 * 1.5 + 5 * 0.5) * 10) / 10
    );

    expect(sorted_scores[1].feedback_id).toBe("FB-002");
    expect(sorted_scores[1].priority_number).toBe(2);
    expect(Math.round(sorted_scores[1].calculated_score * 10) / 10).toBe(
      Math.round((100 * 1.3 + 3 * 0.5) * 10) / 10
    );

    expect(sorted_scores[2].feedback_id).toBe("FB-003");
    expect(sorted_scores[2].priority_number).toBe(3);
    expect(Math.round(sorted_scores[2].calculated_score * 10) / 10).toBe(
      Math.round((60 * 1.1 + 2 * 0.5) * 10) / 10
    );

    expect(sorted_scores[3].feedback_id).toBe("FB-004");
    expect(sorted_scores[3].priority_number).toBe(4);
    expect(Math.round(sorted_scores[3].calculated_score * 10) / 10).toBe(
      Math.round((30 * 1.0 + 1 * 0.5) * 10) / 10
    );

    const stored_learning_data = priority_calculation_result.stored_learning_data;

    expect(stored_learning_data.assessor_id).toBe(assessor_id);
    expect(stored_learning_data.case_id).toBe(case_id);
    expect(stored_learning_data.priority_records.length).toBe(4);

    const priority_records_sorted = stored_learning_data.priority_records.sort(
      (a: any, b: any) => a.priority_number - b.priority_number
    );

    priority_records_sorted.forEach((record: any, index: number) => {
      expect(record.priority_number).toBe(index + 1);
      expect(record.feedback_id).toBeDefined();
      expect(record.calculated_score).toBeGreaterThan(0);
      expect(record.importance_level).toBeDefined();
      expect(record.attribute_category).toBeDefined();
    });

    expect(stored_learning_data.stored_timestamp).toBeDefined();
    expect(stored_learning_data.storage_status).toBe("success");

    const priority_list = stored_learning_data.priority_records.map(
      (r: any) => r.priority_number
    );
    const expected_priority_list = [1, 2, 3, 4];
    expect(priority_list).toEqual(expected_priority_list);

    const importance_sequence = stored_learning_data.priority_records.map(
      (r: any) => r.importance_level
    );
    const high_count = importance_sequence.filter(
      (level: string) => level === "high"
    ).length;
    const medium_count = importance_sequence.filter(
      (level: string) => level === "medium"
    ).length;
    const low_count = importance_sequence.filter(
      (level: string) => level === "low"
    ).length;

    expect(high_count).toBe(2);
    expect(medium_count).toBe(1);
    expect(low_count).toBe(1);

    const high_priority_items = priority_records_sorted.filter(
      (r: any) => r.importance_level === "high"
    );
    expect(high_priority_items[0].priority_number).toBeLessThan(
      high_priority_items[1].priority_number
    );

    const validation_result = priority_calculation_result.validation_result;
    expect(validation_result.duplicate_priority_check).toBe("pass");
    expect(validation_result.logical_ordering_check).toBe("pass");
    expect(validation_result.completeness_check).toBe("pass");
    expect(validation_result.learning_data_integrity_check).toBe("pass");
  });
});