import { describe, it, expect } from "@jest/globals";
import { validateSalesDataInput } from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データ入力時の品質検証ルール定義・実行機能", () => {
  it("SCEN-691: 必須項目（顧客名、接触日時、成果内容）のいずれかが欠落した場合に検証エラーが検出される", () => {
    // ケース1: 接触日時と成果内容が空
    const input1 = {
      customer_name: "テスト顧客",
      contact_datetime: "",
      achievement_content: "",
    };
    expect(() => validateSalesDataInput(input1)).toThrow(/成果内容/);

    // ケース2: 接触日時が空
    const input2 = {
      customer_name: "テスト顧客",
      contact_datetime: "",
      achievement_content: "提案資料提出",
    };
    expect(() => validateSalesDataInput(input2)).toThrow(/接触日時/);

    // ケース3: 顧客名が空
    const input3 = {
      customer_name: "",
      contact_datetime: "2024-01-15T10:00:00Z",
      achievement_content: "提案資料提出",
    };
    expect(() => validateSalesDataInput(input3)).toThrow(/顧客名/);

    // 成功ケース: すべての必須項目が入力されている
    const inputValid = {
      customer_name: "テスト顧客",
      contact_datetime: "2024-01-15T10:00:00Z",
      achievement_content: "提案資料提出",
    };
    const result = validateSalesDataInput(inputValid);
    expect(result).toEqual({
      is_valid: true,
      errors: [],
    });
  });
});