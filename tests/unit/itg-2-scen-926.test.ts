import { describe, test, expect } from "@jest/globals";
import {
  validateDataQualityAndMakeApprovalDecision,
} from "../../src/logic/it-1-br-2-2-2-1";

describe("査定品質管理・月次集計・分析ダッシュボード - データ品質検証・承認基準判定", () => {
  // SCEN-926: [edge] データ品質検証・承認基準判定機能 - カバー率が境界値（例：70%）の場合に正確に基準判定される
  test("SCEN-926: カバー率が境界値70%で正確に承認判定が行われること", () => {
    // テストデータ：カバー率が正確に70%のケース
    const dataSetCoverageAtBoundary = {
      totalAppraisalCases: 100,
      coveredCases: 70,
      coverageRate: 70.0,
      regionCount: 5,
      constructionTypeCount: 8,
      seasonalVariationCovered: true,
      dataQualityScore: 75,
      duplicateRate: 0.5,
      anomalyRate: 1.2,
      missingDataRate: 2.0,
    };

    // 実行：カバー率70%のデータで承認基準判定を実行
    const resultAtBoundary =
      validateDataQualityAndMakeApprovalDecision(
        dataSetCoverageAtBoundary
      );

    // 期待結果：カバー率70%は承認基準の境界値ちょうど（「以上」ルール適用）
    // → 承認判定となることを確認
    expect(resultAtBoundary.approvalStatus).toBe("approved");
    expect(resultAtBoundary.coverageRateAtApproval).toBe(70.0);
    expect(resultAtBoundary.judgmentReason).toMatch(/70/);

    // テストデータ：カバー率が69.9%（境界値未満）
    const dataSetBelowBoundary = {
      totalAppraisalCases: 100,
      coveredCases: 69,
      coverageRate: 69.9,
      regionCount: 5,
      constructionTypeCount: 8,
      seasonalVariationCovered: true,
      dataQualityScore: 75,
      duplicateRate: 0.5,
      anomalyRate: 1.2,
      missingDataRate: 2.0,
    };

    // 実行：カバー率69.9%のデータで承認基準判定を実行
    const resultBelowBoundary =
      validateDataQualityAndMakeApprovalDecision(
        dataSetBelowBoundary
      );

    // 期待結果：カバー率69.9%は承認基準未達
    // → 不承認判定となることを確認
    expect(resultBelowBoundary.approvalStatus).toBe("rejected");
    expect(resultBelowBoundary.coverageRateAtApproval).toBe(69.9);

    // テストデータ：カバー率が70.1%（境界値超過）
    const dataSetAboveBoundary = {
      totalAppraisalCases: 100,
      coveredCases: 71,
      coverageRate: 70.1,
      regionCount: 5,
      constructionTypeCount: 8,
      seasonalVariationCovered: true,
      dataQualityScore: 75,
      duplicateRate: 0.5,
      anomalyRate: 1.2,
      missingDataRate: 2.0,
    };

    // 実行：カバー率70.1%のデータで承認基準判定を実行
    const resultAboveBoundary =
      validateDataQualityAndMakeApprovalDecision(
        dataSetAboveBoundary
      );

    // 期待結果：カバー率70.1%は承認基準達成
    // → 承認判定となることを確認
    expect(resultAboveBoundary.approvalStatus).toBe("approved");
    expect(resultAboveBoundary.coverageRateAtApproval).toBe(70.1);

    // 境界値での判定一貫性の検証
    // ・カバー率69.9% → 不承認
    // ・カバー率70.0% → 承認
    // ・カバー率70.1% → 承認
    // この順序が論理的に一貫していることを確認
    expect(resultBelowBoundary.approvalStatus).not.toBe(
      resultAtBoundary.approvalStatus
    );
    expect(resultAtBoundary.approvalStatus).toBe(
      resultAboveBoundary.approvalStatus
    );

    // ログ・レポートに判定根拠が正確に記録されていることを確認
    expect(resultAtBoundary.approvalDecisionLog).toBeDefined();
    expect(resultAtBoundary.approvalDecisionLog).toMatch(/70\.0/);
    expect(resultAtBoundary.approvalDecisionLog).toMatch(/承認基準/);

    // 判定根拠にカバー率、総対象件数、カバー件数の3要素が含まれていること
    expect(resultAtBoundary.judgmentBasis).toHaveProperty("coverageRate");
    expect(resultAtBoundary.judgmentBasis.coverageRate).toBe(70.0);
    expect(resultAtBoundary.judgmentBasis).toHaveProperty(
      "totalAppraisalCases"
    );
    expect(resultAtBoundary.judgmentBasis.totalAppraisalCases).toBe(100);
    expect(resultAtBoundary.judgmentBasis).toHaveProperty("coveredCases");
    expect(resultAtBoundary.judgmentBasis.coveredCases).toBe(70);

    // カバー率計算式が正確であることを検証：
    // 計算式 = (coveredCases / totalAppraisalCases) * 100
    // = (70 / 100) * 100 = 70.0
    const calculatedCoverage =
      (resultAtBoundary.judgmentBasis.coveredCases /
        resultAtBoundary.judgmentBasis.totalAppraisalCases) *
      100;
    expect(calculatedCoverage).toBe(70.0);

    // データ品質スコア（異常値率・重複率・欠損率を総合判定）も検証
    expect(resultAtBoundary.dataQualityMetrics).toBeDefined();
    expect(resultAtBoundary.dataQualityMetrics.duplicateRate).toBe(0.5);
    expect(resultAtBoundary.dataQualityMetrics.anomalyRate).toBe(1.2);
    expect(resultAtBoundary.dataQualityMetrics.missingDataRate).toBe(2.0);

    // 承認判定時刻がシステムに記録されていること
    expect(resultAtBoundary.approvalTimestamp).toBeDefined();
    expect(typeof resultAtBoundary.approvalTimestamp).toBe("string");

    // 境界値テスト：カバー率が69.95%（四捨五入で70%になりうる値）の場合
    // → 実際の判定は69.95%であり、70%ではないので不承認となることを確認
    const dataSetNearBoundary = {
      totalAppraisalCases: 200,
      coveredCases: 139,
      coverageRate: 69.5,
      regionCount: 5,
      constructionTypeCount: 8,
      seasonalVariationCovered: true,
      dataQualityScore: 75,
      duplicateRate: 0.5,
      anomalyRate: 1.2,
      missingDataRate: 2.0,
    };

    const resultNearBoundary =
      validateDataQualityAndMakeApprovalDecision(
        dataSetNearBoundary
      );

    expect(resultNearBoundary.approvalStatus).toBe("rejected");
    expect(resultNearBoundary.coverageRateAtApproval).toBeLessThan(70.0);
  });
});