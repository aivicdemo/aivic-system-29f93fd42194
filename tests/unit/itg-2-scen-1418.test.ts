import { recordCorrectionData } from "../../src/logic/it-6-3-1";

describe("査定判定ロジックの適用履歴と根拠の記録・検索機能", () => {
  test("SCEN-1418: 補正内容が空配列の場合も記録処理が正常に完了する", async () => {
    const correction_data = {
      correction_id: "CORR20240115001",
      correction_type: "learning_data_supplement",
      correction_content: [],
      correction_reason: "学習データ不足による精度低下対応",
      corrected_at: "2024-01-15T10:30:00Z",
      corrected_by: "user_001",
      target_model_version: "v2.1.0",
      affected_fields: ["past_project_data"],
    };

    const result = await recordCorrectionData(correction_data);

    expect(result.status_code).toBe(201);
    expect(result.success).toBe(true);
    expect(result.correction_id).toBe("CORR20240115001");
    expect(result.recorded_at).toBeDefined();
    expect(typeof result.recorded_at).toBe("string");
    expect(result.error_message).toBeUndefined();
    expect(result.correction_content).toEqual([]);
    expect(result.record_count).toBe(1);
  });
});