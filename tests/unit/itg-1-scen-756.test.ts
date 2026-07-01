import { createMonthlySummaryTemplate } from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレート定義・管理", () => {
  // SCEN-756
  test("月次サマリーテンプレート項目の表示順序が負の数または不正な値で設定されている場合、テンプレート登録時にバリデーションエラーが発生する", () => {
    const validTemplateBase = {
      template_name: "Test Template",
      template_items: [
        {
          item_id: "item_001",
          item_label: "営業成果指標",
          display_order: 1,
          is_visible: true,
        },
        {
          item_id: "item_002",
          item_label: "請求集計結果",
          display_order: 2,
          is_visible: true,
        },
      ],
      created_by: "user_123",
      created_at: new Date("2024-01-15T10:00:00Z"),
    };

    // ケース1: 表示順序が負の数（-1）
    const templateWithNegativeOrder = {
      ...validTemplateBase,
      template_items: [
        {
          item_id: "item_001",
          item_label: "営業成果指標",
          display_order: -1,
          is_visible: true,
        },
        {
          item_id: "item_002",
          item_label: "請求集計結果",
          display_order: 2,
          is_visible: true,
        },
      ],
    };

    expect(() => createMonthlySummaryTemplate(templateWithNegativeOrder)).toThrow(
      /表示順序/
    );

    // ケース2: 表示順序が文字列（不正な値）
    const templateWithStringOrder = {
      ...validTemplateBase,
      template_items: [
        {
          item_id: "item_001",
          item_label: "営業成果指標",
          display_order: "abc" as any,
          is_visible: true,
        },
        {
          item_id: "item_002",
          item_label: "請求集計結果",
          display_order: 2,
          is_visible: true,
        },
      ],
    };

    expect(() => createMonthlySummaryTemplate(templateWithStringOrder)).toThrow(
      /表示順序/
    );

    // ケース3: 表示順序が特殊文字
    const templateWithSpecialCharOrder = {
      ...validTemplateBase,
      template_items: [
        {
          item_id: "item_001",
          item_label: "営業成果指標",
          display_order: "@#$" as any,
          is_visible: true,
        },
        {
          item_id: "item_002",
          item_label: "請求集計結果",
          display_order: 2,
          is_visible: true,
        },
      ],
    };

    expect(() =>
      createMonthlySummaryTemplate(templateWithSpecialCharOrder)
    ).toThrow(/表示順序/);

    // ケース4: 表示順序がnull
    const templateWithNullOrder = {
      ...validTemplateBase,
      template_items: [
        {
          item_id: "item_001",
          item_label: "営業成果指標",
          display_order: null as any,
          is_visible: true,
        },
        {
          item_id: "item_002",
          item_label: "請求集計結果",
          display_order: 2,
          is_visible: true,
        },
      ],
    };

    expect(() => createMonthlySummaryTemplate(templateWithNullOrder)).toThrow(
      /表示順序/
    );

    // ケース5: 表示順序が0（正常系）- 成功すべき
    const templateWithZeroOrder = {
      ...validTemplateBase,
      template_items: [
        {
          item_id: "item_001",
          item_label: "営業成果指標",
          display_order: 0,
          is_visible: true,
        },
        {
          item_id: "item_002",
          item_label: "請求集計結果",
          display_order: 1,
          is_visible: true,
        },
      ],
    };

    const result = createMonthlySummaryTemplate(templateWithZeroOrder);
    expect(result).toBeDefined();
    expect(result.template_id).toBeDefined();
    expect(result.template_name).toBe("Test Template");
    expect(result.template_items).toHaveLength(2);
    expect(result.template_items[0].display_order).toBe(0);
    expect(result.template_items[1].display_order).toBe(1);

    // ケース6: 表示順序が正の整数（正常系）- 成功すべき
    const templateWithValidOrder = {
      ...validTemplateBase,
      template_items: [
        {
          item_id: "item_001",
          item_label: "営業成果指標",
          display_order: 1,
          is_visible: true,
        },
        {
          item_id: "item_002",
          item_label: "請求集計結果",
          display_order: 2,
          is_visible: true,
        },
      ],
    };

    const resultValid = createMonthlySummaryTemplate(templateWithValidOrder);
    expect(resultValid).toBeDefined();
    expect(resultValid.template_id).toBeDefined();
    expect(resultValid.template_name).toBe("Test Template");
    expect(resultValid.template_items).toHaveLength(2);
    expect(resultValid.template_items[0].display_order).toBe(1);
    expect(resultValid.template_items[1].display_order).toBe(2);
  });
});