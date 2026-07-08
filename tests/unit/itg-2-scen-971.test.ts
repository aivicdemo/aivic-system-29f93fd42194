import { decideSupportRequestTimingAndScale } from "../../src/logic/it-6-2-2-1";

describe("応援要請タイミング・規模の最終決定", () => {
  // SCEN-971: [normal] 応援要請タイミング・規模の最終決定と計画確定 - 配置可能人数の制約下で、必要人員数を満たす応援規模と要請開始日が決定される
  test("配置可能人数の制約下において、必要人員数を満たす応援規模と要請開始日が正確に決定され、確定された応援計画がシステムに反映されることを検証する", () => {
    // 準備: テストデータの設定
    const required_staff_count = 15;
    const available_staff_capacity = 20;
    const current_assigned_staff = 10;
    const days_until_peak_period = 10;
    const min_preparation_days = 5;
    const region_id = "region_001";
    const case_id = "case_971_001";

    // テスト実行: 応援要請タイミング・規模決定機能を呼び出す
    const result = decideSupportRequestTimingAndScale({
      required_staff_count,
      available_staff_capacity,
      current_assigned_staff,
      days_until_peak_period,
      min_preparation_days,
      region_id,
      case_id,
    });

    // 検証1: 決定された応援規模が必要人員数以上であることを確認
    const required_support_staff = required_staff_count - current_assigned_staff;
    expect(result.support_staff_count).toBeGreaterThanOrEqual(
      required_support_staff
    );

    // 検証2: 決定された応援規模が配置可能人数以下であることを確認
    const total_after_support =
      current_assigned_staff + result.support_staff_count;
    expect(total_after_support).toBeLessThanOrEqual(available_staff_capacity);

    // 検証3: 決定された応援規模が必要人員数ちょうどであることを確認（効率最適化）
    expect(result.support_staff_count).toBe(5);

    // 検証4: 決定された応援要請開始日が適切な日程であることを確認
    const request_start_day = days_until_peak_period - min_preparation_days;
    expect(result.request_start_day).toBe(request_start_day);
    expect(result.request_start_day).toBeGreaterThanOrEqual(1);
    expect(result.request_start_day).toBeLessThanOrEqual(
      days_until_peak_period
    );

    // 検証5: 確定された応援計画がシステムに保存されることを確認
    expect(result.is_saved).toBe(true);
    expect(result.saved_timestamp).toBeDefined();
    expect(result.saved_timestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );

    // 検証6: 確定された応援計画の詳細情報がシステムに記録されることを確認
    expect(result.support_plan_id).toBeDefined();
    expect(result.support_plan_id).toMatch(/^plan_/);
    expect(result.region_id).toBe(region_id);
    expect(result.case_id).toBe(case_id);

    // 検証7: 複数の制約条件がある場合、全ての制約を満たす応援規模が決定されることを確認
    const constraint_violations = [];
    if (result.support_staff_count < required_support_staff) {
      constraint_violations.push("required_staff");
    }
    if (total_after_support > available_staff_capacity) {
      constraint_violations.push("capacity");
    }
    if (
      result.request_start_day < 1 ||
      result.request_start_day > days_until_peak_period
    ) {
      constraint_violations.push("timing");
    }
    expect(constraint_violations.length).toBe(0);

    // 検証8: 応援計画の状態遷移が正常であることを確認
    expect(result.status).toBe("confirmed");
    expect(result.approval_required).toBe(false);

    // 検証9: 応援計画が複数の制約を満たしていることをメタ確認
    expect(result.constraints_satisfied).toEqual({
      staff_requirement_met: true,
      capacity_limit_respected: true,
      timing_valid: true,
      all_constraints_met: true,
    });
  });

  // 境界値テスト: 応援人数がちょうど制約上限に達する場合
  test("応援人数が配置可能人数の上限に達する場合、制約を満たす応援規模が決定されることを検証する", () => {
    const required_staff_count = 20;
    const available_staff_capacity = 20;
    const current_assigned_staff = 15;
    const days_until_peak_period = 8;
    const min_preparation_days = 3;
    const region_id = "region_002";
    const case_id = "case_971_002";

    const result = decideSupportRequestTimingAndScale({
      required_staff_count,
      available_staff_capacity,
      current_assigned_staff,
      days_until_peak_period,
      min_preparation_days,
      region_id,
      case_id,
    });

    // 上限に達する応援規模（5人）が決定されることを確認
    expect(result.support_staff_count).toBe(5);
    expect(current_assigned_staff + result.support_staff_count).toBe(
      available_staff_capacity
    );
    expect(result.constraints_satisfied.capacity_limit_respected).toBe(true);
    expect(result.status).toBe("confirmed");
  });

  // エラーテスト: 必要人員数が配置可能人数を超える場合
  test("必要人員数が配置可能人数を超える場合、エラーが発生することを検証する", () => {
    const required_staff_count = 30;
    const available_staff_capacity = 20;
    const current_assigned_staff = 5;
    const days_until_peak_period = 10;
    const min_preparation_days = 5;
    const region_id = "region_003";
    const case_id = "case_971_003";

    expect(() => {
      decideSupportRequestTimingAndScale({
        required_staff_count,
        available_staff_capacity,
        current_assigned_staff,
        days_until_peak_period,
        min_preparation_days,
        region_id,
        case_id,
      });
    }).toThrow(/制約不可能/);
  });

  // エラーテスト: 準備期間が納期までの期間を超える場合
  test("最小準備期間がピーク期までの日数を超える場合、エラーが発生することを検証する", () => {
    const required_staff_count = 15;
    const available_staff_capacity = 25;
    const current_assigned_staff = 10;
    const days_until_peak_period = 3;
    const min_preparation_days = 10;
    const region_id = "region_004";
    const case_id = "case_971_004";

    expect(() => {
      decideSupportRequestTimingAndScale({
        required_staff_count,
        available_staff_capacity,
        current_assigned_staff,
        days_until_peak_period,
        min_preparation_days,
        region_id,
        case_id,
      });
    }).toThrow(/期間不足/);
  });

  // 複数制約同時満足テスト: 3つの制約（必要人員・容量・タイミング）をすべて満たす
  test("複数の制約条件をすべて満たす応援規模とタイミングが決定されることを検証する", () => {
    const required_staff_count = 18;
    const available_staff_capacity = 22;
    const current_assigned_staff = 12;
    const days_until_peak_period = 12;
    const min_preparation_days = 4;
    const region_id = "region_005";
    const case_id = "case_971_005";

    const result = decideSupportRequestTimingAndScale({
      required_staff_count,
      available_staff_capacity,
      current_assigned_staff,
      days_until_peak_period,
      min_preparation_days,
      region_id,
      case_id,
    });

    // 必要人員数を満たすことを確認（6人必要）
    expect(result.support_staff_count).toBe(6);

    // 容量制約を満たすことを確認（12 + 6 = 18 <= 22）
    expect(current_assigned_staff + result.support_staff_count).toBe(18);
    expect(current_assigned_staff + result.support_staff_count).toBeLessThanOrEqual(
      available_staff_capacity
    );

    // タイミング制約を満たすことを確認（要請開始日 = 12 - 4 = 8日目）
    expect(result.request_start_day).toBe(8);
    expect(result.request_start_day).toBeGreaterThanOrEqual(1);
    expect(result.request_start_day + min_preparation_days).toBeLessThanOrEqual(
      days_until_peak_period
    );

    // すべての制約が満たされているメタ情報を確認
    expect(result.constraints_satisfied.all_constraints_met).toBe(true);
    expect(result.status).toBe("confirmed");
    expect(result.is_saved).toBe(true);
  });
});