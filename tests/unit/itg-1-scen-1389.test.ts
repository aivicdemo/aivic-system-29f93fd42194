import { defineTemplate } from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレート定義・管理機能", () => {
  test("SCEN-1389: 無効な計算ロジックを含むテンプレートが拒否される", () => {
    // 無効な計算ロジック: ゼロ除算
    const invalid_division_by_zero = {
      template_name: "無効計算ロジックテスト",
      items: [
        {
          item_key: "revenue_total",
          calculation_logic: "sales / 0",
          formula_type: "arithmetic",
        },
      ],
    };

    // ゼロ除算エラーが発生することを確認
    expect(() => defineTemplate(invalid_division_by_zero)).toThrow(
      /ゼロで割る|除算エラー|計算式が無効/
    );

    // 未定義の変数参照
    const invalid_undefined_variable = {
      template_name: "無効計算ロジックテスト",
      items: [
        {
          item_key: "revenue_total",
          calculation_logic: "undefined_variable + 100",
          formula_type: "arithmetic",
        },
      ],
    };

    expect(() => defineTemplate(invalid_undefined_variable)).toThrow(
      /変数が定義|未定義|参照エラー/
    );

    // 不正な関数呼び出し
    const invalid_function_call = {
      template_name: "無効計算ロジックテスト",
      items: [
        {
          item_key: "revenue_total",
          calculation_logic: "nonExistentFunction(sales)",
          formula_type: "function",
        },
      ],
    };

    expect(() => defineTemplate(invalid_function_call)).toThrow(
      /関数が定義|不正な関数|存在しません/
    );

    // 計算式が空の場合
    const invalid_empty_formula = {
      template_name: "無効計算ロジックテスト",
      items: [
        {
          item_key: "revenue_total",
          calculation_logic: "",
          formula_type: "arithmetic",
        },
      ],
    };

    expect(() => defineTemplate(invalid_empty_formula)).toThrow(
      /計算式|空の値|入力必須/
    );

    // 有効なテンプレートが正常に定義できることを確認（正常系）
    const valid_template = {
      template_name: "有効なテンプレート",
      items: [
        {
          item_key: "revenue_total",
          calculation_logic: "sum(sales_amount)",
          formula_type: "function",
        },
        {
          item_key: "profit",
          calculation_logic: "revenue_total - cost_amount",
          formula_type: "arithmetic",
        },
      ],
    };

    const result = defineTemplate(valid_template);
    expect(result).toBeDefined();
    expect(result.template_name).toBe("有効なテンプレート");
    expect(result.items).toHaveLength(2);
    expect(result.items[0].item_key).toBe("revenue_total");
    expect(result.items[0].calculation_logic).toBe("sum(sales_amount)");
    expect(result.items[1].item_key).toBe("profit");
    expect(result.items[1].calculation_logic).toBe("revenue_total - cost_amount");
    expect(result.is_valid).toBe(true);
    expect(result.template_id).toBeDefined();
    expect(typeof result.template_id).toBe("string");
  });
});