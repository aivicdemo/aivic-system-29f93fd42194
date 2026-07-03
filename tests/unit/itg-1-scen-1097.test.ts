import { describe, test, expect } from "@jest/globals";
import { validateSalesDataCompleteness } from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データ入力時の品質検証ルール定義・実行機能", () => {
  test("SCEN-1097: 月次締め日到達時に営業データの必須項目完全性が自動検証される", () => {
    // 必須項目が全て入力されたレコード
    const completeRecord1 = {
      transaction_date: "2024-01-15",
      customer_id: "C001",
      product_id: "P001",
      amount: 50000,
      sales_person_id: "S001",
    };

    const completeRecord2 = {
      transaction_date: "2024-01-16",
      customer_id: "C002",
      product_id: "P002",
      amount: 75000,
      sales_person_id: "S002",
    };

    // 必須項目が不足しているレコード（transaction_dateが空）
    const incompleteRecord1 = {
      transaction_date: "",
      customer_id: "C003",
      product_id: "P003",
      amount: 100000,
      sales_person_id: "S003",
    };

    // 必須項目が不足しているレコード（customer_idが未定義）
    const incompleteRecord2 = {
      transaction_date: "2024-01-17",
      customer_id: undefined,
      product_id: "P004",
      amount: 60000,
      sales_person_id: "S004",
    };

    // 必須項目が不足しているレコード（amountがnull）
    const incompleteRecord3 = {
      transaction_date: "2024-01-18",
      customer_id: "C005",
      product_id: "P005",
      amount: null,
      sales_person_id: "S005",
    };

    const salesDataSet = [
      completeRecord1,
      completeRecord2,
      incompleteRecord1,
      incompleteRecord2,
      incompleteRecord3,
    ];

    const monthlyClosureDate = new Date("2024-01-31T23:59:59Z");

    // 検証プロセスを実行
    const validationResult = validateSalesDataCompleteness(
      salesDataSet,
      monthlyClosureDate
    );

    // 完全性チェックが実行されたことを確認
    expect(validationResult).toBeDefined();
    expect(validationResult.validation_executed).toBe(true);

    // 検証結果レポートが返されていることを確認
    expect(validationResult.report).toBeDefined();
    expect(Array.isArray(validationResult.report)).toBe(true);

    // 入力したレコード数が確認できることを確認
    expect(validationResult.total_records_checked).toBe(5);

    // 必須項目が完全なレコード数が正確に識別されていることを確認
    expect(validationResult.passed_records_count).toBe(2);

    // 必須項目が不足しているレコード数が正確に識別されていることを確認
    expect(validationResult.failed_records_count).toBe(3);

    // 検証エラーの詳細が正確に記録されていることを確認
    const errorDetails = validationResult.report.filter(
      (r: any) => r.validation_status === "failed"
    );
    expect(errorDetails.length).toBe(3);

    // 最初の不完全なレコードのエラー詳細を確認（transaction_dateが空）
    const error1 = errorDetails.find(
      (e: any) => e.record_index === 2
    );
    expect(error1).toBeDefined();
    expect(error1.missing_fields).toContain("transaction_date");
    expect(error1.validation_error_code).toMatch(/transaction_date|必須項目/);

    // 2番目の不完全なレコードのエラー詳細を確認（customer_idが未定義）
    const error2 = errorDetails.find(
      (e: any) => e.record_index === 3
    );
    expect(error2).toBeDefined();
    expect(error2.missing_fields).toContain("customer_id");
    expect(error2.validation_error_code).toMatch(/customer_id|必須項目/);

    // 3番目の不完全なレコードのエラー詳細を確認（amountがnull）
    const error3 = errorDetails.find(
      (e: any) => e.record_index === 4
    );
    expect(error3).toBeDefined();
    expect(error3.missing_fields).toContain("amount");
    expect(error3.validation_error_code).toMatch(/amount|必須項目/);

    // 完全なレコードが正確に分類されていることを確認
    const passedRecords = validationResult.report.filter(
      (r: any) => r.validation_status === "passed"
    );
    expect(passedRecords.length).toBe(2);
    expect(passedRecords[0].record_index).toBe(0);
    expect(passedRecords[1].record_index).toBe(1);

    // 請求処理対象として適切に区分されていることを確認
    expect(validationResult.ready_for_billing_count).toBe(2);
    expect(validationResult.awaiting_manual_review_count).toBe(3);

    // 検証プロセスの完了ステータスが確認できることを確認
    expect(validationResult.completion_status).toBe("completed");
    expect(validationResult.validation_timestamp).toBeDefined();
  });
});