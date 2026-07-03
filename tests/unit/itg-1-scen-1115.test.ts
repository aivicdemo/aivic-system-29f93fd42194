import { describe, it, expect, beforeEach } from "@jest/globals";
import {
  validateAggregationLogic,
} from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データメタデータ管理 - 集計ロジック検証", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1115: [normal] 営業データメタデータに基づく集計ロジック検証 - 複数の計算ルール（合計・平均・カウント）が混在する場合に正しく適用される
  it("should correctly apply mixed aggregation rules (sum, average, count) to sales data", () => {
    // 営業データメタデータ定義：合計・平均・カウントの3つの計算ルール
    const metadataDefinition = {
      fields: [
        {
          fieldId: "revenue_total",
          fieldName: "売上金額",
          unitName: "円",
          dataType: "number",
          aggregationType: "sum",
          description: "月次売上金額の合計",
        },
        {
          fieldId: "revenue_average",
          fieldName: "平均売上金額",
          unitName: "円",
          dataType: "number",
          aggregationType: "average",
          description: "顧客1社あたりの平均売上金額",
        },
        {
          fieldId: "customer_count",
          fieldName: "顧客件数",
          unitName: "件",
          dataType: "number",
          aggregationType: "count",
          description: "新規顧客数のカウント",
        },
      ],
    };

    // テスト用営業データセット
    const salesDataset = [
      {
        recordId: "rec_001",
        customerId: "cust_A",
        revenueAmount: 150000,
        isNewCustomer: true,
      },
      {
        recordId: "rec_002",
        customerId: "cust_B",
        revenueAmount: 200000,
        isNewCustomer: true,
      },
      {
        recordId: "rec_003",
        customerId: "cust_C",
        revenueAmount: 175000,
        isNewCustomer: false,
      },
      {
        recordId: "rec_004",
        customerId: "cust_D",
        revenueAmount: 225000,
        isNewCustomer: true,
      },
      {
        recordId: "rec_005",
        customerId: "cust_E",
        revenueAmount: 250000,
        isNewCustomer: false,
      },
    ];

    // 集計ロジック実行：合計ルール適用
    const sumResult = validateAggregationLogic({
      metadata: metadataDefinition,
      data: salesDataset,
      aggregationType: "sum",
      targetField: "revenueAmount",
    });

    // 期待値：150000 + 200000 + 175000 + 225000 + 250000 = 1000000
    expect(sumResult.value).toBe(1000000);
    expect(sumResult.aggregationType).toBe("sum");
    expect(sumResult.isValid).toBe(true);
    expect(sumResult.appliedFieldId).toBe("revenue_total");

    // 集計ロジック実行：平均ルール適用
    const averageResult = validateAggregationLogic({
      metadata: metadataDefinition,
      data: salesDataset,
      aggregationType: "average",
      targetField: "revenueAmount",
    });

    // 期待値：1000000 / 5 = 200000
    expect(averageResult.value).toBe(200000);
    expect(averageResult.aggregationType).toBe("average");
    expect(averageResult.isValid).toBe(true);
    expect(averageResult.appliedFieldId).toBe("revenue_average");

    // 集計ロジック実行：カウントルール適用
    const countResult = validateAggregationLogic({
      metadata: metadataDefinition,
      data: salesDataset,
      aggregationType: "count",
      targetField: "customerId",
      filterCondition: { isNewCustomer: true },
    });

    // 期待値：新規顧客数 = 3（cust_A, cust_B, cust_D）
    expect(countResult.value).toBe(3);
    expect(countResult.aggregationType).toBe("count");
    expect(countResult.isValid).toBe(true);
    expect(countResult.appliedFieldId).toBe("customer_count");

    // 複数の計算ルールが同時に実行された場合の結果を検証
    const mixedResult = validateAggregationLogic({
      metadata: metadataDefinition,
      data: salesDataset,
      aggregationTypes: ["sum", "average", "count"],
      targetField: "revenueAmount",
    });

    // 各計算ルールの結果が他のルールに影響を与えていないことを確認
    expect(mixedResult.results).toHaveLength(3);
    expect(mixedResult.results[0].aggregationType).toBe("sum");
    expect(mixedResult.results[0].value).toBe(1000000);
    expect(mixedResult.results[1].aggregationType).toBe("average");
    expect(mixedResult.results[1].value).toBe(200000);
    expect(mixedResult.results[2].aggregationType).toBe("count");
    expect(mixedResult.results[2].value).toBe(3);

    // 計算結果をメタデータの期待値と比較し、正確性を検証
    expect(mixedResult.isConsistent).toBe(true);
    expect(mixedResult.validationStatus).toBe("passed");

    // ルール間の干渉や計算ロジックの誤りが発生していないことを確認
    expect(mixedResult.results[0].isValid).toBe(true);
    expect(mixedResult.results[1].isValid).toBe(true);
    expect(mixedResult.results[2].isValid).toBe(true);

    // 各計算ルール結果が正確に計算されていることを最終確認
    const expectedSumTotal = 1000000;
    const expectedAverageValue = 200000;
    const expectedCountNewCustomers = 3;

    expect(mixedResult.results[0].value).toBe(expectedSumTotal);
    expect(mixedResult.results[1].value).toBe(expectedAverageValue);
    expect(mixedResult.results[2].value).toBe(expectedCountNewCustomers);

    // メタデータとの整合性を検証
    expect(mixedResult.metadata.fields).toHaveLength(3);
    expect(mixedResult.metadata.fields[0].aggregationType).toBe("sum");
    expect(mixedResult.metadata.fields[1].aggregationType).toBe("average");
    expect(mixedResult.metadata.fields[2].aggregationType).toBe("count");
  });
});