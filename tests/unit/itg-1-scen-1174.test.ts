import { extractAndAggregateChargeableItems } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能", () => {
  // SCEN-1174
  test("マッピング定義が存在しない項目がスキップされ、定義済み項目のみが処理される", () => {
    // テストデータ: マッピング定義が存在しない項目を含む営業データ
    const salesData = {
      customerId: "CUST-001",
      serviceId: "SVC-A",
      appointmentCount: 5,
      contractCount: 2,
      customerFeedback: "positive",
      unmappedField: "should-be-skipped",
      anotherUnmappedField: 12345,
    };

    // マッピング定義: appointmentCount, contractCount, customerFeedback のみ定義
    const mappingDefinitions = {
      appointmentCount: {
        fieldName: "appointmentCount",
        unit: "件",
        dataType: "number",
        calculation: "sum",
        chargeableWeight: 100,
      },
      contractCount: {
        fieldName: "contractCount",
        unit: "件",
        dataType: "number",
        calculation: "sum",
        chargeableWeight: 500,
      },
      customerFeedback: {
        fieldName: "customerFeedback",
        unit: "status",
        dataType: "string",
        calculation: "count_positive",
        chargeableWeight: 50,
      },
    };

    // 契約内容: 基本料金 + 成果報酬
    const contractTerms = {
      customerId: "CUST-001",
      serviceId: "SVC-A",
      baseFee: 10000,
      appointmentReward: 100,
      contractReward: 500,
      feedbackBonus: 50,
    };

    // 請求額自動集計・抽出機能を実行
    const result = extractAndAggregateChargeableItems({
      salesData,
      mappingDefinitions,
      contractTerms,
    });

    // マッピング定義が存在しない項目（unmappedField, anotherUnmappedField）がスキップされていることを確認
    expect(result.skippedFields).toContain("unmappedField");
    expect(result.skippedFields).toContain("anotherUnmappedField");
    expect(result.skippedFields.length).toBe(2);

    // マッピング定義が存在する項目のみが処理されたことを確認
    expect(result.processedFields).toContain("appointmentCount");
    expect(result.processedFields).toContain("contractCount");
    expect(result.processedFields).toContain("customerFeedback");
    expect(result.processedFields.length).toBe(3);

    // システムがエラーを発生させずに処理を継続していることを確認
    expect(result.hasError).toBe(false);
    expect(result.errorMessage).toBeUndefined();

    // 請求額の内訳を確認
    // 基本料金: 10,000
    // 成果報酬: appointmentCount(5) * 100 = 500
    // 成果報酬: contractCount(2) * 500 = 1,000
    // フィードバボーナス: customerFeedback(positive) = 50
    // 合計: 10,000 + 500 + 1,000 + 50 = 11,550
    expect(result.totalChargeAmount).toBe(11550);

    // 請求対象項目の内訳
    expect(result.chargeableItems).toEqual({
      appointmentCount: {
        value: 5,
        weight: 100,
        chargeAmount: 500,
      },
      contractCount: {
        value: 2,
        weight: 500,
        chargeAmount: 1000,
      },
      customerFeedback: {
        value: "positive",
        weight: 50,
        chargeAmount: 50,
      },
    });

    // 最終的な請求額が正確であることを確認
    expect(result.summary).toEqual({
      customerId: "CUST-001",
      serviceId: "SVC-A",
      baseFee: 10000,
      performanceFee: 1550,
      totalChargeAmount: 11550,
      processedFieldsCount: 3,
      skippedFieldsCount: 2,
    });
  });
});