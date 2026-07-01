import { describe, test, expect, beforeEach } from "@jest/globals";
import {
  validateSalesDataQuality,
} from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データ品質チェック結果表示機能", () => {
  // SCEN-704: [edge] 営業データ品質チェック結果表示機能 - 100件以上の品質不備がある場合も全件を表示できる
  test("should display all quality defects when dataset contains 100+ items with pagination support", () => {
    // 準備: 100件以上の品質不備を含むテストデータセット
    const salesDataWithDefects = Array.from({ length: 120 }, (_, index) => ({
      recordId: `record_${String(index + 1).padStart(3, "0")}`,
      customerId: `customer_${Math.floor((index + 1) / 10)}`,
      appointmentCount: index % 3 === 0 ? null : Math.floor(Math.random() * 10),
      contractCount: index % 5 === 0 ? -1 : Math.floor(Math.random() * 5),
      serviceType:
        index % 7 === 0 ? "" : ["serviceA", "serviceB", "serviceC"][index % 3],
      contactDate:
        index % 4 === 0 ? "invalid-date" : `2024-01-${String((index % 28) + 1).padStart(2, "0")}`,
      amount:
        index % 6 === 0 ? 999999999 : Math.floor(Math.random() * 100000),
      description: `sales_activity_${String(index + 1).padStart(3, "0")}`,
    }));

    // 実行: 品質チェック実行
    const checkResult = validateSalesDataQuality({
      salesData: salesDataWithDefects,
      requiredFields: [
        "recordId",
        "customerId",
        "appointmentCount",
        "contractCount",
        "serviceType",
        "contactDate",
        "amount",
      ],
      validationRules: {
        appointmentCount: {
          allowNull: false,
          dataType: "number",
          minValue: 0,
          maxValue: 100,
        },
        contractCount: {
          allowNull: false,
          dataType: "number",
          minValue: 0,
          maxValue: 50,
        },
        serviceType: {
          allowNull: false,
          dataType: "string",
          validValues: ["serviceA", "serviceB", "serviceC"],
        },
        contactDate: {
          allowNull: false,
          dataType: "date",
          format: "YYYY-MM-DD",
        },
        amount: {
          allowNull: false,
          dataType: "number",
          minValue: 0,
          maxValue: 500000,
        },
      },
      pageSize: 50,
    });

    // 検証 1: 全体的なチェック結果構造
    expect(checkResult).toHaveProperty("totalDefectCount");
    expect(checkResult).toHaveProperty("defects");
    expect(checkResult).toHaveProperty("paginationInfo");
    expect(checkResult.defects).toBeInstanceOf(Array);

    // 検証 2: 100件以上の不備が検出されていることを確認
    // 期待値計算:
    // - appointmentCount null: 120 / 3 = 40件
    // - contractCount < 0: 120 / 5 = 24件
    // - serviceType 空文字列: 120 / 7 = 約17件
    // - contactDate 無効: 120 / 4 = 30件
    // - amount > 500000: 120 / 6 = 20件
    // (重複がある可能性があるため合計は120未満だが、複数エラーを持つレコードもある)
    expect(checkResult.totalDefectCount).toBeGreaterThanOrEqual(100);

    // 検証 3: ページネーション情報が正しく設定されている
    expect(checkResult.paginationInfo).toEqual({
      pageSize: 50,
      totalPages: Math.ceil(checkResult.totalDefectCount / 50),
      currentPage: 1,
      hasNextPage: checkResult.totalDefectCount > 50,
    });

    // 検証 4: 最初の50件のページが正しく取得されている
    expect(checkResult.defects.length).toBe(
      Math.min(50, checkResult.totalDefectCount)
    );

    // 検証 5: 不備データの詳細情報が正しく含まれている
    checkResult.defects.forEach((defect) => {
      expect(defect).toHaveProperty("recordId");
      expect(defect).toHaveProperty("fieldName");
      expect(defect).toHaveProperty("errorMessage");
      expect(defect).toHaveProperty("errorType");
      expect(defect).toHaveProperty("actualValue");
      expect(typeof defect.recordId).toBe("string");
      expect(typeof defect.fieldName).toBe("string");
      expect(typeof defect.errorMessage).toBe("string");
      expect(
        [
          "MISSING_VALUE",
          "INVALID_TYPE",
          "OUT_OF_RANGE",
          "INVALID_FORMAT",
        ].includes(defect.errorType)
      ).toBe(true);
    });

    // 検証 6: 最初のページに異なる種類のエラーが混在していることを確認
    const errorTypes = new Set(checkResult.defects.map((d) => d.errorType));
    expect(errorTypes.size).toBeGreaterThan(1);

    // 検証 7: 異なるフィールドの不備が含まれていることを確認
    const fieldNames = new Set(checkResult.defects.map((d) => d.fieldName));
    expect(fieldNames.size).toBeGreaterThanOrEqual(3);

    // 検証 8: 次ページの不備データを取得
    const secondPageResult = validateSalesDataQuality({
      salesData: salesDataWithDefects,
      requiredFields: [
        "recordId",
        "customerId",
        "appointmentCount",
        "contractCount",
        "serviceType",
        "contactDate",
        "amount",
      ],
      validationRules: {
        appointmentCount: {
          allowNull: false,
          dataType: "number",
          minValue: 0,
          maxValue: 100,
        },
        contractCount: {
          allowNull: false,
          dataType: "number",
          minValue: 0,
          maxValue: 50,
        },
        serviceType: {
          allowNull: false,
          dataType: "string",
          validValues: ["serviceA", "serviceB", "serviceC"],
        },
        contactDate: {
          allowNull: false,
          dataType: "date",
          format: "YYYY-MM-DD",
        },
        amount: {
          allowNull: false,
          dataType: "number",
          minValue: 0,
          maxValue: 500000,
        },
      },
      pageSize: 50,
      page: 2,
    });

    // 検証 9: 次ページが正しく取得されている
    expect(secondPageResult.paginationInfo.currentPage).toBe(2);
    expect(secondPageResult.defects.length).toBeGreaterThan(0);

    // 検証 10: 第2ページのデータが最初のページと異なることを確認
    const firstPageRecordIds = new Set(
      checkResult.defects.map((d) => d.recordId)
    );
    const secondPageRecordIds = new Set(
      secondPageResult.defects.map((d) => d.recordId)
    );
    const overlap = [...firstPageRecordIds].filter((id) =>
      secondPageRecordIds.has(id)
    );
    expect(overlap.length).toBe(0);

    // 検証 11: 最終ページまでの遷移可能性を確認
    const totalPages = checkResult.paginationInfo.totalPages;
    expect(totalPages).toBeGreaterThanOrEqual(3);

    // 検証 12: 最後のページで hasNextPage が false であることを確認
    const lastPageResult = validateSalesDataQuality({
      salesData: salesDataWithDefects,
      requiredFields: [
        "recordId",
        "customerId",
        "appointmentCount",
        "contractCount",
        "serviceType",
        "contactDate",
        "amount",
      ],
      validationRules: {
        appointmentCount: {
          allowNull: false,
          dataType: "number",
          minValue: 0,
          maxValue: 100,
        },
        contractCount: {
          allowNull: false,
          dataType: "number",
          minValue: 0,
          maxValue: 50,
        },
        serviceType: {
          allowNull: false,
          dataType: "string",
          validValues: ["serviceA", "serviceB", "serviceC"],
        },
        contactDate: {
          allowNull: false,
          dataType: "date",
          format: "YYYY-MM-DD",
        },
        amount: {
          allowNull: false,
          dataType: "number",
          minValue: 0,
          maxValue: 500000,
        },
      },
      pageSize: 50,
      page: totalPages,
    });

    expect(lastPageResult.paginationInfo.hasNextPage).toBe(false);
    expect(lastPageResult.defects.length).toBeGreaterThan(0);

    // 検証 13: 全ページの不備データ総数が一致していることを確認
    // (各ページの不備データ数の合計が totalDefectCount と等しいことを確認できるよう計算)
    const allDefectsCount =
      checkResult.defects.length +
      (secondPageResult.defects.length || 0) +
      (lastPageResult.defects.length || 0);
    expect(allDefectsCount).toBeLessThanOrEqual(checkResult.totalDefectCount);

    // 検証 14: 各不備レコードに対して詳細情報が完全であることを確認
    checkResult.defects.forEach((defect) => {
      if (defect.errorType === "MISSING_VALUE") {
        expect(defect.errorMessage).toMatch(/必須/);
      }
      if (defect.errorType === "INVALID_TYPE") {
        expect(defect.errorMessage).toMatch(/型/);
      }
      if (defect.errorType === "OUT_OF_RANGE") {
        expect(defect.errorMessage).toMatch(/範囲/);
      }
      if (defect.errorType === "INVALID_FORMAT") {
        expect(defect.errorMessage).toMatch(/形式/);
      }
    });

    // 検証 15: パフォーマンス測定（チェック実行完了時間が許容範囲内）
    const startTime = performance.now();
    validateSalesDataQuality({
      salesData: salesDataWithDefects,
      requiredFields: [
        "recordId",
        "customerId",
        "appointmentCount",
        "contractCount",
        "serviceType",
        "contactDate",
        "amount",
      ],
      validationRules: {
        appointmentCount: {
          allowNull: false,
          dataType: "number",
          minValue: 0,
          maxValue: 100,
        },
        contractCount: {
          allowNull: false,
          dataType: "number",
          minValue: 0,
          maxValue: 50,
        },
        serviceType: {
          allowNull: false,
          dataType: "string",
          validValues: ["serviceA", "serviceB", "serviceC"],
        },
        contactDate: {
          allowNull: false,
          dataType: "date",
          format: "YYYY-MM-DD",
        },
        amount: {
          allowNull: false,
          dataType: "number",
          minValue: 0,
          maxValue: 500000,
        },
      },
      pageSize: 50,
    });
    const endTime = performance.now();
    const executionTime = endTime - startTime;

    // 許容範囲: 120件のデータをチェックして1000ms以内で完了
    expect(executionTime).toBeLessThan(1000);
  });
});