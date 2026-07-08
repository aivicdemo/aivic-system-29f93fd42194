import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import {
  validateOCRReadingAccuracy,
} from "../../src/logic/it-6-3-1";

describe("査定判定ロジックの適用履歴と根拠の記録・検索機能", () => {
  // SCEN-1343: [error] OCR読取精度判定 - OCR読取結果が許容誤差率を超過して不合格と自動判定される
  test("OCR読取精度が許容誤差率を超過する場合、不合格判定とエラーメッセージ表示、ログ記録", () => {
    const tolerance_threshold_percent = 5;
    const actual_error_rate_percent = 7;
    const ocr_read_result_id = "ocr_20240115_001";
    const ocr_read_timestamp = "2024-01-15T11:00:00Z";

    const input_data = {
      tolerance_threshold_percent: tolerance_threshold_percent,
      actual_error_rate_percent: actual_error_rate_percent,
      ocr_read_result_id: ocr_read_result_id,
      ocr_read_timestamp: ocr_read_timestamp,
    };

    expect(() => {
      validateOCRReadingAccuracy(input_data);
    }).toThrow(/誤差率/);
  });
});