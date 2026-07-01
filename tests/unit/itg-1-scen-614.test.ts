import { generateMonthlySummaryReport } from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレートの定義・管理機能", () => {
  // SCEN-614: [normal] 月次サマリー自動生成 - 複数の月次サマリーテンプレート項目が定義通りの順序と計算で集計される
  test("SCEN-614: 複数テンプレート項目が定義順序・計算ロジック通りに集計される", () => {
    const transactionData = [
      { id: 1, amount: 10000, quantity: 100, discount: 1000 },
      { id: 2, amount: 12000, quantity: 120, discount: 1200 },
      { id: 3, amount: 8000, quantity: 80, discount: 800 },
      { id: 4, amount: 15000, quantity: 150, discount: 1500 },
      { id: 5, amount: 11000, quantity: 110, discount: 1100 },
      { id: 6, amount: 9500, quantity: 95, discount: 950 },
      { id: 7, amount: 13000, quantity: 130, discount: 1300 },
      { id: 8, amount: 10500, quantity: 105, discount: 1050 },
      { id: 9, amount: 14000, quantity: 140, discount: 1400 },
      { id: 10, amount: 11500, quantity: 115, discount: 1150 },
      { id: 11, amount: 12500, quantity: 125, discount: 1250 },
      { id: 12, amount: 9000, quantity: 90, discount: 900 },
      { id: 13, amount: 16000, quantity: 160, discount: 1600 },
      { id: 14, amount: 10000, quantity: 100, discount: 1000 },
      { id: 15, amount: 13500, quantity: 135, discount: 1350 },
      { id: 16, amount: 11000, quantity: 110, discount: 1100 },
      { id: 17, amount: 15500, quantity: 155, discount: 1550 },
      { id: 18, amount: 9500, quantity: 95, discount: 950 },
      { id: 19, amount: 12000, quantity: 120, discount: 1200 },
      { id: 20, amount: 14500, quantity: 145, discount: 1450 },
    ];

    const templateItemsPattern1 = [
      {
        item_id: 1,
        item_name: "売上合計",
        calculation_type: "sum",
        source_field: "amount",
        display_order: 1,
      },
      {
        item_id: 2,
        item_name: "売上数量",
        calculation_type: "sum",
        source_field: "quantity",
        display_order: 2,
      },
      {
        item_id: 3,
        item_name: "平均単価",
        calculation_type: "average",
        source_field: "amount",
        display_order: 3,
      },
      {
        item_id: 4,
        item_name: "割引合計",
        calculation_type: "sum",
        source_field: "discount",
        display_order: 4,
      },
      {
        item_id: 5,
        item_name: "実売上",
        calculation_type: "custom",
        formula: "(sum(amount) - sum(discount))",
        display_order: 5,
      },
    ];

    const templateItemsPattern2 = [
      {
        item_id: 1,
        item_name: "売上数量",
        calculation_type: "sum",
        source_field: "quantity",
        display_order: 1,
      },
      {
        item_id: 2,
        item_name: "割引合計",
        calculation_type: "sum",
        source_field: "discount",
        display_order: 2,
      },
      {
        item_id: 3,
        item_name: "売上合計",
        calculation_type: "sum",
        source_field: "amount",
        display_order: 3,
      },
      {
        item_id: 4,
        item_name: "平均単価",
        calculation_type: "average",
        source_field: "amount",
        display_order: 4,
      },
      {
        item_id: 5,
        item_name: "実売上",
        calculation_type: "custom",
        formula: "(sum(amount) - sum(discount))",
        display_order: 5,
      },
    ];

    const templateItemsPattern3 = [
      {
        item_id: 1,
        item_name: "実売上",
        calculation_type: "custom",
        formula: "(sum(amount) - sum(discount))",
        display_order: 1,
      },
      {
        item_id: 2,
        item_name: "売上合計",
        calculation_type: "sum",
        source_field: "amount",
        display_order: 2,
      },
      {
        item_id: 3,
        item_name: "割引合計",
        calculation_type: "sum",
        source_field: "discount",
        display_order: 3,
      },
      {
        item_id: 4,
        item_name: "売上数量",
        calculation_type: "sum",
        source_field: "quantity",
        display_order: 4,
      },
      {
        item_id: 5,
        item_name: "平均単価",
        calculation_type: "average",
        source_field: "amount",
        display_order: 5,
      },
    ];

    // 計算値の準備
    const totalAmount = 237500;
    const totalQuantity = 2280;
    const averagePrice = 237500 / 20;
    const totalDiscount = 23750;
    const actualSales = totalAmount - totalDiscount;

    // パターン1の検証
    const reportPattern1 = generateMonthlySummaryReport({
      transactions: transactionData,
      template_items: templateItemsPattern1,
      period_start: "2024-01-01",
      period_end: "2024-01-31",
    });

    expect(reportPattern1.items).toHaveLength(5);
    expect(reportPattern1.items[0].item_name).toBe("売上合計");
    expect(reportPattern1.items[0].display_order).toBe(1);
    expect(reportPattern1.items[0].calculated_value).toBe(237500);
    expect(reportPattern1.items[1].item_name).toBe("売上数量");
    expect(reportPattern1.items[1].display_order).toBe(2);
    expect(reportPattern1.items[1].calculated_value).toBe(2280);
    expect(reportPattern1.items[2].item_name).toBe("平均単価");
    expect(reportPattern1.items[2].display_order).toBe(3);
    expect(reportPattern1.items[2].calculated_value).toBe(11875);
    expect(reportPattern1.items[3].item_name).toBe("割引合計");
    expect(reportPattern1.items[3].display_order).toBe(4);
    expect(reportPattern1.items[3].calculated_value).toBe(23750);
    expect(reportPattern1.items[4].item_name).toBe("実売上");
    expect(reportPattern1.items[4].display_order).toBe(5);
    expect(reportPattern1.items[4].calculated_value).toBe(213750);

    // パターン2の検証（異なる順序）
    const reportPattern2 = generateMonthlySummaryReport({
      transactions: transactionData,
      template_items: templateItemsPattern2,
      period_start: "2024-01-01",
      period_end: "2024-01-31",
    });

    expect(reportPattern2.items).toHaveLength(5);
    expect(reportPattern2.items[0].item_name).toBe("売上数量");
    expect(reportPattern2.items[0].display_order).toBe(1);
    expect(reportPattern2.items[0].calculated_value).toBe(2280);
    expect(reportPattern2.items[1].item_name).toBe("割引合計");
    expect(reportPattern2.items[1].display_order).toBe(2);
    expect(reportPattern2.items[1].calculated_value).toBe(23750);
    expect(reportPattern2.items[2].item_name).toBe("売上合計");
    expect(reportPattern2.items[2].display_order).toBe(3);
    expect(reportPattern2.items[2].calculated_value).toBe(237500);
    expect(reportPattern2.items[3].item_name).toBe("平均単価");
    expect(reportPattern2.items[3].display_order).toBe(4);
    expect(reportPattern2.items[3].calculated_value).toBe(11875);
    expect(reportPattern2.items[4].item_name).toBe("実売上");
    expect(reportPattern2.items[4].display_order).toBe(5);
    expect(reportPattern2.items[4].calculated_value).toBe(213750);

    // パターン3の検証（カスタム計算が最初）
    const reportPattern3 = generateMonthlySummaryReport({
      transactions: transactionData,
      template_items: templateItemsPattern3,
      period_start: "2024-01-01",
      period_end: "2024-01-31",
    });

    expect(reportPattern3.items).toHaveLength(5);
    expect(reportPattern3.items[0].item_name).toBe("実売上");
    expect(reportPattern3.items[0].display_order).toBe(1);
    expect(reportPattern3.items[0].calculated_value).toBe(213750);
    expect(reportPattern3.items[1].item_name).toBe("売上合計");
    expect(reportPattern3.items[1].display_order).toBe(2);
    expect(reportPattern3.items[1].calculated_value).toBe(237500);
    expect(reportPattern3.items[2].item_name).toBe("割引合計");
    expect(reportPattern3.items[2].display_order).toBe(3);
    expect(reportPattern3.items[2].calculated_value).toBe(23750);
    expect(reportPattern3.items[3].item_name).toBe("売上数量");
    expect(reportPattern3.items[3].display_order).toBe(4);
    expect(reportPattern3.items[3].calculated_value).toBe(2280);
    expect(reportPattern3.items[4].item_name).toBe("平均単価");
    expect(reportPattern3.items[4].display_order).toBe(5);
    expect(reportPattern3.items[4].calculated_value).toBe(11875);

    // すべてのパターンで display_order が定義通りであることを確認
    const verifyOrder = (report: any, expectedNames: string[]) => {
      const orderedNames = report.items
        .sort((a: any, b: any) => a.display_order - b.display_order)
        .map((item: any) => item.item_name);
      expect(orderedNames).toEqual(expectedNames);
    };

    verifyOrder(reportPattern1, [
      "売上合計",
      "売上数量",
      "平均単価",
      "割引合計",
      "実売上",
    ]);
    verifyOrder(reportPattern2, [
      "売上数量",
      "割引合計",
      "売上合計",
      "平均単価",
      "実売上",
    ]);
    verifyOrder(reportPattern3, [
      "実売上",
      "売上合計",
      "割引合計",
      "売上数量",
      "平均単価",
    ]);
  });
});