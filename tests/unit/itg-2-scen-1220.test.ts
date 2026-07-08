import { executeImprovementMeasure } from "../../src/logic/it-6-2-1-1";

describe("改善対策実行と精度計測機能", () => {
  test("SCEN-1220: 学習データが未確定の状態で実行指示が通知された場合にエラーを返す", () => {
    const improvement_measure_id = "IM-2024-001";
    const requested_by_user_id = "USR-0001";
    const learning_data_status = "UNCONFIRMED";
    const execution_requested_at = new Date("2024-01-15T11:00:00Z");

    const input_params = {
      improvement_measure_id,
      requested_by_user_id,
      learning_data_status,
      execution_requested_at,
    };

    expect(() => {
      executeImprovementMeasure(input_params);
    }).toThrow(/学習データ/);
  });
});