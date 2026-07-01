import { describe, test, expect } from "@jest/globals";
import { validateGeneratedReportQualityChecklist } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  // SCEN-656
  test("チェックリスト項目の検証が失敗した場合に差戻し判定となる", () => {
    // 【前提】: チェックリスト検証対象となる生成済みレポートが存在し、複数のチェックリスト項目が定義されている状態
    // 【発生条件】: チェックリスト内の複数項目（データ完全性、形式妥当性、数値精度など）を確認する際に、
    //             1つ以上の検証ロジックを意図的に失敗させる条件が設定される
    // 【結果】: チェックリスト項目の検証が1つ以上失敗した場合、レポートの判定ステータスが「差戻し」と表示され、
    //          差戻し理由に失敗した検証項目の詳細情報が記録される

    const reportData = {
      reportId: "RPT-2024-001",
      generationTimestamp: "2024-01-15T11:00:00Z",
      targetCustomerId: "CUST-A001",
      targetServiceId: "SVC-B001",
      month: "2024-01",
      dataItems: [
        {
          itemName: "アポ数",
          value: 10,
          unit: "件",
          dataType: "number",
          isRequired: true,
          isPresent: true,
        },
        {
          itemName: "成約数",
          value: 3,
          unit: "件",
          dataType: "number",
          isRequired: true,
          isPresent: true,
        },
        {
          itemName: "顧客反応スコア",
          value: 8.5,
          unit: "スコア",
          dataType: "number",
          isRequired: false,
          isPresent: true,
        },
      ],
      calculatedAmount: 45000,
    };

    // チェックリスト項目: 【データ完全性検証】必須項目すべてが入力されているか
    const checklistItem_1_completeness = {
      checkId: "CHK-001",
      checkName: "データ完全性",
      checkType: "COMPLETENESS",
      expectedResult: true, // 必須項目がすべて揃っていることを期待
      actualResult: true, // アクチュアルは揃っているが、ロジックを失敗させる条件を設定
      isFailure: false,
    };

    // チェックリスト項目: 【形式妥当性検証】各データ型が指定フォーマットと一致しているか
    const checklistItem_2_format = {
      checkId: "CHK-002",
      checkName: "形式妥当性",
      checkType: "FORMAT",
      expectedResult: true,
      actualResult: false, // 形式チェックで失敗
      isFailure: true,
      failureReason: "顧客反応スコアの値8.5が許容範囲（0-10整数）の形式に違反",
    };

    // チェックリスト項目: 【数値精度検証】計算結果と入力データの矛盾がないか
    const checklistItem_3_precision = {
      checkId: "CHK-003",
      checkName: "数値精度",
      checkType: "PRECISION",
      expectedResult: true,
      actualResult: false, // 精度チェックで失敗
      isFailure: true,
      failureReason: "計算済み請求額45000が、アポ数10件×単価4000円＝40000円と一致しない",
    };

    const checklistItems = [
      checklistItem_1_completeness,
      checklistItem_2_format,
      checklistItem_3_precision,
    ];

    // 【実行】チェックリスト検証を実行
    const validationResult = validateGeneratedReportQualityChecklist({
      reportId: reportData.reportId,
      reportData: reportData,
      checklistItems: checklistItems,
    });

    // 【検証: 判定ステータスが「差戻し」である】
    // 1つ以上の検証項目が失敗した場合、判定ステータスは「差戻し」(REJECTED) となる
    expect(validationResult.judgmentStatus).toBe("REJECTED");

    // 【検証: 失敗した検証項目の詳細情報が記録されている】
    expect(validationResult.failureDetails).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          checkId: "CHK-002",
          checkName: "形式妥当性",
          failureReason: "顧客反応スコアの値8.5が許容範囲（0-10整数）の形式に違反",
        }),
        expect.objectContaining({
          checkId: "CHK-003",
          checkName: "数値精度",
          failureReason: "計算済み請求額45000が、アポ数10件×単価4000円＝40000円と一致しない",
        }),
      ])
    );

    // 【検証: 失敗項目数が正確に記録されている】
    // 失敗した項目は「形式妥当性」と「数値精度」の2項目
    expect(validationResult.failureCount).toBe(2);

    // 【検証: 合格項目数が正確に記録されている】
    // 合格した項目は「データ完全性」1項目
    expect(validationResult.passCount).toBe(1);

    // 【検証: 総チェック項目数が記録されている】
    expect(validationResult.totalCheckItems).toBe(3);

    // 【検証: 差戻し理由に失敗した検証項目のリストが含まれている】
    expect(validationResult.rejectionReason).toContain(
      "形式妥当性, 数値精度"
    );

    // 【検証: エラーログが生成されている】
    expect(validationResult.errorLog).toBeDefined();
    expect(validationResult.errorLog.length).toBeGreaterThan(0);

    // 【検証: エラーログに失敗した検証項目の情報が含まれている】
    const errorLogMessages = validationResult.errorLog.map((log) => log.message);
    expect(errorLogMessages).toEqual(
      expect.arrayContaining([
        expect.stringContaining("形式妥当性"),
        expect.stringContaining("数値精度"),
      ])
    );

    // 【検証: レポートIDが正確に記録されている】
    expect(validationResult.reportId).toBe("RPT-2024-001");

    // 【検証: 検証タイムスタンプが記録されている】
    expect(validationResult.validationTimestamp).toBeDefined();
    expect(typeof validationResult.validationTimestamp).toBe("string");

    // 【エラーハンドリング検証】: 検証失敗時にシステムがエラーを適切にハンドルしている
    // validateGeneratedReportQualityChecklist が constraints を満たさない入力を受け取った場合、エラーをスロー
    expect(() => {
      validateGeneratedReportQualityChecklist({
        reportId: "", // 空のreportId
        reportData: reportData,
        checklistItems: checklistItems,
      });
    }).toThrow(/報告書ID/);

    // 【エラーハンドリング検証】: checklistItems が空の場合
    expect(() => {
      validateGeneratedReportQualityChecklist({
        reportId: reportData.reportId,
        reportData: reportData,
        checklistItems: [], // 空のチェックリスト
      });
    }).toThrow(/チェックリスト/);

    // 【エラーハンドリング検証】: reportData が null の場合
    expect(() => {
      validateGeneratedReportQualityChecklist({
        reportId: reportData.reportId,
        reportData: null as any,
        checklistItems: checklistItems,
      });
    }).toThrow(/レポートデータ/);
  });
});