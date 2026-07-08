import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { visualizePrecisionImprovementDegree } from "../../src/logic/it-6-3-1";

const fetchMock = require("jest-fetch-mock");

describe("Precision Improvement Degree Visualization", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  // SCEN-1097
  test("should return 422 error when precision measurement data is incomplete", async () => {
    const assessment_id = "ASS-20240115-0001";
    const incomplete_precision_data = {
      assessment_id: assessment_id,
      ocr_accuracy: 0.87,
      // ai_judgment_accuracy is missing
      measurement_date: "2024-01-15T11:00:00Z",
      model_version: "v2.1",
    };

    fetchMock.mockResponseOnce(
      JSON.stringify({
        status: 422,
        error_code: "INCOMPLETE_PRECISION_DATA",
        message: "精度計測データが不完全です",
        missing_fields: ["ai_judgment_accuracy"],
        assessment_id: assessment_id,
        error_log_detail: {
          assessment_id: assessment_id,
          missing_data_items: ["ai_judgment_accuracy"],
          timestamp: "2024-01-15T11:00:00Z",
        },
      }),
      { status: 422 }
    );

    const result = await visualizePrecisionImprovementDegree({
      assessment_id: assessment_id,
    });

    expect(result.status).toBe(422);
    expect(result.error_code).toBe("INCOMPLETE_PRECISION_DATA");
    expect(result.message).toMatch(/精度計測データ/);
    expect(result.missing_fields).toContain("ai_judgment_accuracy");
    expect(result.error_log_detail.missing_data_items).toContain(
      "ai_judgment_accuracy"
    );
  });

  // SCEN-1097: Boundary - When OCR accuracy is missing
  test("should return 422 error when ocr_accuracy is missing", async () => {
    const assessment_id = "ASS-20240115-0002";

    fetchMock.mockResponseOnce(
      JSON.stringify({
        status: 422,
        error_code: "INCOMPLETE_PRECISION_DATA",
        message: "精度計測データが不完全です",
        missing_fields: ["ocr_accuracy"],
        assessment_id: assessment_id,
        error_log_detail: {
          assessment_id: assessment_id,
          missing_data_items: ["ocr_accuracy"],
          timestamp: "2024-01-15T12:00:00Z",
        },
      }),
      { status: 422 }
    );

    const result = await visualizePrecisionImprovementDegree({
      assessment_id: assessment_id,
    });

    expect(result.status).toBe(422);
    expect(result.missing_fields).toContain("ocr_accuracy");
  });

  // SCEN-1097: Boundary - Multiple missing fields
  test("should return 422 error when multiple precision measurement fields are missing", async () => {
    const assessment_id = "ASS-20240115-0003";

    fetchMock.mockResponseOnce(
      JSON.stringify({
        status: 422,
        error_code: "INCOMPLETE_PRECISION_DATA",
        message: "精度計測データが不完全です",
        missing_fields: [
          "ai_judgment_accuracy",
          "measurement_date",
          "model_version",
        ],
        assessment_id: assessment_id,
        error_log_detail: {
          assessment_id: assessment_id,
          missing_data_items: [
            "ai_judgment_accuracy",
            "measurement_date",
            "model_version",
          ],
          timestamp: "2024-01-15T13:00:00Z",
        },
      }),
      { status: 422 }
    );

    const result = await visualizePrecisionImprovementDegree({
      assessment_id: assessment_id,
    });

    expect(result.status).toBe(422);
    expect(result.missing_fields.length).toBe(3);
    expect(result.error_log_detail.missing_data_items.length).toBe(3);
  });

  // SCEN-1097: Boundary - Invalid assessment_id format
  test("should return 400 error when assessment_id format is invalid", async () => {
    const invalid_assessment_id = "INVALID-ID";

    fetchMock.mockResponseOnce(
      JSON.stringify({
        status: 400,
        error_code: "INVALID_ASSESSMENT_ID",
        message: "査定IDの形式が不正です",
        assessment_id: invalid_assessment_id,
        error_log_detail: {
          assessment_id: invalid_assessment_id,
          reason: "形式が正しくありません",
          timestamp: "2024-01-15T14:00:00Z",
        },
      }),
      { status: 400 }
    );

    const result = await visualizePrecisionImprovementDegree({
      assessment_id: invalid_assessment_id,
    });

    expect(result.status).toBe(400);
    expect(result.error_code).toBe("INVALID_ASSESSMENT_ID");
    expect(result.message).toMatch(/査定ID/);
  });

  // SCEN-1097: Success case - Complete precision data
  test("should successfully visualize precision improvement degree with complete data", async () => {
    const assessment_id = "ASS-20240115-0004";

    fetchMock.mockResponseOnce(
      JSON.stringify({
        status: 200,
        assessment_id: assessment_id,
        ocr_accuracy_previous: 0.82,
        ocr_accuracy_current: 0.91,
        ocr_improvement_rate: 11.0,
        ai_judgment_accuracy_previous: 0.79,
        ai_judgment_accuracy_current: 0.88,
        ai_judgment_improvement_rate: 11.39,
        overall_improvement_rate: 11.2,
        measurement_date: "2024-01-15T15:00:00Z",
        model_version: "v2.1",
        data_status: "complete",
      }),
      { status: 200 }
    );

    const result = await visualizePrecisionImprovementDegree({
      assessment_id: assessment_id,
    });

    expect(result.status).toBe(200);
    expect(result.assessment_id).toBe(assessment_id);
    expect(result.ocr_improvement_rate).toBe(11.0);
    expect(result.ai_judgment_improvement_rate).toBeCloseTo(11.39, 1);
    expect(result.overall_improvement_rate).toBe(11.2);
    expect(result.data_status).toBe("complete");
  });
});