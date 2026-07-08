import { validateLearningDatasetQuality } from "../../src/logic/it-6-2-1-1";

describe("査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  test("SCEN-1357: 学習データセット品質検証 - 不適合データが正しく特定・分類されて検証失敗と判定される", () => {
    // テストデータセット：意図的に不適合データを含める
    const testDataset = [
      {
        rowIndex: 1,
        projectId: "PRJ001",
        region: "東京",
        workType: "土工",
        unitPrice: 5000,
        quantity: 10,
        totalAmount: 50000,
        referenceDate: "2024-01-15",
      },
      {
        rowIndex: 2,
        projectId: "PRJ002",
        region: "大阪",
        workType: "鋼構造",
        unitPrice: null, // 欠損値
        quantity: 5,
        totalAmount: 40000,
        referenceDate: "2024-01-16",
      },
      {
        rowIndex: 3,
        projectId: "PRJ003",
        region: "名古屋",
        workType: "建築",
        unitPrice: -3000, // 異常値（負の単価）
        quantity: 8,
        totalAmount: 24000,
        referenceDate: "2024-01-17",
      },
      {
        rowIndex: 4,
        projectId: "PRJ004",
        region: 12345, // 型不正（文字列であるべき）
        workType: "道路",
        unitPrice: 4500,
        quantity: "abc", // 型不正（数値であるべき）
        totalAmount: 45000,
        referenceDate: "2024-01-18",
      },
      {
        rowIndex: 5,
        projectId: "PRJ005",
        region: "福岡",
        workType: "造成",
        unitPrice: 6000,
        quantity: 0, // 範囲外値（0以下は不正）
        totalAmount: 0,
        referenceDate: "2024-01-19",
      },
      {
        rowIndex: 6,
        projectId: "PRJ006",
        region: "広島",
        workType: "鉄道",
        unitPrice: 7000,
        quantity: 15,
        totalAmount: 105000,
        referenceDate: "2024-13-45", // 日付形式不正
      },
      {
        rowIndex: 7,
        projectId: "PRJ007",
        region: "札幌",
        workType: "橋梁",
        unitPrice: 8000,
        quantity: 20,
        totalAmount: 160000,
        referenceDate: "2024-01-20",
      },
    ];

    const validationRules = {
      unitPrice: {
        type: "number",
        min: 1,
        max: 1000000,
        required: true,
      },
      quantity: {
        type: "number",
        min: 1,
        max: 10000,
        required: true,
      },
      region: {
        type: "string",
        required: true,
        allowedValues: [
          "東京",
          "大阪",
          "名古屋",
          "福岡",
          "広島",
          "札幌",
          "京都",
        ],
      },
      referenceDate: {
        type: "string",
        pattern: /^\d{4}-\d{2}-\d{2}$/,
        required: true,
      },
      workType: {
        type: "string",
        required: true,
      },
    };

    const result = validateLearningDatasetQuality(testDataset, validationRules);

    // 検証結果ステータスが「失敗（FAIL）」と判定されているか確認
    expect(result.status).toBe("FAIL");

    // 不適合データが全て特定されているか確認（6件の不適合が検出されるべき）
    expect(result.invalidRecords.length).toBe(6);

    // 不適合データが適切なカテゴリに分類されているか確認
    const missingValueErrors = result.invalidRecords.filter(
      (r) => r.errorCategory === "MISSING_VALUE"
    );
    expect(missingValueErrors.length).toBe(1);
    expect(missingValueErrors[0].rowIndex).toBe(2);
    expect(missingValueErrors[0].fieldName).toBe("unitPrice");
    expect(missingValueErrors[0].errorReason).toMatch(/null/);

    const anomalyErrors = result.invalidRecords.filter(
      (r) => r.errorCategory === "ANOMALY"
    );
    expect(anomalyErrors.length).toBe(1);
    expect(anomalyErrors[0].rowIndex).toBe(3);
    expect(anomalyErrors[0].fieldName).toBe("unitPrice");
    expect(anomalyErrors[0].errorReason).toMatch(/負/);

    const typeErrors = result.invalidRecords.filter(
      (r) => r.errorCategory === "TYPE_ERROR"
    );
    expect(typeErrors.length).toBe(2);
    const typeErrorRowIndices = typeErrors.map((r) => r.rowIndex).sort();
    expect(typeErrorRowIndices).toEqual([4, 4]);
    const typeErrorByField = typeErrors.reduce(
      (acc, r) => {
        if (!acc[r.fieldName]) acc[r.fieldName] = 0;
        acc[r.fieldName]++;
        return acc;
      },
      {} as Record<string, number>
    );
    expect(typeErrorByField["region"]).toBe(1);
    expect(typeErrorByField["quantity"]).toBe(1);

    const rangeErrors = result.invalidRecords.filter(
      (r) => r.errorCategory === "OUT_OF_RANGE"
    );
    expect(rangeErrors.length).toBe(1);
    expect(rangeErrors[0].rowIndex).toBe(5);
    expect(rangeErrors[0].fieldName).toBe("quantity");
    expect(rangeErrors[0].errorReason).toMatch(/範囲外/);

    const formatErrors = result.invalidRecords.filter(
      (r) => r.errorCategory === "FORMAT_ERROR"
    );
    expect(formatErrors.length).toBe(1);
    expect(formatErrors[0].rowIndex).toBe(6);
    expect(formatErrors[0].fieldName).toBe("referenceDate");
    expect(formatErrors[0].errorReason).toMatch(/日付/);

    // エラーレポートに詳細な情報が記録されているか確認
    expect(result.errorSummary).toBeDefined();
    expect(result.errorSummary.totalRecords).toBe(7);
    expect(result.errorSummary.validRecords).toBe(1);
    expect(result.errorSummary.invalidRecords).toBe(6);
    expect(result.errorSummary.passRate).toBe((1 / 7) * 100);

    // カテゴリ別の集計が正確に記録されているか確認
    expect(result.errorSummary.byCategory).toBeDefined();
    expect(result.errorSummary.byCategory["MISSING_VALUE"]).toBe(1);
    expect(result.errorSummary.byCategory["ANOMALY"]).toBe(1);
    expect(result.errorSummary.byCategory["TYPE_ERROR"]).toBe(2);
    expect(result.errorSummary.byCategory["OUT_OF_RANGE"]).toBe(1);
    expect(result.errorSummary.byCategory["FORMAT_ERROR"]).toBe(1);

    // 不適合データの詳細情報が記録されているか確認
    const detailedReport = result.detailedReport;
    expect(detailedReport).toBeDefined();
    expect(detailedReport.extractionTimestamp).toBeDefined();
    expect(detailedReport.validationRulesVersion).toBeDefined();
    expect(detailedReport.datasetId).toBeDefined();

    // 各不適合レコードが完全な情報を持っているか確認
    result.invalidRecords.forEach((record) => {
      expect(record.rowIndex).toBeGreaterThanOrEqual(1);
      expect(record.fieldName).toBeDefined();
      expect(record.fieldName.length).toBeGreaterThan(0);
      expect(record.errorCategory).toMatch(
        /MISSING_VALUE|ANOMALY|TYPE_ERROR|OUT_OF_RANGE|FORMAT_ERROR/
      );
      expect(record.errorReason).toBeDefined();
      expect(record.errorReason.length).toBeGreaterThan(0);
      expect(record.actualValue).toBeDefined();
      expect(record.expectedType || record.expectedRange).toBeDefined();
    });

    // 検証失敗の判定理由が記録されているか確認
    expect(result.failureReason).toBeDefined();
    expect(result.failureReason).toMatch(/不適合データ/);

    // 検証タイムスタンプが記録されているか確認
    expect(result.validationTimestamp).toBeDefined();
    const timestamp = new Date(result.validationTimestamp);
    expect(timestamp.getTime()).toBeLessThanOrEqual(new Date().getTime());
  });
});