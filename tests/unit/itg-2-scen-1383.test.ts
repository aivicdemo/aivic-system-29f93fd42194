import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { analyzeAccuracyDeclineRootCause } from "../../src/logic/it-6-2-1-1";

const fetchMock = require("jest-fetch-mock");
fetchMock.enableMocks();

describe("IT-6-2-1-1: 査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  // SCEN-1383
  test("精度低下原因の分析・カスタマイズ範囲特定 - メタデータ不足時はエラーを返す", async () => {
    // ハッピーパス: メタデータすべて揃った場合の正常なレスポンス
    const validPayload = {
      assessment_record_id: "AR-20240115-001",
      assessment_date: "2024-01-15T10:30:00Z",
      assessor_id: "ASS-001",
      property_info: {
        region: "Tokyo",
        construction_type: "建築工事",
      },
      ocr_accuracy_before: 92.5,
      ocr_accuracy_after: 87.1,
      ai_judgment_accuracy_before: 88.3,
      ai_judgment_accuracy_after: 82.9,
      accuracy_decline_rate_ocr: -5.4,
      accuracy_decline_rate_ai: -5.4,
      reference_data_count: 150,
      price_book_version: "2024-01",
      past_project_data_count: 120,
    };

    fetchMock.mockResponseOnce(
      JSON.stringify({
        status: 200,
        root_cause_candidates: [
          {
            cause_type: "学習データ不足",
            confidence_score: 85,
          },
          {
            cause_type: "フォーマット差異",
            confidence_score: 72,
          },
        ],
        customization_scope: {
          ocr_model_adjustment: true,
          judgment_logic_modification: true,
          additional_learning_data_required: 250,
        },
      }),
      { status: 200 }
    );

    const validResponse = await analyzeAccuracyDeclineRootCause(validPayload);
    expect(validResponse.status).toBe(200);
    expect(validResponse.root_cause_candidates).toBeDefined();
    expect(validResponse.customization_scope).toBeDefined();

    // エラーケース1: assessment_date が不足している場合
    fetchMock.resetMocks();
    const missingAssessmentDate = {
      assessment_record_id: "AR-20240115-001",
      assessor_id: "ASS-001",
      property_info: {
        region: "Tokyo",
        construction_type: "建築工事",
      },
      ocr_accuracy_before: 92.5,
      ocr_accuracy_after: 87.1,
      ai_judgment_accuracy_before: 88.3,
      ai_judgment_accuracy_after: 82.9,
      accuracy_decline_rate_ocr: -5.4,
      accuracy_decline_rate_ai: -5.4,
      reference_data_count: 150,
      price_book_version: "2024-01",
      past_project_data_count: 120,
    };

    fetchMock.mockResponseOnce(
      JSON.stringify({
        status: 400,
        error: "メタデータが不足しています",
        missing_fields: ["assessment_date"],
      }),
      { status: 400 }
    );

    const response1 = await analyzeAccuracyDeclineRootCause(missingAssessmentDate);
    expect(response1.status).toBe(400);
    expect(response1.error).toMatch(/メタデータが不足/);
    expect(response1.missing_fields).toContain("assessment_date");

    // エラーケース2: assessor_id が不足している場合
    fetchMock.resetMocks();
    const missingAssessorId = {
      assessment_record_id: "AR-20240115-001",
      assessment_date: "2024-01-15T10:30:00Z",
      property_info: {
        region: "Tokyo",
        construction_type: "建築工事",
      },
      ocr_accuracy_before: 92.5,
      ocr_accuracy_after: 87.1,
      ai_judgment_accuracy_before: 88.3,
      ai_judgment_accuracy_after: 82.9,
      accuracy_decline_rate_ocr: -5.4,
      accuracy_decline_rate_ai: -5.4,
      reference_data_count: 150,
      price_book_version: "2024-01",
      past_project_data_count: 120,
    };

    fetchMock.mockResponseOnce(
      JSON.stringify({
        status: 422,
        error: "必須項目が不足しています",
        missing_fields: ["assessor_id"],
      }),
      { status: 422 }
    );

    const response2 = await analyzeAccuracyDeclineRootCause(missingAssessorId);
    expect(response2.status).toBe(422);
    expect(response2.error).toMatch(/必須項目が不足/);
    expect(response2.missing_fields).toContain("assessor_id");

    // エラーケース3: property_info が不足している場合
    fetchMock.resetMocks();
    const missingPropertyInfo = {
      assessment_record_id: "AR-20240115-001",
      assessment_date: "2024-01-15T10:30:00Z",
      assessor_id: "ASS-001",
      ocr_accuracy_before: 92.5,
      ocr_accuracy_after: 87.1,
      ai_judgment_accuracy_before: 88.3,
      ai_judgment_accuracy_after: 82.9,
      accuracy_decline_rate_ocr: -5.4,
      accuracy_decline_rate_ai: -5.4,
      reference_data_count: 150,
      price_book_version: "2024-01",
      past_project_data_count: 120,
    };

    fetchMock.mockResponseOnce(
      JSON.stringify({
        status: 400,
        error: "メタデータが不足しています",
        missing_fields: ["property_info"],
      }),
      { status: 400 }
    );

    const response3 = await analyzeAccuracyDeclineRootCause(missingPropertyInfo);
    expect(response3.status).toBe(400);
    expect(response3.error).toMatch(/メタデータが不足/);
    expect(response3.missing_fields).toContain("property_info");

    // エラーケース4: 複数の必須メタデータが不足している場合
    fetchMock.resetMocks();
    const missingMultipleFields = {
      assessment_record_id: "AR-20240115-001",
      ocr_accuracy_before: 92.5,
      ocr_accuracy_after: 87.1,
      ai_judgment_accuracy_before: 88.3,
      ai_judgment_accuracy_after: 82.9,
    };

    fetchMock.mockResponseOnce(
      JSON.stringify({
        status: 400,
        error: "メタデータが不足しています",
        missing_fields: [
          "assessment_date",
          "assessor_id",
          "property_info",
          "accuracy_decline_rate_ocr",
          "accuracy_decline_rate_ai",
          "reference_data_count",
          "price_book_version",
          "past_project_data_count",
        ],
      }),
      { status: 400 }
    );

    const response4 = await analyzeAccuracyDeclineRootCause(missingMultipleFields);
    expect(response4.status).toBe(400);
    expect(response4.error).toMatch(/メタデータが不足/);
    expect(response4.missing_fields.length).toBeGreaterThan(3);
    expect(response4.missing_fields).toContain("assessment_date");
    expect(response4.missing_fields).toContain("assessor_id");
    expect(response4.missing_fields).toContain("property_info");

    // エラーケース5: 精度指標が不足している場合
    fetchMock.resetMocks();
    const missingAccuracyMetrics = {
      assessment_record_id: "AR-20240115-001",
      assessment_date: "2024-01-15T10:30:00Z",
      assessor_id: "ASS-001",
      property_info: {
        region: "Tokyo",
        construction_type: "建築工事",
      },
      ocr_accuracy_before: 92.5,
      ai_judgment_accuracy_before: 88.3,
      reference_data_count: 150,
      price_book_version: "2024-01",
      past_project_data_count: 120,
    };

    fetchMock.mockResponseOnce(
      JSON.stringify({
        status: 400,
        error: "メタデータが不足しています",
        missing_fields: ["ocr_accuracy_after", "ai_judgment_accuracy_after"],
      }),
      { status: 400 }
    );

    const response5 = await analyzeAccuracyDeclineRootCause(missingAccuracyMetrics);
    expect(response5.status).toBe(400);
    expect(response5.error).toMatch(/メタデータが不足/);
    expect(response5.missing_fields).toContain("ocr_accuracy_after");
    expect(response5.missing_fields).toContain("ai_judgment_accuracy_after");
  });
});