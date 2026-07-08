import { calculatePrecisionImprovementDegree } from "../../src/logic/it-6-2-2-2";

const fetchMock = require("jest-fetch-mock");

describe("修正前後精度改善度計測・可視化機能", () => {
  test("SCEN-1430: 修正前後の精度データが取得できない場合にエラーが返される", async () => {
    fetchMock.resetMocks();

    // 修正前の精度データが存在しない場合
    fetchMock.mockResponseOnce(
      JSON.stringify({
        error_code: 400,
        error_message: "精度データが利用できません",
        missing_data_type: "pre_modification_precision",
      }),
      { status: 400 }
    );

    const requestPayload = {
      assessment_case_id: "case_20240115_001",
      data_type: "pre_modification",
    };

    let response = await fetch("/api/precision-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestPayload),
    });

    let responseData = await response.json();

    expect(response.status).toBe(400);
    expect(responseData.error_code).toBe(400);
    expect(responseData.error_message).toMatch(/精度データが利用できません/);
    expect(responseData.missing_data_type).toBe("pre_modification_precision");

    // 修正後の精度データが存在しない場合
    fetchMock.resetMocks();
    fetchMock.mockResponseOnce(
      JSON.stringify({
        error_code: 400,
        error_message: "精度データが利用できません",
        missing_data_type: "post_modification_precision",
      }),
      { status: 400 }
    );

    const postModRequestPayload = {
      assessment_case_id: "case_20240115_002",
      data_type: "post_modification",
    };

    response = await fetch("/api/precision-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(postModRequestPayload),
    });

    responseData = await response.json();

    expect(response.status).toBe(400);
    expect(responseData.error_code).toBe(400);
    expect(responseData.error_message).toMatch(/精度データが利用できません/);
    expect(responseData.missing_data_type).toBe("post_modification_precision");

    // calculatePrecisionImprovementDegree 関数への null/undefined 入力テスト
    expect(() =>
      calculatePrecisionImprovementDegree(
        null as any,
        { ocr_accuracy: 85.5, ai_judgment_accuracy: 82.3 }
      )
    ).toThrow(/精度データ/);

    expect(() =>
      calculatePrecisionImprovementDegree(
        { ocr_accuracy: 80.0, ai_judgment_accuracy: 78.5 },
        null as any
      )
    ).toThrow(/精度データ/);

    // 修正前後のデータセットが不完全な場合
    expect(() =>
      calculatePrecisionImprovementDegree(
        { ocr_accuracy: 80.0 } as any,
        { ocr_accuracy: 85.5, ai_judgment_accuracy: 82.3 }
      )
    ).toThrow(/精度データ/);

    // 修正後のデータセットが不完全な場合
    expect(() =>
      calculatePrecisionImprovementDegree(
        { ocr_accuracy: 80.0, ai_judgment_accuracy: 78.5 },
        { ai_judgment_accuracy: 82.3 } as any
      )
    ).toThrow(/精度データ/);

    // 修正前後両方のデータが存在する場合は正常に計算される
    const result = calculatePrecisionImprovementDegree(
      { ocr_accuracy: 80.0, ai_judgment_accuracy: 78.5 },
      { ocr_accuracy: 85.5, ai_judgment_accuracy: 82.3 }
    );

    expect(result).toBeDefined();
    expect(typeof result.ocr_improvement_rate).toBe("number");
    expect(typeof result.ai_judgment_improvement_rate).toBe("number");
    expect(result.ocr_improvement_rate).toBe(6.875);
    expect(result.ai_judgment_improvement_rate).toBe(4.841);
  });
});