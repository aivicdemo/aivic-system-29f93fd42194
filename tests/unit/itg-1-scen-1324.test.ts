import { describe, test, expect, beforeEach } from "@jest/globals";
import {
  createSalesDataMappingSpecification,
  applySalesDataTransformationRules,
} from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能 - マッピング仕様書作成と変換ルール適用", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1324
  test("営業システムの1項目が複数の請求・レポート項目にマッピングされる場合、変換ルールが定義される", () => {
    // 営業システムのテストデータを準備: 「顧客名」項目
    const salesDataItem = {
      itemId: "SALES_ITEM_001",
      itemName: "顧客名",
      dataType: "string",
      unit: "名称",
      description: "営業活動の対象顧客の名称",
    };

    // マッピング仕様書の作成入力: 複数の対応先項目と変換ルール定義
    const mappingSpecification = {
      sourceItemId: "SALES_ITEM_001",
      sourceItemName: "顧客名",
      mappings: [
        {
          mappingId: "MAP_BILL_001",
          targetSystem: "billing",
          targetItemName: "請求先名",
          transformationRule: {
            ruleType: "uppercase",
            maxLength: 50,
            description: "顧客名を大文字に変換して請求書に出力",
          },
        },
        {
          mappingId: "MAP_REPORT_001",
          targetSystem: "reporting",
          targetItemName: "顧客表示名",
          transformationRule: {
            ruleType: "titlecase_with_truncation",
            maxLength: 30,
            description: "顧客名をタイトルケースに変換して30文字で切り詰め",
          },
        },
      ],
    };

    // マッピング仕様書を作成・保存する
    const createdSpecification = createSalesDataMappingSpecification(
      mappingSpecification
    );

    // 保存したマッピング仕様書の内容を確認
    expect(createdSpecification).toBeDefined();
    expect(createdSpecification.sourceItemId).toBe("SALES_ITEM_001");
    expect(createdSpecification.sourceItemName).toBe("顧客名");
    expect(createdSpecification.mappings).toHaveLength(2);

    // 請求書マッピングの検証
    const billingMapping = createdSpecification.mappings[0];
    expect(billingMapping.mappingId).toBe("MAP_BILL_001");
    expect(billingMapping.targetSystem).toBe("billing");
    expect(billingMapping.targetItemName).toBe("請求先名");
    expect(billingMapping.transformationRule.ruleType).toBe("uppercase");
    expect(billingMapping.transformationRule.maxLength).toBe(50);

    // レポートマッピングの検証
    const reportMapping = createdSpecification.mappings[1];
    expect(reportMapping.mappingId).toBe("MAP_REPORT_001");
    expect(reportMapping.targetSystem).toBe("reporting");
    expect(reportMapping.targetItemName).toBe("顧客表示名");
    expect(reportMapping.transformationRule.ruleType).toBe(
      "titlecase_with_truncation"
    );
    expect(reportMapping.transformationRule.maxLength).toBe(30);

    // 営業データの変換処理を実行
    const salesDataRecord = {
      itemId: "SALES_ITEM_001",
      value: "ACME CORPORATION",
    };

    const transformedData = applySalesDataTransformationRules(
      salesDataRecord,
      createdSpecification
    );

    // 請求書側の変換結果を検証: 大文字変換（50文字上限）
    expect(transformedData.billing).toBeDefined();
    expect(transformedData.billing.targetItemName).toBe("請求先名");
    expect(transformedData.billing.transformedValue).toBe(
      "ACME CORPORATION"
    );
    expect(transformedData.billing.appliedRule).toBe("uppercase");

    // レポート側の変換結果を検証: タイトルケース+30文字切り詰め
    expect(transformedData.reporting).toBeDefined();
    expect(transformedData.reporting.targetItemName).toBe("顧客表示名");
    expect(transformedData.reporting.transformedValue).toBe(
      "Acme Corporation"
    );
    expect(transformedData.reporting.appliedRule).toBe(
      "titlecase_with_truncation"
    );

    // マッピング仕様書に全ての変換ルールが記録されているか確認
    expect(createdSpecification.mappings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          mappingId: "MAP_BILL_001",
          transformationRule: expect.objectContaining({
            ruleType: "uppercase",
            maxLength: 50,
          }),
        }),
        expect.objectContaining({
          mappingId: "MAP_REPORT_001",
          transformationRule: expect.objectContaining({
            ruleType: "titlecase_with_truncation",
            maxLength: 30,
          }),
        }),
      ])
    );

    // 処理の追跡可能性: タイムスタンプと処理ログが記録されているか確認
    expect(transformedData.processLog).toBeDefined();
    expect(transformedData.processLog.sourceItemId).toBe("SALES_ITEM_001");
    expect(transformedData.processLog.transformationApplied).toBe(true);
    expect(transformedData.processLog.mappingsAppliedCount).toBe(2);
    expect(transformedData.processLog.timestamp).toBeDefined();
  });
});