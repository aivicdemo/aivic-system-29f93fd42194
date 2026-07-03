import { describe, test, expect } from "@jest/globals";
import { validateDiscountAndRecordMismatch } from "../../src/logic/it-1781935279444-2-2-1";

describe("割引判定・照合機能 - 契約内容と請求情報が不一致の場合、修正対象として記録される", () => {
  // SCEN-1261
  test("should detect discount mismatch between contract and billing info and record correction target", () => {
    // テストデータ準備: 契約ID、契約内容（割引率、有効期限等）、対応する請求情報
    const contractId = "CONTRACT-001";
    const contractDiscountRate = 10;
    const contractValidityStart = new Date("2024-01-01T00:00:00Z");
    const contractValidityEnd = new Date("2024-12-31T23:59:59Z");

    const billingInfo = {
      contractId: "CONTRACT-001",
      billingDiscountRate: 15,
      billingAmount: 100000,
      appliedDate: new Date("2024-06-15T00:00:00Z"),
    };

    const input = {
      contractId: contractId,
      contractTerms: {
        discountRate: contractDiscountRate,
        validityStart: contractValidityStart,
        validityEnd: contractValidityEnd,
      },
      billingInfo: billingInfo,
    };

    // 割引判定・照合機能を実行
    const result = validateDiscountAndRecordMismatch(input);

    // 照合ロジックが契約内容と請求情報の差分を検出することを確認
    expect(result.mismatchDetected).toBe(true);
    expect(result.mismatchField).toBe("discountRate");

    // 検出された不一致情報が修正対象レコードとして記録されることを確認
    expect(result.correctionRecord).toBeDefined();

    // 修正対象レコードに以下の属性が正しく設定されていることを検証：
    // 修正前値
    expect(result.correctionRecord.beforeValue).toBe(15);

    // 修正後値
    expect(result.correctionRecord.afterValue).toBe(10);

    // 不一致項目名
    expect(result.correctionRecord.mismatchFieldName).toBe("discountRate");

    // レコード識別子
    expect(result.correctionRecord.recordId).toBe("CONTRACT-001");

    // タイムスタンプ
    expect(result.correctionRecord.recordedAt).toBeDefined();
    expect(typeof result.correctionRecord.recordedAt).toBe("string");

    // 期待結果: 記録されたレコードは、不一致の詳細情報を完全に含む
    expect(result.correctionRecord.details).toEqual({
      contractDiscountRate: 10,
      billingDiscountRate: 15,
      difference: -5,
      contractValidityPeriod: {
        start: contractValidityStart.toISOString(),
        end: contractValidityEnd.toISOString(),
      },
      billingAppliedDate: new Date("2024-06-15T00:00:00Z").toISOString(),
    });

    // 修正対象レコードの status が 'pending_correction' であることを確認
    expect(result.correctionRecord.status).toBe("pending_correction");
  });
});