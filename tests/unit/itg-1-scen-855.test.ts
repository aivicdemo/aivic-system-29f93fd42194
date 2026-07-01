import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import {
  extractContractDifferences,
  validateDifferenceFields,
  calculateNumericDifference,
  formatDifferenceOutput,
} from "../../src/logic/it-1781935279444-2-2-1";

describe("契約変更前後の比較・差分可視化機能", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-855
  test("複数項目が同時に変更されたときにすべての差分が正しく抽出・表示される", () => {
    // 契約変更前のスナップショット（5項目以上を含める）
    const contractBefore = {
      contractId: "CT-2024-001",
      contractAmount: 500000,
      contractStartDate: "2024-01-01",
      contractEndDate: "2024-12-31",
      customerName: "顧客A",
      serviceContent: "基本パッケージ",
      discountRate: 10,
      paymentTerms: "月末払い",
      billingCycle: "月次",
      taxRate: 10,
    };

    // 契約変更後のスナップショット（複数項目を同時変更）
    const contractAfter = {
      contractId: "CT-2024-001",
      contractAmount: 600000,
      contractStartDate: "2024-01-15",
      contractEndDate: "2025-12-31",
      customerName: "顧客A株式会社",
      serviceContent: "プレミアムパッケージ",
      discountRate: 15,
      paymentTerms: "翌月末払い",
      billingCycle: "月次",
      taxRate: 10,
    };

    const changedBy = "operator001";
    const changedAt = new Date("2024-01-10T14:30:00Z");

    // 差分可視化機能を実行
    const differences = extractContractDifferences(
      contractBefore,
      contractAfter,
      changedBy,
      changedAt
    );

    // 変更されたすべての項目が差分結果に含まれていることを確認
    expect(differences.length).toBe(7); // contractAmount, contractStartDate, contractEndDate, customerName, serviceContent, discountRate, paymentTerms

    // 各差分について検証：変更前の値、変更後の値、変更項目名、変更日時、変更者情報
    const contractAmountDiff = differences.find(
      (d) => d.fieldName === "contractAmount"
    );
    expect(contractAmountDiff).toBeDefined();
    expect(contractAmountDiff?.fieldName).toBe("contractAmount");
    expect(contractAmountDiff?.beforeValue).toBe(500000);
    expect(contractAmountDiff?.afterValue).toBe(600000);
    expect(contractAmountDiff?.changedBy).toBe("operator001");
    expect(contractAmountDiff?.changedAt).toEqual(
      new Date("2024-01-10T14:30:00Z")
    );

    const contractStartDateDiff = differences.find(
      (d) => d.fieldName === "contractStartDate"
    );
    expect(contractStartDateDiff?.beforeValue).toBe("2024-01-01");
    expect(contractStartDateDiff?.afterValue).toBe("2024-01-15");

    const contractEndDateDiff = differences.find(
      (d) => d.fieldName === "contractEndDate"
    );
    expect(contractEndDateDiff?.beforeValue).toBe("2024-12-31");
    expect(contractEndDateDiff?.afterValue).toBe("2025-12-31");

    const customerNameDiff = differences.find(
      (d) => d.fieldName === "customerName"
    );
    expect(customerNameDiff?.beforeValue).toBe("顧客A");
    expect(customerNameDiff?.afterValue).toBe("顧客A株式会社");

    const serviceContentDiff = differences.find(
      (d) => d.fieldName === "serviceContent"
    );
    expect(serviceContentDiff?.beforeValue).toBe("基本パッケージ");
    expect(serviceContentDiff?.afterValue).toBe("プレミアムパッケージ");

    const discountRateDiff = differences.find(
      (d) => d.fieldName === "discountRate"
    );
    expect(discountRateDiff?.beforeValue).toBe(10);
    expect(discountRateDiff?.afterValue).toBe(15);

    const paymentTermsDiff = differences.find(
      (d) => d.fieldName === "paymentTerms"
    );
    expect(paymentTermsDiff?.beforeValue).toBe("月末払い");
    expect(paymentTermsDiff?.afterValue).toBe("翌月末払い");

    // taxRate と billingCycle は変更されていないため差分に含まれない
    const taxRateDiff = differences.find((d) => d.fieldName === "taxRate");
    expect(taxRateDiff).toBeUndefined();

    const billingCycleDiff = differences.find(
      (d) => d.fieldName === "billingCycle"
    );
    expect(billingCycleDiff).toBeUndefined();

    // 数値項目の差分計算が正確であることを確認（金額差分など）
    const amountNumericDiff = calculateNumericDifference(
      contractAmountDiff?.beforeValue,
      contractAmountDiff?.afterValue
    );
    expect(amountNumericDiff).toBe(100000);

    const discountRateNumericDiff = calculateNumericDifference(
      discountRateDiff?.beforeValue,
      discountRateDiff?.afterValue
    );
    expect(discountRateNumericDiff).toBe(5);

    // 差分の表示順序と整合性を確認
    expect(differences[0].fieldName).toBe("contractAmount");
    expect(differences[1].fieldName).toBe("contractStartDate");
    expect(differences[2].fieldName).toBe("contractEndDate");
    expect(differences[3].fieldName).toBe("customerName");
    expect(differences[4].fieldName).toBe("serviceContent");
    expect(differences[5].fieldName).toBe("discountRate");
    expect(differences[6].fieldName).toBe("paymentTerms");

    // 各差分フィールドの検証
    const fieldValidation = validateDifferenceFields(differences);
    expect(fieldValidation.isValid).toBe(true);
    expect(fieldValidation.missingFields).toEqual([]);
    expect(fieldValidation.invalidFields).toEqual([]);

    // 差分データをエクスポート（CSV形式）して、データ形式と内容が正確であることを確認
    const csvOutput = formatDifferenceOutput(differences, "csv");
    expect(csvOutput).toContain("fieldName,beforeValue,afterValue,changedBy");
    expect(csvOutput).toContain(
      "contractAmount,500000,600000,operator001"
    );
    expect(csvOutput).toContain(
      "contractStartDate,2024-01-01,2024-01-15,operator001"
    );
    expect(csvOutput).toContain(
      "contractEndDate,2024-12-31,2025-12-31,operator001"
    );
    expect(csvOutput).toContain(
      "customerName,顧客A,顧客A株式会社,operator001"
    );
    expect(csvOutput).toContain(
      "serviceContent,基本パッケージ,プレミアムパッケージ,operator001"
    );
    expect(csvOutput).toContain("discountRate,10,15,operator001");
    expect(csvOutput).toContain("paymentTerms,月末払い,翌月末払い,operator001");

    // 差分データをエクスポート（JSON形式）して検証
    const jsonOutput = formatDifferenceOutput(differences, "json");
    const jsonParsed = JSON.parse(jsonOutput);
    expect(jsonParsed).toBeInstanceOf(Array);
    expect(jsonParsed.length).toBe(7);
    expect(jsonParsed[0]).toHaveProperty("fieldName");
    expect(jsonParsed[0]).toHaveProperty("beforeValue");
    expect(jsonParsed[0]).toHaveProperty("afterValue");
    expect(jsonParsed[0]).toHaveProperty("changedBy");
    expect(jsonParsed[0]).toHaveProperty("changedAt");

    // 差分データをエクスポート（Excel形式）して検証
    const excelOutput = formatDifferenceOutput(differences, "excel");
    expect(excelOutput).toBeDefined();
    expect(typeof excelOutput).toBe("string");
    expect(excelOutput.length).toBeGreaterThan(0);
  });
});