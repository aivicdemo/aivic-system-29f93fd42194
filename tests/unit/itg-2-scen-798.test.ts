import { validateAndRegisterLearningData } from "../../src/logic/it-6-2-2-2";

const fetchMock = require("jest-fetch-mock");

describe("査定員別の判定精度・乖離パターン分析ダッシュボード", () => {
  test("SCEN-798: 判定理由が空文字列または不正な形式の場合、エラーが発生する", async () => {
    fetchMock.resetMocks();

    // テスト1: 判定理由が空文字列の場合
    const emptyReasonPayload = {
      assessor_id: "ASS-001",
      estimate_id: "EST-202401001",
      judgment_reason: "",
      learning_data_category: "相場乖離パターン",
      confidence_score: 85,
    };

    fetchMock.mockResponseOnce(
      JSON.stringify({
        status: 400,
        error_code: "VALIDATION_ERROR",
        error_message: "判定理由",
      }),
      { status: 400 }
    );

    let emptyReasonError: any = null;
    try {
      await validateAndRegisterLearningData(emptyReasonPayload);
    } catch (err) {
      emptyReasonError = err;
    }

    expect(emptyReasonError).toBeTruthy();
    expect(emptyReasonError.message).toMatch(/判定理由/);

    // テスト2: 判定理由が記号のみの場合
    fetchMock.resetMocks();
    const invalidReasonPayload = {
      assessor_id: "ASS-002",
      estimate_id: "EST-202401002",
      judgment_reason: "!@#$%^&*()",
      learning_data_category: "相場乖離パターン",
      confidence_score: 72,
    };

    fetchMock.mockResponseOnce(
      JSON.stringify({
        status: 400,
        error_code: "INVALID_FORMAT",
        error_message: "判定理由",
      }),
      { status: 400 }
    );

    let invalidReasonError: any = null;
    try {
      await validateAndRegisterLearningData(invalidReasonPayload);
    } catch (err) {
      invalidReasonError = err;
    }

    expect(invalidReasonError).toBeTruthy();
    expect(invalidReasonError.message).toMatch(/判定理由/);

    // テスト3: 判定理由に制御文字が含まれる場合
    fetchMock.resetMocks();
    const controlCharReasonPayload = {
      assessor_id: "ASS-003",
      estimate_id: "EST-202401003",
      judgment_reason: "正常な理由\x00\x01\x02",
      learning_data_category: "相場乖離パターン",
      confidence_score: 68,
    };

    fetchMock.mockResponseOnce(
      JSON.stringify({
        status: 400,
        error_code: "INVALID_CHARACTER",
        error_message: "判定理由",
      }),
      { status: 400 }
    );

    let controlCharError: any = null;
    try {
      await validateAndRegisterLearningData(controlCharReasonPayload);
    } catch (err) {
      controlCharError = err;
    }

    expect(controlCharError).toBeTruthy();
    expect(controlCharError.message).toMatch(/判定理由/);

    // テスト4: 正常な判定理由の場合は成功する（ハッピーパス）
    fetchMock.resetMocks();
    const validReasonPayload = {
      assessor_id: "ASS-004",
      estimate_id: "EST-202401004",
      judgment_reason: "過去案件データから地域補正係数1.15を適用して判定した結果、相場範囲内に収まる",
      learning_data_category: "相場乖離パターン",
      confidence_score: 92,
    };

    fetchMock.mockResponseOnce(
      JSON.stringify({
        status: 201,
        error_code: null,
        error_message: null,
        learning_data_id: "LD-202401-001",
        registered_at: "2024-01-15T11:00:00Z",
      }),
      { status: 201 }
    );

    const successResult = await validateAndRegisterLearningData(
      validReasonPayload
    );

    expect(successResult).toBeDefined();
    expect(successResult.status).toBe(201);
    expect(successResult.learning_data_id).toBe("LD-202401-001");
    expect(successResult.registered_at).toBe("2024-01-15T11:00:00Z");
  });
});