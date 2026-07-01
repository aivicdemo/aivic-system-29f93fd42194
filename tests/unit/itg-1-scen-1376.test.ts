import { recordMetadataChange } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目メタデータ管理機能", () => {
  // SCEN-1376
  test("営業データ項目の定義変更が版管理システムに記録され、影響範囲が自動判定される", () => {
    const input = {
      dataItemId: "DI-001",
      itemName: "顧客ID",
      previousDataType: "String",
      newDataType: "Integer",
      previousRequired: false,
      newRequired: true,
      changedBy: "user-op-001",
      changedAt: new Date("2024-01-15T10:30:00Z"),
      description: "顧客マスタの一意識別子",
    };

    const result = recordMetadataChange(input);

    // 版番号が新規付与されたことを確認
    expect(result.versionNumber).toBe(2);

    // タイムスタンプが記録されたことを確認
    expect(result.recordedAt).toEqual(new Date("2024-01-15T10:30:00Z"));

    // 変更者が正しく記録されたことを確認
    expect(result.changedBy).toBe("user-op-001");

    // 変更内容が記録されたことを確認
    expect(result.changeContent).toEqual({
      dataItemId: "DI-001",
      itemName: "顧客ID",
      changes: [
        {
          field: "dataType",
          previousValue: "String",
          newValue: "Integer",
        },
        {
          field: "required",
          previousValue: false,
          newValue: true,
        },
      ],
    });

    // 影響範囲が自動判定されたことを確認
    expect(result.impactAnalysis).toBeDefined();
    expect(result.impactAnalysis.affectedReports).toContain("月次サマリーレポート");
    expect(result.impactAnalysis.affectedReports).toContain("成果指標ダッシュボード");

    // 影響を受けるAPI一覧が抽出されたことを確認
    expect(result.impactAnalysis.affectedApis).toContain(
      "GET /api/sales-data/by-customer"
    );
    expect(result.impactAnalysis.affectedApis).toContain(
      "POST /api/billing/calculate"
    );

    // 影響を受けるバッチ処理一覧が抽出されたことを確認
    expect(result.impactAnalysis.affectedBatchProcesses).toContain(
      "月次請求額集計バッチ"
    );
    expect(result.impactAnalysis.affectedBatchProcesses).toContain(
      "営業成果レポート生成バッチ"
    );

    // 各影響対象に影響レベルが付与されたことを確認
    const reportImpact = result.impactAnalysis.details.find(
      (d: { targetName: string }) => d.targetName === "月次サマリーレポート"
    );
    expect(reportImpact).toBeDefined();
    expect(reportImpact.impactLevel).toBe("HIGH");
    expect(reportImpact.impactReason).toContain("必須フラグがONに変更");

    // 対応推奨事項が生成されたことを確認
    expect(reportImpact.recommendedAction).toContain("回帰テスト");
    expect(reportImpact.recommendedAction).toContain("ステークホルダー通知");

    // API影響の詳細が記録されたことを確認
    const apiImpact = result.impactAnalysis.details.find(
      (d: { targetName: string }) =>
        d.targetName === "GET /api/sales-data/by-customer"
    );
    expect(apiImpact).toBeDefined();
    expect(apiImpact.impactLevel).toBe("MEDIUM");

    // バッチ処理影響の詳細が記録されたことを確認
    const batchImpact = result.impactAnalysis.details.find(
      (d: { targetName: string }) =>
        d.targetName === "月次請求額集計バッチ"
    );
    expect(batchImpact).toBeDefined();
    expect(batchImpact.impactLevel).toBe("HIGH");

    // 影響対象件数が正しく集計されたことを確認
    expect(result.impactAnalysis.totalAffectedCount).toBe(5);

    // 影響範囲分析の完了フラグが立ったことを確認
    expect(result.impactAnalysis.isAnalysisComplete).toBe(true);
  });
});