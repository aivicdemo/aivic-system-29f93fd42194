import { aggregateJudgmentAccuracyByAppraiserAndType } from "../../src/logic/it-6-2-1-1";

describe("査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  // SCEN-1017: [edge] 見積査定員による説明資料の品質チェック - OCR読取精度が基準値の境界値（例：95%）の場合に正確に判定される
  test("OCR読取精度が境界値95%の場合に正確に判定される", () => {
    // Precondition: 査定品質管理・標準化システムにログイン済み
    // 見積査定員のアカウント、説明資料の品質チェック機能が利用可能な状態

    // 入力データセット: 複数の査定員による判定結果と相場乖離データ
    const appraisalData = [
      {
        appraiserId: "APPR001",
        appraiserName: "田中査定員",
        constructionType: "鉄筋コンクリート造",
        amountBand: "1000万円～5000万円",
        judgmentCount: 25,
        accuracyRate: 95.0, // 境界値
        deviationAverage: 2.5,
        processingTimeMinutes: 18.5,
        ocrAccuracy: 95.0, // OCR読取精度 = 95%（境界値）
        materialDataQuality: 92.0,
      },
      {
        appraiserId: "APPR002",
        appraiserName: "鈴木査定員",
        constructionType: "鉄筋コンクリート造",
        amountBand: "1000万円～5000万円",
        judgmentCount: 28,
        accuracyRate: 96.5,
        deviationAverage: 2.1,
        processingTimeMinutes: 17.2,
        ocrAccuracy: 96.8,
        materialDataQuality: 94.5,
      },
      {
        appraiserId: "APPR003",
        appraiserName: "佐藤査定員",
        constructionType: "木造",
        amountBand: "500万円～1000万円",
        judgmentCount: 20,
        accuracyRate: 91.0,
        deviationAverage: 3.8,
        processingTimeMinutes: 19.5,
        ocrAccuracy: 90.5,
        materialDataQuality: 88.0,
      },
    ];

    const result = aggregateJudgmentAccuracyByAppraiserAndType(appraisalData);

    // Outcome 1: OCR読取精度が95%（基準値）の場合は『合格』と判定される
    expect(result.appraisers[0].qualityCheckResult).toBe("合格");
    expect(result.appraisers[0].qualityCheckStatus).toBe("pass");
    expect(result.appraisers[0].ocrAccuracyJudgment).toBe("合格");

    // Outcome 2: OCR読取精度が94.9%（境界値以下）の場合は『不合格』と判定される
    const appraisalData_BelowThreshold = [
      {
        appraiserId: "APPR001",
        appraiserName: "田中査定員",
        constructionType: "鉄筋コンクリート造",
        amountBand: "1000万円～5000万円",
        judgmentCount: 25,
        accuracyRate: 94.9,
        deviationAverage: 2.5,
        processingTimeMinutes: 18.5,
        ocrAccuracy: 94.9, // OCR読取精度 = 94.9%（境界値以下）
        materialDataQuality: 92.0,
      },
    ];

    const resultBelowThreshold = aggregateJudgmentAccuracyByAppraiserAndType(
      appraisalData_BelowThreshold
    );

    expect(resultBelowThreshold.appraisers[0].qualityCheckResult).toBe(
      "不合格"
    );
    expect(resultBelowThreshold.appraisers[0].qualityCheckStatus).toBe("fail");
    expect(resultBelowThreshold.appraisers[0].ocrAccuracyJudgment).toBe(
      "不合格"
    );
    expect(resultBelowThreshold.appraisers[0].errorMessage).toMatch(
      /OCR読取精度/
    );

    // Outcome 3: OCR読取精度が95.1%（境界値以上）の場合は『合格』と判定される
    const appraisalData_AboveThreshold = [
      {
        appraiserId: "APPR001",
        appraiserName: "田中査定員",
        constructionType: "鉄筋コンクリート造",
        amountBand: "1000万円～5000万円",
        judgmentCount: 25,
        accuracyRate: 95.1,
        deviationAverage: 2.5,
        processingTimeMinutes: 18.5,
        ocrAccuracy: 95.1, // OCR読取精度 = 95.1%（境界値以上）
        materialDataQuality: 92.0,
      },
    ];

    const resultAboveThreshold = aggregateJudgmentAccuracyByAppraiserAndType(
      appraisalData_AboveThreshold
    );

    expect(resultAboveThreshold.appraisers[0].qualityCheckResult).toBe(
      "合格"
    );
    expect(resultAboveThreshold.appraisers[0].qualityCheckStatus).toBe("pass");
    expect(resultAboveThreshold.appraisers[0].ocrAccuracyJudgment).toBe(
      "合格"
    );

    // Outcome 4: 各判定結果に対応した適切なステータス表示が正しく表示される
    expect(result.byConstructionType).toBeDefined();
    expect(result.byConstructionType).toHaveLength(2);

    const concreteTypeResult = result.byConstructionType.find(
      (t: any) => t.constructionType === "鉄筋コンクリート造"
    );
    expect(concreteTypeResult).toBeDefined();
    expect(concreteTypeResult.totalAppraisers).toBe(2);
    expect(concreteTypeResult.averageAccuracyRate).toBeCloseTo(95.75, 1);
    expect(concreteTypeResult.averageOcrAccuracy).toBeCloseTo(95.9, 1);

    // Outcome 5: 金額帯別の判定精度指標が正確に集計される
    expect(result.byAmountBand).toBeDefined();
    const amountBand_1000to5000 = result.byAmountBand.find(
      (ab: any) => ab.amountBand === "1000万円～5000万円"
    );
    expect(amountBand_1000to5000).toBeDefined();
    expect(amountBand_1000to5000.totalAppraisers).toBe(2);
    expect(amountBand_1000to5000.averageAccuracyRate).toBeCloseTo(95.75, 1);

    // Outcome 6: 説明資料の品質チェック結果が正確に記録される
    expect(result.appraisers[0]).toHaveProperty("qualityCheckResult");
    expect(result.appraisers[0]).toHaveProperty("qualityCheckStatus");
    expect(result.appraisers[0]).toHaveProperty("ocrAccuracyJudgment");
    expect(result.appraisers[0]).toHaveProperty("recordedAt");

    // Outcome 7: 複数査定員の判定精度が相互比較可能に可視化される
    expect(result.appraisers[0].accuracyRate).toBe(95.0);
    expect(result.appraisers[1].accuracyRate).toBe(96.5);
    expect(result.appraisers[2].accuracyRate).toBe(91.0);

    // 経営ダッシュボード反映用の集計データが生成されること
    expect(result.dashboardSummary).toBeDefined();
    expect(result.dashboardSummary.totalAppraisers).toBe(3);
    expect(result.dashboardSummary.passCount).toBe(2);
    expect(result.dashboardSummary.failCount).toBe(1);
    expect(result.dashboardSummary.passRate).toBeCloseTo(66.67, 1);

    // エラー test: 不正なデータ構造でエラーが発生する
    expect(() =>
      aggregateJudgmentAccuracyByAppraiserAndType([
        {
          appraiserId: "APPR001",
          appraiserName: "田中査定員",
          constructionType: "鉄筋コンクリート造",
          amountBand: "1000万円～5000万円",
          judgmentCount: 25,
          accuracyRate: 101.0, // 不正値（100を超える）
          deviationAverage: 2.5,
          processingTimeMinutes: 18.5,
          ocrAccuracy: 95.0,
          materialDataQuality: 92.0,
        },
      ])
    ).toThrow(/精度/);

    // エラー test: 必須フィールドが欠落している
    expect(() =>
      aggregateJudgmentAccuracyByAppraiserAndType([
        {
          appraiserId: "APPR001",
          appraiserName: "田中査定員",
          constructionType: "鉄筋コンクリート造",
          amountBand: "1000万円～5000万円",
          judgmentCount: 25,
          accuracyRate: 95.0,
          deviationAverage: 2.5,
          processingTimeMinutes: 18.5,
          // ocrAccuracy フィールド欠落
          materialDataQuality: 92.0,
        } as any,
      ])
    ).toThrow(/OCR/);
  });
});