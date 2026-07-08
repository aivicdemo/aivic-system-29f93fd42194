import { recordOcrAnomalyFlags } from "../../src/logic/it-6-3-1";

describe("査定判定ロジックの適用履歴と根拠の記録・検索機能", () => {
  // SCEN-820: [error] OCR読取異常値検出・フラグ付け機能 - フラグ付き項目が学習データ改善の対象として記録されない場合、エラーが発生する
  test("should throw ERR_LEARNING_DATA_RECORD_FAILED when flagged OCR items fail to record as learning data improvement target", () => {
    const flaggedOcrData = {
      estimate_id: "EST-20240115-001",
      ocr_read_time: new Date("2024-01-15T11:00:00Z"),
      flagged_items: [
        {
          item_name: "鉄骨工事",
          read_value: 5000000,
          expected_range_lower: 3000000,
          expected_range_upper: 4500000,
          anomaly_flag: true,
          flag_reason: "超過"
        },
        {
          item_name: "左官工事",
          read_value: -500000,
          expected_range_lower: 0,
          expected_range_upper: 2000000,
          anomaly_flag: true,
          flag_reason: "負数値"
        }
      ],
      total_flagged_count: 2,
      learning_data_improvement_target_status: "failed"
    };

    expect(() =>
      recordOcrAnomalyFlags(flaggedOcrData)
    ).toThrow(/学習データ/);
  });

  test("should successfully record flagged OCR items and return improvement target record ID", () => {
    const flaggedOcrData = {
      estimate_id: "EST-20240115-002",
      ocr_read_time: new Date("2024-01-15T12:30:00Z"),
      flagged_items: [
        {
          item_name: "杭打工事",
          read_value: 8000000,
          expected_range_lower: 5000000,
          expected_range_upper: 7500000,
          anomaly_flag: true,
          flag_reason: "上限超過"
        }
      ],
      total_flagged_count: 1,
      learning_data_improvement_target_status: "success"
    };

    const result = recordOcrAnomalyFlags(flaggedOcrData);

    expect(result).toEqual({
      improvement_target_record_id: expect.any(String),
      estimate_id: "EST-20240115-002",
      flagged_items_count: 1,
      recorded_at: expect.any(String),
      status: "recorded"
    });

    expect(result.improvement_target_record_id).toMatch(/^IMPR-/);
    expect(result.recorded_at).toBeTruthy();
    expect(result.status).toBe("recorded");
  });

  test("should include error details in thrown error when recording fails due to database connection issue", () => {
    const flaggedOcrData = {
      estimate_id: "EST-20240115-003",
      ocr_read_time: new Date("2024-01-15T13:00:00Z"),
      flagged_items: [
        {
          item_name: "躯体工事",
          read_value: "invalid_value" as unknown as number,
          expected_range_lower: 10000000,
          expected_range_upper: 15000000,
          anomaly_flag: true,
          flag_reason: "型エラー"
        }
      ],
      total_flagged_count: 1,
      learning_data_improvement_target_status: "failed"
    };

    expect(() =>
      recordOcrAnomalyFlags(flaggedOcrData)
    ).toThrow(/記録/);
  });

  test("should validate flagged items structure before recording and throw validation error", () => {
    const invalidFlaggedOcrData = {
      estimate_id: "EST-20240115-004",
      ocr_read_time: new Date("2024-01-15T14:00:00Z"),
      flagged_items: [
        {
          item_name: "",
          read_value: 3000000,
          expected_range_lower: 2000000,
          expected_range_upper: 3500000,
          anomaly_flag: true,
          flag_reason: ""
        }
      ],
      total_flagged_count: 1,
      learning_data_improvement_target_status: "failed"
    };

    expect(() =>
      recordOcrAnomalyFlags(invalidFlaggedOcrData)
    ).toThrow(/項目/);
  });

  test("should handle multiple flagged items and record all anomalies with proper tracking", () => {
    const multipleAnomaliesFlaggedOcrData = {
      estimate_id: "EST-20240115-005",
      ocr_read_time: new Date("2024-01-15T15:00:00Z"),
      flagged_items: [
        {
          item_name: "型枠工事",
          read_value: 12000000,
          expected_range_lower: 8000000,
          expected_range_upper: 10000000,
          anomaly_flag: true,
          flag_reason: "過大"
        },
        {
          item_name: "仮設工事",
          read_value: 50000,
          expected_range_lower: 500000,
          expected_range_upper: 1500000,
          anomaly_flag: true,
          flag_reason: "過小"
        },
        {
          item_name: "電気工事",
          read_value: 0,
          expected_range_lower: 3000000,
          expected_range_upper: 5000000,
          anomaly_flag: true,
          flag_reason: "ゼロ値"
        }
      ],
      total_flagged_count: 3,
      learning_data_improvement_target_status: "success"
    };

    const result = recordOcrAnomalyFlags(multipleAnomaliesFlaggedOcrData);

    expect(result.flagged_items_count).toBe(3);
    expect(result.improvement_target_record_id).toBeTruthy();
    expect(result.status).toBe("recorded");
  });
});