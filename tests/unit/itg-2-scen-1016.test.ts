import { describe, test, expect, beforeEach } from "@jest/globals";
import { validateQualityCheckMetrics } from "../../src/logic/it-6-3-1";

describe("査定判定ロジックの適用履歴と根拠の記録・検索機能", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1016
  test("見積査定員による説明資料の品質チェック - チェック対象項目の測定値が存在しない場合にエラーが返却される", () => {
    const check_item_id = "QC_OCR_ACCURACY";
    const check_item_name = "OCR読取精度";
    const measured_value = undefined;
    const assessment_id = "EST_20240115_001";
    const check_timestamp = "2024-01-15T11:30:00Z";
    const checker_user_id = "USR_APPRAISER_005";
    const check_item_type = "numeric";
    const allowable_threshold = 85.0;

    const input_data = {
      check_item_id: check_item_id,
      check_item_name: check_item_name,
      measured_value: measured_value,
      assessment_id: assessment_id,
      check_timestamp: check_timestamp,
      checker_user_id: checker_user_id,
      check_item_type: check_item_type,
      allowable_threshold: allowable_threshold,
    };

    expect(() => validateQualityCheckMetrics(input_data)).toThrow(/測定値/);
  });
});