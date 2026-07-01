import { describe, test, expect, beforeEach } from "@jest/globals";
import {
  defineMetadata,
  retrieveMetadata,
  applyCalculationLogic,
  mapToReportTemplate,
} from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データ項目メタデータ管理", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("SCEN-610: 項目名・単位・データ型・計算ロジック・レポートマッピングが定義通りに適用される", () => {
    // メタデータ定義の入力
    const metadataInput = {
      itemName: "売上金額",
      unit: "JPY",
      dataType: "Decimal",
      calculationLogic: "unitPrice * quantity",
      reportMapping: "売上レポート",
    };

    // メタデータ定義を保存
    const defineResult = defineMetadata(metadataInput);
    expect(defineResult).toEqual({
      success: true,
      metadataId: expect.any(String),
      message: "メタデータが正常に定義されました",
    });

    const metadataId = defineResult.metadataId;

    // 保存後、作成した項目の詳細情報を確認
    const retrieveResult = retrieveMetadata({ metadataId });
    expect(retrieveResult).toEqual({
      metadataId,
      itemName: "売上金額",
      unit: "JPY",
      dataType: "Decimal",
      calculationLogic: "unitPrice * quantity",
      reportMapping: "売上レポート",
      createdAt: expect.any(String),
      status: "active",
    });

    // 営業データ入力と自動計算の実行
    const calculationInput = {
      metadataId,
      unitPrice: 1000,
      quantity: 5,
    };

    const calculationResult = applyCalculationLogic(calculationInput);
    expect(calculationResult).toEqual({
      success: true,
      calculatedValue: 5000,
      unit: "JPY",
      dataType: "Decimal",
      formula: "unitPrice * quantity",
      inputValues: {
        unitPrice: 1000,
        quantity: 5,
      },
    });

    // 売上レポートへのマッピング確認
    const reportMappingInput = {
      metadataId,
      itemValue: 5000,
      itemName: "売上金額",
      reportTemplateName: "売上レポート",
    };

    const reportMappingResult = mapToReportTemplate(reportMappingInput);
    expect(reportMappingResult).toEqual({
      success: true,
      reportItemName: "売上金額",
      reportItemValue: 5000,
      reportItemUnit: "JPY",
      reportTemplateName: "売上レポート",
      dataType: "Decimal",
      mappingStatus: "mapped",
      formattedOutput: "5000 JPY",
    });

    // レポート出力結果の検証
    expect(reportMappingResult.reportItemName).toBe("売上金額");
    expect(reportMappingResult.reportItemUnit).toBe("JPY");
    expect(reportMappingResult.reportItemValue).toBe(5000);
    expect(reportMappingResult.formattedOutput).toBe("5000 JPY");
    expect(reportMappingResult.mappingStatus).toBe("mapped");
  });
});