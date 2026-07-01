import { describe, test, expect } from "@jest/globals";
import { validateSalesActivityInput } from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データ入力時の品質検証ルール定義・実行機能", () => {
  test("SCEN-687: 商談内容に特殊文字のみが入力された場合に形式誤りとして検出される", () => {
    const input = {
      customerName: "テスト顧客",
      contactDateTime: "2024-01-15T10:00:00Z",
      dealContent: "!@#$%^&*()",
      appointmentStatus: "confirmed",
    };

    const result = validateSalesActivityInput(input);

    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fieldName: "dealContent",
          errorType: "format",
          message: expect.stringMatching(/形式/),
        }),
      ])
    );
    expect(result.canSubmit).toBe(false);
    expect(result.detectedFields).toContain("dealContent");
  });
});