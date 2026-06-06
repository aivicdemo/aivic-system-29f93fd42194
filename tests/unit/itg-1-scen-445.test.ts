import { validateInventoryCountInput } from "../../src/logic/it-1-br-1-2-1";

describe("作業完了実績の登録と次工程引き継ぎ情報の記録機能", () => {
  test("棚卸データ妥当性検証機能 - 異常値を含む棚卸データでエラー検出される", () => {
    // SCEN-445
    
    // 負の数量でエラー検出される
    expect(() => 
      validateInventoryCountInput("ITEM001", -10, 20, new Date("2024-01-10"))
    ).toThrow(/数量/);

    // 文字列の数量（型エラーは実際には数値型なのでゼロで検証）
    const invalidQuantityResult = validateInventoryCountInput("ITEM002", 0, 15, new Date("2024-01-10"));
    expect(invalidQuantityResult.isValid).toBe(false);
    expect(invalidQuantityResult.errorMessages).toContain("数量は0以上で入力してください");

    // 存在しない商品コードは関数内で検証される想定
    expect(() => 
      validateInventoryCountInput("", 10, 15, new Date("2024-01-10"))
    ).toThrow(/品目コード/);

    // 未来の日付でエラー検出
    const futureDate = new Date("2025-12-31");
    expect(() => 
      validateInventoryCountInput("ITEM003", 10, 15, futureDate)
    ).toThrow(/確認日時/);

    // 正常データでの検証
    const validResult = validateInventoryCountInput("ITEM004", 25, 20, new Date("2024-01-10"));
    expect(validResult.isValid).toBe(true);
    expect(validResult.errorMessages).toEqual([]);
    expect(validResult.warningMessages).toEqual([]);
    expect(validResult.variancePercentage).toBe(25);

    // 大きな差異での警告検証
    const highVarianceResult = validateInventoryCountInput("ITEM005", 50, 20, new Date("2024-01-10"));
    expect(highVarianceResult.isValid).toBe(false);
    expect(highVarianceResult.errorMessages).toContain("差異が50%を超えています。再確認してください");
    expect(highVarianceResult.variancePercentage).toBe(150);

    // 中程度の差異での警告検証
    const mediumVarianceResult = validateInventoryCountInput("ITEM006", 25, 20, new Date("2024-01-10"));
    expect(mediumVarianceResult.isValid).toBe(true);
    expect(mediumVarianceResult.warningMessages).toContain("差異が20%を超えています。確認をお願いします");
    expect(mediumVarianceResult.variancePercentage).toBe(25);
  });
});