import { describe, test, expect } from "@jest/globals";
import { generateMultiplePersonnelPlacementScenarios } from "../../src/logic/it-6-2-1-1";

describe("複数人員配置シナリオの自動生成", () => {
  test("SCEN-961: 必要人員数が利用可能な応援人数を超える場合にエラーを返す", () => {
    const required_staff_count = 10;
    const available_support_staff = 5;
    const base_staff_count = 3;
    const current_month_cases = 150;
    const average_processing_time_minutes = 20;

    const input_params = {
      required_staff_count: required_staff_count,
      available_support_staff: available_support_staff,
      base_staff_count: base_staff_count,
      current_month_cases: current_month_cases,
      average_processing_time_minutes: average_processing_time_minutes,
    };

    expect(() =>
      generateMultiplePersonnelPlacementScenarios(input_params)
    ).toThrow(/応援人数/);
  });
});