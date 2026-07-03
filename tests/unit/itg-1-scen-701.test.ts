import { describe, test, expect } from "@jest/globals";
import { detectValidationAnomalies } from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  // SCEN-701
  test("複数の異常値を含む営業データに対して、すべての異常が一覧で検出される", () => {
    // 検証ルール定義
    const validationRules = [
      {
        ruleId: "RULE_001",
        ruleName: "金額範囲チェック",
        fieldName: "amount",
        condition: { min: 0, max: 1000000 },
      },
      {
        ruleId: "RULE_002",
        ruleName: "顧客名形式チェック",
        fieldName: "customerName",
        condition: { pattern: /^[ぁ-ん一-龯々〆ゝゞ\s]+$/, minLength: 1 },
      },
      {
        ruleId: "RULE_003",
        ruleName: "日付妥当性チェック",
        fieldName: "contactDate",
        condition: { maxDate: "2024-12-31" },
      },
      {
        ruleId: "RULE_004",
        ruleName: "商品コード存在確認",
        fieldName: "productCode",
        condition: { validCodes: ["PROD001", "PROD002", "PROD003"] },
      },
    ];

    // テストデータ：複数の異常値を含む営業データセット
    const testDataSet = [
      {
        recordId: "REC001",
        amount: -50000, // 異常：負の金額
        customerName: "株式会社ABC",
        contactDate: "2024-01-15",
        productCode: "PROD001",
      },
      {
        recordId: "REC002",
        amount: 1500000, // 異常：上限超過
        customerName: "Customer XYZ", // 異常：不正な顧客名形式
        contactDate: "2024-06-10",
        productCode: "PROD002",
      },
      {
        recordId: "REC003",
        amount: 500000,
        customerName: "株式会社DEF",
        contactDate: "2025-02-15", // 異常：未来の日付
        productCode: "PROD999", // 異常：存在しない商品コード
      },
      {
        recordId: "REC004",
        amount: 250000,
        customerName: "株式会社GHI",
        contactDate: "2024-11-20",
        productCode: "PROD003",
      },
      {
        recordId: "REC005",
        amount: 0, // 異常：金額が0
        customerName: "", // 異常：顧客名空文字列
        contactDate: "2024-03-05",
        productCode: "PROD001",
      },
    ];

    // 異常検出機能を実行
    const detectionResult = detectValidationAnomalies(
      validationRules,
      testDataSet
    );

    // 検出結果の検証
    expect(detectionResult.totalAnomaliesCount).toBe(7);

    // 異常の詳細内容を検証
    expect(detectionResult.anomalies).toHaveLength(7);

    // 異常1：REC001の負の金額
    expect(detectionResult.anomalies[0]).toEqual({
      recordId: "REC001",
      fieldName: "amount",
      ruleId: "RULE_001",
      ruleName: "金額範囲チェック",
      detectedValue: -50000,
      errorMessage: "金額は0以上1000000以下である必要があります",
    });

    // 異常2：REC002の上限超過金額
    expect(detectionResult.anomalies[1]).toEqual({
      recordId: "REC002",
      fieldName: "amount",
      ruleId: "RULE_001",
      ruleName: "金額範囲チェック",
      detectedValue: 1500000,
      errorMessage: "金額は0以上1000000以下である必要があります",
    });

    // 異常3：REC002の不正な顧客名形式
    expect(detectionResult.anomalies[2]).toEqual({
      recordId: "REC002",
      fieldName: "customerName",
      ruleId: "RULE_002",
      ruleName: "顧客名形式チェック",
      detectedValue: "Customer XYZ",
      errorMessage: "顧客名は日本語のみで構成されている必要があります",
    });

    // 異常4：REC003の未来の日付
    expect(detectionResult.anomalies[3]).toEqual({
      recordId: "REC003",
      fieldName: "contactDate",
      ruleId: "RULE_003",
      ruleName: "日付妥当性チェック",
      detectedValue: "2025-02-15",
      errorMessage: "接触日付は2024-12-31以前である必要があります",
    });

    // 異常5：REC003の存在しない商品コード
    expect(detectionResult.anomalies[4]).toEqual({
      recordId: "REC003",
      fieldName: "productCode",
      ruleId: "RULE_004",
      ruleName: "商品コード存在確認",
      detectedValue: "PROD999",
      errorMessage: "商品コードは登録済みのコードである必要があります",
    });

    // 異常6：REC005の金額0
    expect(detectionResult.anomalies[5]).toEqual({
      recordId: "REC005",
      fieldName: "amount",
      ruleId: "RULE_001",
      ruleName: "金額範囲チェック",
      detectedValue: 0,
      errorMessage: "金額は0以上1000000以下である必要があります",
    });

    // 異常7：REC005の空文字列顧客名
    expect(detectionResult.anomalies[6]).toEqual({
      recordId: "REC005",
      fieldName: "customerName",
      ruleId: "RULE_002",
      ruleName: "顧客名形式チェック",
      detectedValue: "",
      errorMessage: "顧客名は1文字以上である必要があります",
    });

    // 検出数と実際の異常値数の一致を確認
    expect(detectionResult.totalAnomaliesCount).toBe(7);
    expect(detectionResult.anomalies.length).toBe(
      detectionResult.totalAnomaliesCount
    );

    // レコード別異常カウントの検証
    const anomaliesByRecord = detectionResult.anomalies.reduce(
      (acc: { [key: string]: number }, anomaly: any) => {
        acc[anomaly.recordId] = (acc[anomaly.recordId] || 0) + 1;
        return acc;
      },
      {}
    );

    expect(anomaliesByRecord["REC001"]).toBe(1);
    expect(anomaliesByRecord["REC002"]).toBe(2);
    expect(anomaliesByRecord["REC003"]).toBe(2);
    expect(anomaliesByRecord["REC004"]).toBeUndefined();
    expect(anomaliesByRecord["REC005"]).toBe(2);

    // ルール別異常カウントの検証
    const anomaliesByRule = detectionResult.anomalies.reduce(
      (acc: { [key: string]: number }, anomaly: any) => {
        acc[anomaly.ruleId] = (acc[anomaly.ruleId] || 0) + 1;
        return acc;
      },
      {}
    );

    expect(anomaliesByRule["RULE_001"]).toBe(3);
    expect(anomaliesByRule["RULE_002"]).toBe(2);
    expect(anomaliesByRule["RULE_003"]).toBe(1);
    expect(anomaliesByRule["RULE_004"]).toBe(1);

    // 正常レコードの確認
    expect(detectionResult.normalRecordIds).toEqual(["REC004"]);
    expect(detectionResult.normalRecordIds.length).toBe(1);

    // 全体統計の検証
    expect(detectionResult.totalRecordsProcessed).toBe(5);
    expect(detectionResult.totalRecordsWithAnomalies).toBe(4);
    expect(detectionResult.totalRecordsNormal).toBe(1);
    expect(
      detectionResult.totalRecordsWithAnomalies +
        detectionResult.totalRecordsNormal
    ).toBe(detectionResult.totalRecordsProcessed);
  });
});