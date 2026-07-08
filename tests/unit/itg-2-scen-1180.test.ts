import { recordLogicApplicationHistory } from "../../src/logic/it-6-3-1";

describe("判定ロジック適用履歴の記録と検証", () => {
  // SCEN-1180
  test("複数ロジックが同一案件に順序立てて適用された場合、全ロジックの適用履歴が時系列で記録される", () => {
    const case_id = "CASE-20240115-001";
    const user_id = "USER-ASSESSOR-001";
    const logic_1_id = "LOGIC-BASIC-001";
    const logic_1_name = "基本査定ロジック";
    const logic_1_apply_time = new Date("2024-01-15T09:00:00Z");
    const logic_1_result = { decision: "APPROVED", confidence: 0.92 };

    const logic_2_id = "LOGIC-CORRECTION-001";
    const logic_2_name = "補正査定ロジック";
    const logic_2_apply_time = new Date("2024-01-15T09:05:00Z");
    const logic_2_result = { decision: "APPROVED", confidence: 0.88 };

    const logic_3_id = "LOGIC-FINAL-001";
    const logic_3_name = "最終判定ロジック";
    const logic_3_apply_time = new Date("2024-01-15T09:10:00Z");
    const logic_3_result = { decision: "APPROVED", confidence: 0.95 };

    // 第1のロジック適用
    const history_1 = recordLogicApplicationHistory({
      case_id,
      logic_id: logic_1_id,
      logic_name: logic_1_name,
      applied_at: logic_1_apply_time,
      applied_by: user_id,
      applied_result: logic_1_result,
    });

    expect(history_1).toEqual({
      record_id: expect.any(String),
      case_id,
      logic_id: logic_1_id,
      logic_name: logic_1_name,
      applied_at: logic_1_apply_time,
      applied_by: user_id,
      applied_result: logic_1_result,
      sequence_number: 1,
    });

    // 第2のロジック適用
    const history_2 = recordLogicApplicationHistory({
      case_id,
      logic_id: logic_2_id,
      logic_name: logic_2_name,
      applied_at: logic_2_apply_time,
      applied_by: user_id,
      applied_result: logic_2_result,
    });

    expect(history_2).toEqual({
      record_id: expect.any(String),
      case_id,
      logic_id: logic_2_id,
      logic_name: logic_2_name,
      applied_at: logic_2_apply_time,
      applied_by: user_id,
      applied_result: logic_2_result,
      sequence_number: 2,
    });

    // 第3のロジック適用
    const history_3 = recordLogicApplicationHistory({
      case_id,
      logic_id: logic_3_id,
      logic_name: logic_3_name,
      applied_at: logic_3_apply_time,
      applied_by: user_id,
      applied_result: logic_3_result,
    });

    expect(history_3).toEqual({
      record_id: expect.any(String),
      case_id,
      logic_id: logic_3_id,
      logic_name: logic_3_name,
      applied_at: logic_3_apply_time,
      applied_by: user_id,
      applied_result: logic_3_result,
      sequence_number: 3,
    });

    // 適用履歴が3つすべて記録されていることを検証
    expect(history_1.sequence_number).toBe(1);
    expect(history_2.sequence_number).toBe(2);
    expect(history_3.sequence_number).toBe(3);

    // 各ロジックの適用時刻が時系列順（昇順）であることを検証
    expect(history_1.applied_at.getTime()).toBeLessThan(
      history_2.applied_at.getTime()
    );
    expect(history_2.applied_at.getTime()).toBeLessThan(
      history_3.applied_at.getTime()
    );

    // 各ロジック適用履歴に詳細情報が正確に記録されていることを検証
    expect(history_1.logic_id).toBe(logic_1_id);
    expect(history_1.logic_name).toBe(logic_1_name);
    expect(history_1.applied_result.decision).toBe("APPROVED");
    expect(history_1.applied_result.confidence).toBe(0.92);

    expect(history_2.logic_id).toBe(logic_2_id);
    expect(history_2.logic_name).toBe(logic_2_name);
    expect(history_2.applied_result.decision).toBe("APPROVED");
    expect(history_2.applied_result.confidence).toBe(0.88);

    expect(history_3.logic_id).toBe(logic_3_id);
    expect(history_3.logic_name).toBe(logic_3_name);
    expect(history_3.applied_result.decision).toBe("APPROVED");
    expect(history_3.applied_result.confidence).toBe(0.95);

    // 適用ユーザーが全履歴で一致していることを検証
    expect(history_1.applied_by).toBe(user_id);
    expect(history_2.applied_by).toBe(user_id);
    expect(history_3.applied_by).toBe(user_id);

    // 案件IDが全履歴で一致していることを検証
    expect(history_1.case_id).toBe(case_id);
    expect(history_2.case_id).toBe(case_id);
    expect(history_3.case_id).toBe(case_id);
  });
});