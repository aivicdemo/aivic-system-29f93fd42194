import { describe, test, expect } from "@jest/globals";
import { validateContractChangeRequiredFields } from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データ入力時の品質検証ルール定義・実行機能", () => {
  test("SCEN-1230: 契約変更内容の必須項目検証機能 - 必須項目不足時にエラー発生", () => {
    // 必須項目を1つ以上不足させたテストデータ
    const incompleteContractChange = {
      contractId: "C-2024-001",
      changeDate: "2024-01-15T09:00:00Z",
      // changeType が不足（必須項目）
      // changedFields が不足（必須項目）
      changeReason: "顧客要望による変更",
      approvalStatus: "pending",
    };

    // 検証エラーが発生することを確認
    expect(() => {
      validateContractChangeRequiredFields(incompleteContractChange);
    }).toThrow(/必須項目/);

    // 複数必須項目が不足しているテストケース
    const severelyIncompleteContractChange = {
      contractId: "C-2024-002",
      // changeDate が不足（必須項目）
      // changeType が不足（必須項目）
      // changedFields が不足（必須項目）
      approvalStatus: "pending",
    };

    expect(() => {
      validateContractChangeRequiredFields(severelyIncompleteContractChange);
    }).toThrow(/必須項目/);

    // 必須項目が null の場合
    const nullRequiredFieldContractChange = {
      contractId: "C-2024-003",
      changeDate: null,
      changeType: "pricing",
      changedFields: ["price"],
      changeReason: "顧客要望による変更",
      approvalStatus: "pending",
    };

    expect(() => {
      validateContractChangeRequiredFields(nullRequiredFieldContractChange);
    }).toThrow(/必須項目/);

    // 必須項目が空文字列の場合
    const emptyStringRequiredFieldContractChange = {
      contractId: "",
      changeDate: "2024-01-15T09:00:00Z",
      changeType: "pricing",
      changedFields: ["price"],
      changeReason: "顧客要望による変更",
      approvalStatus: "pending",
    };

    expect(() => {
      validateContractChangeRequiredFields(emptyStringRequiredFieldContractChange);
    }).toThrow(/必須項目/);

    // 必須項目が空配列の場合
    const emptyArrayRequiredFieldContractChange = {
      contractId: "C-2024-004",
      changeDate: "2024-01-15T09:00:00Z",
      changeType: "pricing",
      changedFields: [],
      changeReason: "顧客要望による変更",
      approvalStatus: "pending",
    };

    expect(() => {
      validateContractChangeRequiredFields(emptyArrayRequiredFieldContractChange);
    }).toThrow(/必須項目/);

    // すべての必須項目が正常に揃っているテストケース（成功ケース）
    const completeContractChange = {
      contractId: "C-2024-005",
      changeDate: "2024-01-15T09:00:00Z",
      changeType: "pricing",
      changedFields: ["price", "discountRate"],
      changeReason: "顧客要望による変更",
      approvalStatus: "pending",
      effectiveDate: "2024-02-01T00:00:00Z",
    };

    const validationResult = validateContractChangeRequiredFields(
      completeContractChange
    );
    expect(validationResult).toEqual({
      isValid: true,
      errors: [],
      missingFields: [],
    });

    // 最小限の必須項目のみを含むテストケース（成功ケース）
    const minimalCompleteContractChange = {
      contractId: "C-2024-006",
      changeDate: "2024-01-15T09:00:00Z",
      changeType: "delivery",
      changedFields: ["deliveryDate"],
      approvalStatus: "pending",
    };

    const minimalValidationResult = validateContractChangeRequiredFields(
      minimalCompleteContractChange
    );
    expect(minimalValidationResult).toEqual({
      isValid: true,
      errors: [],
      missingFields: [],
    });

    // 不足している複数の必須項目が検証エラーメッセージに含まれることを確認
    const multipleFieldsMissingContractChange = {
      contractId: "C-2024-007",
      // changeDate が不足
      // changeType が不足
      changedFields: ["price"],
      approvalStatus: "pending",
    };

    expect(() => {
      validateContractChangeRequiredFields(multipleFieldsMissingContractChange);
    }).toThrow(/必須項目/);

    // エラーレスポンスのステータスコードが400番台であることを確認
    try {
      validateContractChangeRequiredFields(incompleteContractChange);
      fail("例外がスローされるべき");
    } catch (error) {
      if (error instanceof Error && "statusCode" in error) {
        const typedError = error as Error & { statusCode: number };
        expect(typedError.statusCode).toBeGreaterThanOrEqual(400);
        expect(typedError.statusCode).toBeLessThan(500);
      }
    }
  });
});