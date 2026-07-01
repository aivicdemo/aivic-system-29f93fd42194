import { applySummaryTemplateFormatting } from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレートの定義・管理機能", () => {
  test("SCEN-1388: テンプレート項目の表示順序とフォーマットが正確に適用される", () => {
    // テンプレート項目の定義：3件以上の項目を設定
    const templateItems = [
      {
        itemId: "item_001",
        itemName: "営業実績",
        displayOrder: 1,
        format: "number",
        formatPattern: "#,##0",
      },
      {
        itemId: "item_002",
        itemName: "請求額合計",
        displayOrder: 2,
        format: "currency",
        formatPattern: "¥#,##0",
      },
      {
        itemId: "item_003",
        itemName: "集計対象期間",
        displayOrder: 3,
        format: "date",
        formatPattern: "yyyy-MM-dd",
      },
      {
        itemId: "item_004",
        itemName: "成約件数",
        displayOrder: 4,
        format: "number",
        formatPattern: "#,##0",
      },
    ];

    // 月次サマリーテンプレートの定義
    const summaryTemplate = {
      templateId: "tpl_monthly_summary_001",
      templateName: "標準月次サマリーテンプレート",
      templateItems: templateItems,
      createdAt: new Date("2024-01-15T10:00:00Z"),
      updatedAt: new Date("2024-01-15T10:00:00Z"),
    };

    // テンプレートが保存されると仮定
    // サマリーレポート用の生データ
    const rawData = {
      item_001: 1250,
      item_002: 500000,
      item_003: new Date("2024-01-15"),
      item_004: 42,
    };

    // テンプレートを適用してフォーマット済みレポートを生成
    const formattedReport = applySummaryTemplateFormatting(
      summaryTemplate,
      rawData
    );

    // 期待結果1: 項目が定義した表示順序通りに配列されていること
    expect(formattedReport.items).toHaveLength(4);
    expect(formattedReport.items[0].displayOrder).toBe(1);
    expect(formattedReport.items[0].itemId).toBe("item_001");
    expect(formattedReport.items[1].displayOrder).toBe(2);
    expect(formattedReport.items[1].itemId).toBe("item_002");
    expect(formattedReport.items[2].displayOrder).toBe(3);
    expect(formattedReport.items[2].itemId).toBe("item_003");
    expect(formattedReport.items[3].displayOrder).toBe(4);
    expect(formattedReport.items[3].itemId).toBe("item_004");

    // 期待結果2: 各項目が指定されたフォーマットで正確に適用されていること
    // item_001: 数値フォーマット（カンマ区切り）
    expect(formattedReport.items[0].formattedValue).toBe("1,250");
    expect(formattedReport.items[0].format).toBe("number");

    // item_002: 通貨フォーマット（¥記号付き）
    expect(formattedReport.items[1].formattedValue).toBe("¥500,000");
    expect(formattedReport.items[1].format).toBe("currency");

    // item_003: 日付フォーマット（yyyy-MM-dd）
    expect(formattedReport.items[2].formattedValue).toBe("2024-01-15");
    expect(formattedReport.items[2].format).toBe("date");

    // item_004: 数値フォーマット（カンマ区切り）
    expect(formattedReport.items[3].formattedValue).toBe("42");
    expect(formattedReport.items[3].format).toBe("number");

    // 期待結果3: プレビューで表示される順序が保持されていること
    const previewOrder = formattedReport.items.map(
      (item: { displayOrder: number }) => item.displayOrder
    );
    expect(previewOrder).toEqual([1, 2, 3, 4]);

    // 期待結果4: 生成されたレポートでもテンプレート設定が維持されていること
    expect(formattedReport.templateId).toBe("tpl_monthly_summary_001");
    expect(formattedReport.items.every(
      (item: { itemName: string }) =>
        typeof item.itemName === "string" && item.itemName.length > 0
    )).toBe(true);

    // 期待結果5: フォーマット一貫性の検証
    formattedReport.items.forEach(
      (item: {
        format: string;
        formattedValue: string;
        displayOrder: number;
      }) => {
        expect(item.format).toMatch(/^(number|currency|date)$/);
        expect(item.formattedValue).toBeTruthy();
        expect(typeof item.displayOrder).toBe("number");
      }
    );

    // 期待結果6: 元データとフォーマット済みデータの対応関係が正確
    const rawValue001 = rawData.item_001;
    const expectedFormatted001 = "1,250";
    expect(formattedReport.items[0].formattedValue).toBe(expectedFormatted001);

    const rawValue002 = rawData.item_002;
    const expectedFormatted002 = "¥500,000";
    expect(formattedReport.items[1].formattedValue).toBe(expectedFormatted002);

    const rawValue003 = rawData.item_003;
    const expectedFormatted003 = "2024-01-15";
    expect(formattedReport.items[2].formattedValue).toBe(expectedFormatted003);

    const rawValue004 = rawData.item_004;
    const expectedFormatted004 = "42";
    expect(formattedReport.items[3].formattedValue).toBe(expectedFormatted004);
  });
});