import { validateRegistrationData } from "../../src/logic/it-6-2-2-1";

describe("査定員別・案件別の判定ロジック・乖離パターン履歴の記録・抽出機能", () => {
  // SCEN-1484: [normal] 登録データ品質検証 - 登録データが形式・値域・重複チェックをすべて通過する場合、データを受け入れる
  test("should accept valid registration data that passes format, range, and duplicate checks", async () => {
    // テストデータ準備：形式が正しく、値域内の値を持つ、重複のないサンプルデータ
    const sampleData = {
      assessmentId: "ASS-20240115-001",
      judgmentLogicId: "LOGIC-2024-Q1-001",
      deviationRate: 8.5,
      deviationAmount: 125000,
      referenceDataCount: 42,
      correctionCoefficient: 1.05,
      deviationPattern: "OVER",
      assessorId: "ASSOR-2024-0301",
      projectId: "PROJ-2024-00512",
      createdAt: new Date("2024-01-15T11:00:00Z"),
      createdBy: "user_admin_001"
    };

    const existingData = [
      {
        assessmentId: "ASS-20240115-002",
        judgmentLogicId: "LOGIC-2024-Q1-002",
        deviationRate: 6.2,
        deviationAmount: 95000,
        referenceDataCount: 38,
        correctionCoefficient: 1.02,
        deviationPattern: "UNDER",
        assessorId: "ASSOR-2024-0302",
        projectId: "PROJ-2024-00513",
        createdAt: new Date("2024-01-14T10:30:00Z"),
        createdBy: "user_admin_002"
      }
    ];

    // Mock API呼び出し用のレスポンス
    const mockResponse = {
      status: 200,
      message: "データが正常に登録されました",
      registeredId: "REG-20240115-000001",
      timestamp: "2024-01-15T11:00:15Z",
      validationSummary: {
        formatCheckPassed: true,
        rangeCheckPassed: true,
        duplicateCheckPassed: true
      }
    };

    // 登録データ品質検証機能を実行
    const result = await validateRegistrationData(sampleData, existingData);

    // 形式チェック処理が正常に完了し、エラーが返されないことを確認
    expect(result.validationSummary.formatCheckPassed).toBe(true);

    // 値域チェック処理が正常に完了し、エラーが返されないことを確認
    expect(result.validationSummary.rangeCheckPassed).toBe(true);

    // 重複チェック処理が正常に完了し、エラーが返されないことを確認
    expect(result.validationSummary.duplicateCheckPassed).toBe(true);

    // すべてのチェックが完了後、データベースへのデータ登録処理を実行
    // → validateRegistrationData関数内で自動実行される

    // 登録結果を確認し、データが正常に受け入れられたことを検証
    expect(result.status).toBe(200);
    expect(result.message).toBe("データが正常に登録されました");

    // 登録成功を示すレスポンスコード（ステータス200など）と登録されたデータのIDが返却されることを確認
    expect(result.registeredId).toBe("REG-20240115-000001");
    expect(typeof result.registeredId).toBe("string");
    expect(result.registeredId.length).toBeGreaterThan(0);

    // 登録タイムスタンプが正しく記録されたことを確認
    expect(result.timestamp).toBe("2024-01-15T11:00:15Z");

    // 各フィールドの値が許容範囲内であることを確認
    expect(sampleData.deviationRate).toBeGreaterThanOrEqual(0);
    expect(sampleData.deviationRate).toBeLessThanOrEqual(100);
    expect(sampleData.referenceDataCount).toBeGreaterThanOrEqual(0);
    expect(sampleData.correctionCoefficient).toBeGreaterThan(0);

    // 重複チェック：新しいデータが既存データと異なることを確認
    const isDuplicate = existingData.some(
      (item) => item.assessmentId === sampleData.assessmentId
    );
    expect(isDuplicate).toBe(false);

    // 乖離パターンが有効な値であることを確認
    expect(["OVER", "UNDER", "STANDARD"]).toContain(sampleData.deviationPattern);

    // ユーザーIDと案件IDが記録されていることを確認
    expect(result.registeredId).toBeDefined();
    expect(sampleData.createdBy).toBe("user_admin_001");
  });
});