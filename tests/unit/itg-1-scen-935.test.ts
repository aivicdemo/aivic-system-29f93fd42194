import { evaluateStaffCompetencyProgress } from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレート定義・管理機能 - 習熟度判定基準設定エラーハンドリング", () => {
  // SCEN-935
  test("習熟度判定基準が未設定の状態で育成進捗判定を実行した場合、適切なエラーメッセージが表示される", () => {
    const staffId = "staff_001";
    const competencyStandards = null;
    const staffPerformanceData = {
      staffId: staffId,
      billingDocumentCreationAccuracy: 0.92,
      billingDocumentCreationSpeed: 8.5,
      operationalReportsAccuracyRate: 0.88,
      operationalReportsTimeliness: 7.2,
      contractManagementAccuracy: 0.95,
      contractManagementCompleteness: 0.89,
    };

    expect(() =>
      evaluateStaffCompetencyProgress(staffId, competencyStandards, staffPerformanceData)
    ).toThrow(/習熟度判定基準/);
  });
});