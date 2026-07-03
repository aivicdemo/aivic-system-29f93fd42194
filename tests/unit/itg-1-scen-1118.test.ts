import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import {
  validateFormatMappingConfiguration,
} from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレートの標準フォーマット変換ルール検証", () => {
  let errorLogs: Array<{
    timestamp: string;
    errorCode: string;
    fieldName: string;
    message: string;
  }> = [];

  beforeEach(() => {
    errorLogs = [];
  });

  afterEach(() => {
    errorLogs = [];
  });

  // SCEN-1118: [error] 標準フォーマット変換ルール検証 - マッピング設定が定義されていない項目に対してエラーが返される
  test("should return error when mapping configuration is not defined for a field", () => {
    // 準備: マッピング設定が定義されていない営業データ
    const unmappedData = {
      fieldName: "unknown_field",
      value: 100,
      dataType: "number",
    };

    const mappingConfig = {
      ap_count: { targetField: "appointment_count", transformer: "sum" },
      contract_count: { targetField: "contract_count", transformer: "sum" },
      // unknown_field のマッピング定義がない
    };

    // 実行: マッピング定義が存在しない項目を含むデータで変換処理を実行
    const executeTransformation = () => {
      validateFormatMappingConfiguration({
        sourceData: unmappedData,
        mappingRules: mappingConfig,
        timestamp: "2024-01-15T11:00:00Z",
        errorLogger: (
          code: string,
          field: string,
          message: string,
          ts: string
        ) => {
          errorLogs.push({
            errorCode: code,
            fieldName: field,
            message: message,
            timestamp: ts,
          });
        },
      });
    };

    // 検証: エラーが投げられることを確認
    expect(executeTransformation).toThrow(/マッピング定義/);

    // エラーログに詳細情報が記録されていることを確認
    expect(errorLogs).toHaveLength(1);
    expect(errorLogs[0]).toEqual({
      errorCode: "MAPPING_NOT_DEFINED",
      fieldName: "unknown_field",
      message: "Field 'unknown_field' has no mapping rule defined",
      timestamp: "2024-01-15T11:00:00Z",
    });
  });
});