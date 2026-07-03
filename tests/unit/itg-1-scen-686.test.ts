import { describe, test, expect } from "@jest/globals";
import { validateSalesDataQuality } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  // SCEN-686: [edge] 営業データ品質自動検証・通知機能 - 許容範囲内の軽微なデータ異常は検出対象外として扱われる
  test("許容範囲内の軽微なデータ異常は検出対象外として扱われ、エラーとして記録されず、通知も送信されない", () => {
    // テストデータ準備: 許容範囲内の軽微なデータ異常を含む営業データレコード
    const salesDataWithMinorAnomalies = {
      salesDataId: "sd_20240115_001",
      customerId: "cust_12345",
      serviceId: "svc_sales_call",
      appointmentCount: 45,
      contractCount: 12,
      amountBilled: 125000.005, // 金額の小数第3位の誤差（許容範囲内：±0.01以下）
      contactDate: "2024-01-15T09:00:01Z", // 日付形式の軽微なズレ（許容範囲内：±1日以内）
      dataEntryDate: "2024-01-15T10:30:00Z",
      status: "completed",
      notes: "Minor timestamp variance",
    };

    // 品質検証ルールエンジンに許容範囲の閾値を設定
    const validationThresholds = {
      amountBilledToleranceRange: 0.01, // 金額誤差±0.01以下
      dateToleranceDays: 1, // 日付ズレ±1日以内
      mandatoryFieldsList: [
        "salesDataId",
        "customerId",
        "serviceId",
        "appointmentCount",
        "contractCount",
        "amountBilled",
        "contactDate",
        "dataEntryDate",
        "status",
      ],
      dateFormatPattern: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/,
    };

    // 自動検証機能を実行し、準備したテストデータを処理
    const validationResult = validateSalesDataQuality(
      salesDataWithMinorAnomalies,
      validationThresholds
    );

    // 期待結果の検証: 許容範囲内の軽微なデータ異常は検出対象外として扱われる
    expect(validationResult.isValid).toBe(true);
    expect(validationResult.hasErrors).toBe(false);
    expect(validationResult.errorCount).toBe(0);
    expect(validationResult.warningCount).toBe(0);

    // 検証ログを確認: 軽微なデータ異常がエラーとして検出されたかどうかを確認
    expect(validationResult.detectedIssues).toEqual([]);
    expect(validationResult.issueLog).toEqual([]);

    // 通知機能の動作状況を確認: 通知送信の有無、通知内容を検査
    expect(validationResult.shouldNotify).toBe(false);
    expect(validationResult.notificationContent).toBe(null);
    expect(validationResult.notificationLevel).toBe(null);

    // 品質管理ダッシュボード表示状態を確認: 該当レコードが正常データとして扱われることを検証
    expect(validationResult.dashboardStatus).toBe("normal");
    expect(validationResult.qualityGrade).toBe("pass");
    expect(validationResult.canProceedToAutomatedBilling).toBe(true);

    // 後続の請求自動化処理へ支障なく進むことを検証
    expect(validationResult.blockedForBilling).toBe(false);
    expect(validationResult.requiresManualReview).toBe(false);
  });
});