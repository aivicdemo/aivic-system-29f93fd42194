import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import {
  generateSalesDataAggregationProcedure,
  type SalesDataTableSchema,
  type JoinCondition,
  type AggregationProcedure,
} from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ集計標準手順書生成機能", () => {
  // SCEN-1080: 複数テーブルのデータソースから結合ロジックを含めた集計手順書を生成
  test("複数テーブルを指定した場合、JOIN条件と集計ロジックを含む手順書を生成する", () => {
    // ===== 準備: テストデータベースとテーブルスキーマ定義 =====
    const customerTable: SalesDataTableSchema = {
      table_name: "customers",
      primary_key: "customer_id",
      columns: [
        { column_name: "customer_id", data_type: "INTEGER" },
        { column_name: "customer_name", data_type: "VARCHAR(255)" },
      ],
    };

    const salesResultTable: SalesDataTableSchema = {
      table_name: "sales_results",
      primary_key: "sales_id",
      columns: [
        { column_name: "sales_id", data_type: "INTEGER" },
        { column_name: "customer_id", data_type: "INTEGER" },
        { column_name: "sales_date", data_type: "DATE" },
        { column_name: "sales_amount", data_type: "DECIMAL(10,2)" },
        { column_name: "product_code", data_type: "VARCHAR(50)" },
      ],
    };

    const productTable: SalesDataTableSchema = {
      table_name: "products",
      primary_key: "product_code",
      columns: [
        { column_name: "product_code", data_type: "VARCHAR(50)" },
        { column_name: "product_name", data_type: "VARCHAR(255)" },
        { column_name: "service_type", data_type: "VARCHAR(50)" },
      ],
    };

    // ===== 準備: テストデータの定義 =====
    const testCustomers = [
      { customer_id: 1001, customer_name: "顧客A" },
      { customer_id: 1002, customer_name: "顧客B" },
    ];

    const testSalesResults = [
      {
        sales_id: 5001,
        customer_id: 1001,
        sales_date: "2024-01-15",
        sales_amount: 100000.0,
        product_code: "PROD-001",
      },
      {
        sales_id: 5002,
        customer_id: 1001,
        sales_date: "2024-01-20",
        sales_amount: 150000.0,
        product_code: "PROD-002",
      },
      {
        sales_id: 5003,
        customer_id: 1002,
        sales_date: "2024-01-25",
        sales_amount: 200000.0,
        product_code: "PROD-001",
      },
    ];

    const testProducts = [
      {
        product_code: "PROD-001",
        product_name: "コンサルティング",
        service_type: "standard",
      },
      {
        product_code: "PROD-002",
        product_name: "システム構築",
        service_type: "premium",
      },
    ];

    // ===== 準備: 結合条件と集計定義 =====
    const joinConditions: JoinCondition[] = [
      {
        join_type: "INNER JOIN",
        left_table: "sales_results",
        right_table: "customers",
        left_key: "customer_id",
        right_key: "customer_id",
      },
      {
        join_type: "INNER JOIN",
        left_table: "sales_results",
        right_table: "products",
        left_key: "product_code",
        right_key: "product_code",
      },
    ];

    const aggregationConfig = {
      group_by_columns: ["customers.customer_id", "products.service_type"],
      aggregate_functions: [
        {
          function_name: "SUM",
          target_column: "sales_results.sales_amount",
          alias: "total_sales",
        },
        {
          function_name: "COUNT",
          target_column: "sales_results.sales_id",
          alias: "transaction_count",
        },
      ],
      order_by: [
        {
          column: "customers.customer_id",
          direction: "ASC",
        },
      ],
    };

    // ===== 実行: 集計標準手順書生成 =====
    const generatedProcedure: AggregationProcedure = generateSalesDataAggregationProcedure(
      {
        tables: [customerTable, salesResultTable, productTable],
        test_data: {
          customers: testCustomers,
          sales_results: testSalesResults,
          products: testProducts,
        },
        join_conditions: joinConditions,
        aggregation_config: aggregationConfig,
      }
    );

    // ===== 検証 1: テーブル間の結合ロジック（JOIN条件）が明示的に記載されているか =====
    expect(generatedProcedure.procedure_steps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          step_name: expect.stringContaining("結合"),
          step_description: expect.stringContaining("INNER JOIN"),
        }),
      ])
    );

    // ===== 検証 2: 結合キー（外部キー）が正確に指定されているか =====
    const joinSteps = generatedProcedure.procedure_steps.filter(
      (step) => step.step_type === "join"
    );
    expect(joinSteps.length).toBeGreaterThanOrEqual(2);

    const firstJoinStep = joinSteps[0];
    expect(firstJoinStep.join_condition).toEqual({
      join_type: "INNER JOIN",
      left_table: "sales_results",
      right_table: "customers",
      left_key: "customer_id",
      right_key: "customer_id",
    });

    const secondJoinStep = joinSteps[1];
    expect(secondJoinStep.join_condition).toEqual({
      join_type: "INNER JOIN",
      left_table: "sales_results",
      right_table: "products",
      left_key: "product_code",
      right_key: "product_code",
    });

    // ===== 検証 3: 結合順序が論理的に正しいか =====
    expect(generatedProcedure.table_join_order).toEqual([
      "sales_results",
      "customers",
      "products",
    ]);

    // ===== 検証 4: 結合後のデータに対する集計処理が適切に定義されているか =====
    const aggregationStep = generatedProcedure.procedure_steps.find(
      (step) => step.step_type === "aggregation"
    );
    expect(aggregationStep).toBeDefined();
    expect(aggregationStep?.group_by_columns).toEqual([
      "customers.customer_id",
      "products.service_type",
    ]);
    expect(aggregationStep?.aggregate_functions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          function_name: "SUM",
          target_column: "sales_results.sales_amount",
          alias: "total_sales",
        }),
        expect.objectContaining({
          function_name: "COUNT",
          target_column: "sales_results.sales_id",
          alias: "transaction_count",
        }),
      ])
    );

    // ===== 検証 5: 生成された手順書が実行可能な形式であるか =====
    expect(generatedProcedure.procedure_syntax).toBeDefined();
    expect(typeof generatedProcedure.procedure_syntax).toBe("string");
    expect(generatedProcedure.procedure_syntax).toContain("SELECT");
    expect(generatedProcedure.procedure_syntax).toContain("FROM");
    expect(generatedProcedure.procedure_syntax).toContain("INNER JOIN");
    expect(generatedProcedure.procedure_syntax).toContain("GROUP BY");
    expect(generatedProcedure.procedure_syntax).toContain("ORDER BY");

    // ===== 検証 6: 手順書メタデータの完全性 =====
    expect(generatedProcedure.procedure_id).toMatch(/^PROC-\d+$/);
    expect(generatedProcedure.created_at).toBe("2024-01-15T09:00:00Z");
    expect(generatedProcedure.target_tables).toEqual([
      "customers",
      "sales_results",
      "products",
    ]);

    // ===== 検証 7: 結合テーブル数の一致確認 =====
    expect(generatedProcedure.join_condition_count).toBe(2);

    // ===== 検証 8: グループ化条件の検証 =====
    const groupByStep = generatedProcedure.procedure_steps.find(
      (step) => step.step_type === "aggregation"
    );
    expect(groupByStep?.group_by_columns.length).toBe(2);
    expect(groupByStep?.group_by_columns).toContain("customers.customer_id");
    expect(groupByStep?.group_by_columns).toContain("products.service_type");

    // ===== 検証 9: 集計関数の検証 =====
    const aggregateFunctions = aggregationStep?.aggregate_functions || [];
    expect(aggregateFunctions).toHaveLength(2);
    expect(aggregateFunctions[0].function_name).toBe("SUM");
    expect(aggregateFunctions[0].alias).toBe("total_sales");
    expect(aggregateFunctions[1].function_name).toBe("COUNT");
    expect(aggregateFunctions[1].alias).toBe("transaction_count");

    // ===== 検証 10: ソート条件の検証 =====
    expect(aggregationStep?.order_by).toEqual([
      {
        column: "customers.customer_id",
        direction: "ASC",
      },
    ]);

    // ===== 検証 11: 手順書の実行可能性確認（構文検証） =====
    const syntaxValidation = generatedProcedure.syntax_validation;
    expect(syntaxValidation).toBeDefined();
    expect(syntaxValidation.is_valid).toBe(true);
    expect(syntaxValidation.error_messages).toEqual([]);

    // ===== 検証 12: テーブル参照の完全性 =====
    expect(generatedProcedure.referenced_tables).toEqual([
      {
        table_name: "sales_results",
        role: "base_table",
      },
      {
        table_name: "customers",
        role: "joined_table",
      },
      {
        table_name: "products",
        role: "joined_table",
      },
    ]);

    // ===== 検証 13: 全ステップが含まれているか =====
    expect(generatedProcedure.procedure_steps.length).toBeGreaterThanOrEqual(4);
    const stepTypes = generatedProcedure.procedure_steps.map(
      (step) => step.step_type
    );
    expect(stepTypes).toContain("join");
    expect(stepTypes).toContain("aggregation");

    // ===== 検証 14: 手順書の説明文が適切か =====
    expect(generatedProcedure.procedure_description).toContain("複数テーブル");
    expect(generatedProcedure.procedure_description).toContain("結合");
    expect(generatedProcedure.procedure_description).toContain("集計");
  });
});