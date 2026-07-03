import { validateMonthlyReportData } from "../../src/logic/it-1781935279444-2-2-1";

describe("月次レポート生成前の最終検証機能", () => {
  // SCEN-726
  test("確定済みデータに完全性の不備が検出され、生成が中止され修正指示が発行される", () => {
    // 確定済みデータセット：必須フィールド欠落を含む
    const confirmedDataset = {
      id: "dataset-001",
      month: "2024-01",
      status: "confirmed",
      records: [
        {
          recordId: "rec-101",
          customerId: "cust-A",
          serviceType: "service-1",
          appointmentCount: 5,
          contractCount: 2,
          amount: 50000,
          // customerName は必須だが欠落
          customerName: null,
          responsiblePerson: "Person A",
          contactEmail: "contact@example.com",
        },
        {
          recordId: "rec-102",
          customerId: "cust-B",
          serviceType: "service-2",
          appointmentCount: 3,
          contractCount: 1,
          amount: 30000,
          customerName: "Customer B",
          // responsiblePerson は必須だが欠落
          responsiblePerson: undefined,
          contactEmail: "contact-b@example.com",
        },
        {
          recordId: "rec-103",
          customerId: "cust-C",
          serviceType: "service-1",
          appointmentCount: 4,
          contractCount: 2,
          // amount は必須だが欠落
          amount: null,
          customerName: "Customer C",
          responsiblePerson: "Person C",
          contactEmail: "",
        },
      ],
    };

    const result = validateMonthlyReportData(confirmedDataset);

    // 検証結果：失敗ステータス
    expect(result.isValid).toBe(false);

    // 完全性エラーの検出
    expect(result.errors).toHaveLength(3);
    expect(result.errors[0]).toEqual({
      recordId: "rec-101",
      fieldName: "customerName",
      errorCode: "MISSING_REQUIRED_FIELD",
      message: "必須フィールド customerName が欠落しています",
    });
    expect(result.errors[1]).toEqual({
      recordId: "rec-102",
      fieldName: "responsiblePerson",
      errorCode: "MISSING_REQUIRED_FIELD",
      message: "必須フィールド responsiblePerson が欠落しています",
    });
    expect(result.errors[2]).toEqual({
      recordId: "rec-103",
      fieldName: "amount",
      errorCode: "MISSING_REQUIRED_FIELD",
      message: "必須フィールド amount が欠落しています",
    });

    // レポートステータスが「生成中止」に変更される
    expect(result.reportStatus).toBe("generation_stopped");

    // 修正指示メッセージの構成
    expect(result.correctionInstructions).toBeDefined();
    expect(result.correctionInstructions).toContain("rec-101");
    expect(result.correctionInstructions).toContain("customerName");
    expect(result.correctionInstructions).toContain("rec-102");
    expect(result.correctionInstructions).toContain("responsiblePerson");
    expect(result.correctionInstructions).toContain("rec-103");
    expect(result.correctionInstructions).toContain("amount");

    // エラーログの詳細記録
    expect(result.errorLog).toBeDefined();
    expect(result.errorLog.timestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );
    expect(result.errorLog.datasetId).toBe("dataset-001");
    expect(result.errorLog.validationPhase).toBe("pre_generation_final_check");
    expect(result.errorLog.detectedIssues).toHaveLength(3);
    expect(result.errorLog.detectedIssues[0].recordId).toBe("rec-101");
    expect(result.errorLog.detectedIssues[0].fieldName).toBe("customerName");
    expect(result.errorLog.detectedIssues[1].recordId).toBe("rec-102");
    expect(result.errorLog.detectedIssues[1].fieldName).toBe("responsiblePerson");
    expect(result.errorLog.detectedIssues[2].recordId).toBe("rec-103");
    expect(result.errorLog.detectedIssues[2].fieldName).toBe("amount");

    // ユーザーに表示するエラーメッセージ
    expect(result.userMessage).toBeDefined();
    expect(result.userMessage).toMatch(/生成が中止されました/);
    expect(result.userMessage).toMatch(/3件のデータ不備が検出されました/);

    // レポート生成が中止されたため、出力ファイルは生成されない
    expect(result.generatedReportPath).toBeNull();

    // 修正完了後の再実行が可能であることを示すフラグ
    expect(result.allowRetry).toBe(true);
  });
});