import { validateAndStructureVerificationResultRationale } from "../../src/logic/it-1781935279444-2-2-1";

describe("検証結果根拠資料構造化機能", () => {
  // SCEN-1208
  test("検証結果の判定値が不正な場合、エラーが発生する", () => {
    const validInput = {
      verificationId: "VER-001",
      customerId: "CUST-001",
      verificationDate: "2024-01-15T10:00:00Z",
      verificationRuleId: "RULE-001",
      sourceDataExtracted: true,
      contractContentConfirmed: true,
    };

    // ケース1: null判定値
    expect(() =>
      validateAndStructureVerificationResultRationale({
        ...validInput,
        judgmentResult: null,
      })
    ).toThrow(/判定値/);

    // ケース2: undefined判定値
    expect(() =>
      validateAndStructureVerificationResultRationale({
        ...validInput,
        judgmentResult: undefined,
      })
    ).toThrow(/判定値/);

    // ケース3: 空文字列判定値
    expect(() =>
      validateAndStructureVerificationResultRationale({
        ...validInput,
        judgmentResult: "",
      })
    ).toThrow(/判定値/);

    // ケース4: 想定外の形式（数値）
    expect(() =>
      validateAndStructureVerificationResultRationale({
        ...validInput,
        judgmentResult: 123,
      })
    ).toThrow(/判定値/);

    // ケース5: 想定外の形式（オブジェクト）
    expect(() =>
      validateAndStructureVerificationResultRationale({
        ...validInput,
        judgmentResult: {},
      })
    ).toThrow(/判定値/);

    // ケース6: 許可されていない文字列値
    expect(() =>
      validateAndStructureVerificationResultRationale({
        ...validInput,
        judgmentResult: "invalid_status",
      })
    ).toThrow(/判定値/);

    // ケース7: 正当な判定値（正確）での成功ケース
    const resultAccurate = validateAndStructureVerificationResultRationale({
      ...validInput,
      judgmentResult: "accurate",
    });
    expect(resultAccurate).toBeDefined();
    expect(resultAccurate.judgmentResult).toBe("accurate");
    expect(resultAccurate.structuredRationale).toBeDefined();

    // ケース8: 正当な判定値（誤り）での成功ケース
    const resultError = validateAndStructureVerificationResultRationale({
      ...validInput,
      judgmentResult: "error",
    });
    expect(resultError).toBeDefined();
    expect(resultError.judgmentResult).toBe("error");
    expect(resultError.structuredRationale).toBeDefined();

    // ケース9: 正当な判定値（要確認）での成功ケース
    const resultNeedsReview = validateAndStructureVerificationResultRationale({
      ...validInput,
      judgmentResult: "needs_review",
    });
    expect(resultNeedsReview).toBeDefined();
    expect(resultNeedsReview.judgmentResult).toBe("needs_review");
    expect(resultNeedsReview.structuredRationale).toBeDefined();

    // ケース10: 必須フィールド不足時のエラー
    expect(() =>
      validateAndStructureVerificationResultRationale({
        verificationId: "VER-002",
        judgmentResult: "accurate",
      })
    ).toThrow(/必須/);
  });
});