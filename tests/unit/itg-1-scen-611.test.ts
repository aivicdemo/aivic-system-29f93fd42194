import {
  generateMonthlySummaryReport,
} from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("Monthly Summary Template - Multi-item Report Generation", () => {
  // SCEN-611
  test("複数テンプレート項目の組み合わせで正確にレポートが生成される", () => {
    const template_items = [
      {
        item_id: "cust_name",
        item_label: "顧客名",
        data_type: "text",
        format_pattern: null,
        calculation_formula: null,
        sort_order: 1,
      },
      {
        item_id: "sales_amount",
        item_label: "売上金額",
        data_type: "number",
        format_pattern: "0.00",
        calculation_formula: null,
        sort_order: 2,
      },
      {
        item_id: "discount_rate",
        item_label: "割引率",
        data_type: "number",
        format_pattern: "0.00%",
        calculation_formula: null,
        sort_order: 3,
      },
      {
        item_id: "discount_amount",
        item_label: "割引金額",
        data_type: "number",
        format_pattern: "0.00",
        calculation_formula: "sales_amount * discount_rate",
        sort_order: 4,
      },
      {
        item_id: "tax_rate",
        item_label: "税率",
        data_type: "number",
        format_pattern: "0.00%",
        calculation_formula: null,
        sort_order: 5,
      },
      {
        item_id: "tax_amount",
        item_label: "税金",
        data_type: "number",
        format_pattern: "0.00",
        calculation_formula: "(sales_amount - discount_amount) * tax_rate",
        sort_order: 6,
      },
      {
        item_id: "total_amount",
        item_label: "合計金額",
        data_type: "number",
        format_pattern: "0.00",
        calculation_formula:
          "sales_amount - discount_amount + tax_amount",
        sort_order: 7,
      },
      {
        item_id: "invoice_date",
        item_label: "請求日",
        data_type: "date",
        format_pattern: "YYYY-MM-DD",
        calculation_formula: null,
        sort_order: 8,
      },
    ];

    const customer_data = [
      {
        customer_id: "cust_001",
        customer_name: "顧客A",
        sales_amount: 100000.0,
        discount_rate: 0.1,
        tax_rate: 0.1,
        invoice_date: "2024-01-15",
      },
      {
        customer_id: "cust_002",
        customer_name: "顧客B",
        sales_amount: 250000.0,
        discount_rate: 0.15,
        tax_rate: 0.1,
        invoice_date: "2024-01-15",
      },
      {
        customer_id: "cust_003",
        customer_name: "顧客C",
        sales_amount: 50000.0,
        discount_rate: 0.05,
        tax_rate: 0.1,
        invoice_date: "2024-01-15",
      },
      {
        customer_id: "cust_004",
        customer_name: "顧客D",
        sales_amount: 500000.0,
        discount_rate: 0.2,
        tax_rate: 0.1,
        invoice_date: "2024-01-15",
      },
      {
        customer_id: "cust_005",
        customer_name: "顧客E",
        sales_amount: 10000.0,
        discount_rate: 0.0,
        tax_rate: 0.1,
        invoice_date: "2024-01-15",
      },
    ];

    const output_format = "json";

    const result = generateMonthlySummaryReport(
      template_items,
      customer_data,
      output_format
    );

    expect(result).toBeDefined();
    expect(result.status).toBe("success");
    expect(result.report_data).toBeDefined();
    expect(Array.isArray(result.report_data)).toBe(true);
    expect(result.report_data.length).toBe(5);

    const row_1 = result.report_data[0];
    expect(row_1.cust_name).toBe("顧客A");
    expect(row_1.sales_amount).toBe(100000.0);
    expect(row_1.discount_rate).toBe(0.1);
    expect(row_1.discount_amount).toBe(10000.0);
    expect(row_1.tax_rate).toBe(0.1);
    expect(row_1.tax_amount).toBe(9000.0);
    expect(row_1.total_amount).toBe(99000.0);
    expect(row_1.invoice_date).toBe("2024-01-15");

    const row_2 = result.report_data[1];
    expect(row_2.cust_name).toBe("顧客B");
    expect(row_2.sales_amount).toBe(250000.0);
    expect(row_2.discount_rate).toBe(0.15);
    expect(row_2.discount_amount).toBe(37500.0);
    expect(row_2.tax_rate).toBe(0.1);
    expect(row_2.tax_amount).toBe(21250.0);
    expect(row_2.total_amount).toBe(233750.0);

    const row_3 = result.report_data[2];
    expect(row_3.cust_name).toBe("顧客C");
    expect(row_3.sales_amount).toBe(50000.0);
    expect(row_3.discount_rate).toBe(0.05);
    expect(row_3.discount_amount).toBe(2500.0);
    expect(row_3.tax_rate).toBe(0.1);
    expect(row_3.tax_amount).toBe(4750.0);
    expect(row_3.total_amount).toBe(52250.0);

    const row_4 = result.report_data[3];
    expect(row_4.cust_name).toBe("顧客D");
    expect(row_4.sales_amount).toBe(500000.0);
    expect(row_4.discount_rate).toBe(0.2);
    expect(row_4.discount_amount).toBe(100000.0);
    expect(row_4.tax_rate).toBe(0.1);
    expect(row_4.tax_amount).toBe(40000.0);
    expect(row_4.total_amount).toBe(440000.0);

    const row_5 = result.report_data[4];
    expect(row_5.cust_name).toBe("顧客E");
    expect(row_5.sales_amount).toBe(10000.0);
    expect(row_5.discount_rate).toBe(0.0);
    expect(row_5.discount_amount).toBe(0.0);
    expect(row_5.tax_rate).toBe(0.1);
    expect(row_5.tax_amount).toBe(1000.0);
    expect(row_5.total_amount).toBe(11000.0);

    expect(result.template_validation).toBeDefined();
    expect(result.template_validation.total_items).toBe(8);
    expect(result.template_validation.calculated_items).toBe(3);
    expect(result.template_validation.formula_errors).toBe(0);
    expect(result.template_validation.data_type_mismatches).toBe(0);

    expect(result.output_format).toBe("json");
    expect(result.generated_timestamp).toBeDefined();
    expect(result.field_order).toEqual([
      "cust_name",
      "sales_amount",
      "discount_rate",
      "discount_amount",
      "tax_rate",
      "tax_amount",
      "total_amount",
      "invoice_date",
    ]);

    const edge_case_data = [
      {
        customer_id: "cust_max",
        customer_name: "顧客MaxValue",
        sales_amount: 9999999.99,
        discount_rate: 0.5,
        tax_rate: 0.1,
        invoice_date: "2024-01-31",
      },
      {
        customer_id: "cust_min",
        customer_name: "顧客MinValue",
        sales_amount: 0.01,
        discount_rate: 0.0,
        tax_rate: 0.1,
        invoice_date: "2024-01-01",
      },
      {
        customer_id: "cust_zero",
        customer_name: "顧客Zero",
        sales_amount: 0.0,
        discount_rate: 0.0,
        tax_rate: 0.1,
        invoice_date: "2024-01-15",
      },
    ];

    const edge_result = generateMonthlySummaryReport(
      template_items,
      edge_case_data,
      output_format
    );

    expect(edge_result.status).toBe("success");
    expect(edge_result.report_data.length).toBe(3);

    const max_row = edge_result.report_data[0];
    expect(max_row.cust_name).toBe("顧客MaxValue");
    expect(max_row.sales_amount).toBe(9999999.99);
    expect(max_row.discount_amount).toBe(4999999.995);
    expect(max_row.tax_amount).toBe(499999.9995);
    expect(max_row.total_amount).toBeCloseTo(5499999.9845, 2);

    const min_row = edge_result.report_data[1];
    expect(min_row.cust_name).toBe("顧客MinValue");
    expect(min_row.sales_amount).toBe(0.01);
    expect(min_row.discount_amount).toBe(0.0);
    expect(min_row.tax_amount).toBeCloseTo(0.001, 3);
    expect(min_row.total_amount).toBeCloseTo(0.011, 3);

    const zero_row = edge_result.report_data[2];
    expect(zero_row.cust_name).toBe("顧客Zero");
    expect(zero_row.sales_amount).toBe(0.0);
    expect(zero_row.discount_amount).toBe(0.0);
    expect(zero_row.tax_amount).toBe(0.0);
    expect(zero_row.total_amount).toBe(0.0);

    const excel_result = generateMonthlySummaryReport(
      template_items,
      customer_data,
      "excel"
    );
    expect(excel_result.status).toBe("success");
    expect(excel_result.output_format).toBe("excel");
    expect(excel_result.report_data.length).toBe(5);

    const csv_result = generateMonthlySummaryReport(
      template_items,
      customer_data,
      "csv"
    );
    expect(csv_result.status).toBe("success");
    expect(csv_result.output_format).toBe("csv");
    expect(csv_result.report_data.length).toBe(5);

    expect(result.report_data[0]).toEqual(
      excel_result.report_data[0]
    );
    expect(result.report_data[0]).toEqual(csv_result.report_data[0]);

    expect(() => {
      generateMonthlySummaryReport([], customer_data, output_format);
    }).toThrow(/テンプレート項目/);

    expect(() => {
      generateMonthlySummaryReport(template_items, [], output_format);
    }).toThrow(/顧客データ/);

    const invalid_formula_items = [
      {
        item_id: "invalid_calc",
        item_label: "無効計算",
        data_type: "number",
        format_pattern: "0.00",
        calculation_formula: "undefined_field * 2",
        sort_order: 1,
      },
    ];

    expect(() => {
      generateMonthlySummaryReport(
        invalid_formula_items,
        customer_data,
        output_format
      );
    }).toThrow(/計算式/);
  });
});