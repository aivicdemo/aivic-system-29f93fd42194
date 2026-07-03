import { describe, test, expect, beforeEach } from "@jest/globals";
import { initializeMonthlyAggregation } from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次レポート作成期間確定・集計開始機能", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1022
  test("[error] 開始日時が終了日時より後の場合、エラーが返され集計処理が中断される", () => {
    const start_datetime = new Date("2024-01-31T23:59:59Z");
    const end_datetime = new Date("2024-01-01T00:00:00Z");

    const result = initializeMonthlyAggregation({
      start_datetime,
      end_datetime,
    });

    expect(result.success).toBe(false);
    expect(result.error_code).toBe("INVALID_DATE_RANGE");
    expect(result.error_message).toMatch(/開始日時は終了日時より前/);
    expect(result.aggregation_id).toBeUndefined();
    expect(result.aggregation_record_created).toBe(false);
  });
});