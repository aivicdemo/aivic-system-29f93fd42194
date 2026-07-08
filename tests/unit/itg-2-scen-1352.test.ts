import { quantifyMinimumLearningDataRequirements } from "../../src/logic/it-1-br-2-2-2-1";

describe("学習データセット最小要件定量化 - 査定員判定結果の月次集計分析", () => {
  // SCEN-1352: [normal] 学習データセット最小要件定量化 - 他部署フォーマットに必要な学習データセット最小要件が件数・期間・地域カバー率で定量化される
  test("他部署フォーマットに対応する学習データセット最小要件が件数・期間・地域カバー率の3観点で定量化され、システムに正常に保存されること", () => {
    // ============ 初期状態: 他部署フォーマット選択前のベースラインデータ ============
    // 査定部署（初期30名運用）の実績データから推定
    const baselineDataCount = 450; // 3ヶ月間の累積案件件数: 30名 × 平均5件/日 × 30日 = 4500件(注:実績)
    const baselinePeriodMonths = 3;
    const baselineCoverageRegionRatio = 0.95; // 95%カバー率（主要地域網羅）

    // ============ 入力1: 他部署A（営業所20箇所、見積フォーマット標準化率60%）を選択 ============
    const otherDepartmentFormatA = {
      departmentId: "dept_other_A",
      departmentName: "営業部東日本",
      estimateFormatStandardizationRate: 0.60, // 標準化率60%
      estimatedMonthlyVolume: 800, // 月間見積件数予測
      targetRegionCount: 12, // 対象地域数
      ocrReadabilityRisk: "medium", // OCR読取難度: 中程度
    };

    const resultA = quantifyMinimumLearningDataRequirements(
      otherDepartmentFormatA
    );

    // ============ 期待値1: 他部署A向け定量化値の検証 ============
    // 計算根拠:
    // - 標準化率60%の場合、査定部署実績の1.2倍必要(非標準フォーマット対応による補正)
    // - 必要件数 = 450 × 1.2 = 540件
    // - 期間 = ceil(540 / 800) = 1ヶ月 (月間800件予測)
    // - 地域カバー率 = 12地域 / 12地域 = 100% (全地域カバー)
    expect(resultA).toEqual({
      departmentId: "dept_other_A",
      minimumDataCount: 540,
      minimumPeriodMonths: 1,
      minimumRegionCoverageRatio: 1.0,
      ocrReadabilityAdjustmentFactor: 1.2,
      isValid: true,
      validationMessage: "",
      lastUpdatedAt: expect.any(String),
    });

    // ============ 入力2: 他部署B（営業所5箇所、見積フォーマット標準化率85%）に切り替え ============
    const otherDepartmentFormatB = {
      departmentId: "dept_other_B",
      departmentName: "営業部西日本",
      estimateFormatStandardizationRate: 0.85, // 標準化率85%
      estimatedMonthlyVolume: 600, // 月間見積件数予測
      targetRegionCount: 8, // 対象地域数
      ocrReadabilityRisk: "low", // OCR読取難度: 低い
    };

    const resultB = quantifyMinimumLearningDataRequirements(
      otherDepartmentFormatB
    );

    // ============ 期待値2: 他部署B向け定量化値の検証 ============
    // 計算根拠:
    // - 標準化率85%の場合、査定部署実績の1.08倍必要(軽微な非標準対応)
    // - 必要件数 = 450 × 1.08 = 486件 → 切り上げ490件(端数処理)
    // - 期間 = ceil(490 / 600) = 1ヶ月 (月間600件予測)
    // - 地域カバー率 = 8地域 / 8地域 = 100% (全地域カバー)
    expect(resultB).toEqual({
      departmentId: "dept_other_B",
      minimumDataCount: 490,
      minimumPeriodMonths: 1,
      minimumRegionCoverageRatio: 1.0,
      ocrReadabilityAdjustmentFactor: 1.08,
      isValid: true,
      validationMessage: "",
      lastUpdatedAt: expect.any(String),
    });

    // ============ 検証1: 標準化率による調整係数の比較 ============
    // 他部署Aの調整係数(1.2) > 他부서Bの調整係数(1.08) であること
    expect(resultA.ocrReadabilityAdjustmentFactor).toBeGreaterThan(
      resultB.ocrReadabilityAdjustmentFactor
    );

    // ============ 検証2: 必要件数が妥当な範囲内であること ============
    // 最小: 査定部署実績の1.05倍以上 (軽微な差分)
    // 最大: 査定部署実績の1.5倍以下 (過度な要求排除)
    const minAcceptableCount = baselineDataCount * 1.05; // 472.5 → 473
    const maxAcceptableCount = baselineDataCount * 1.5; // 675
    expect(resultA.minimumDataCount).toBeGreaterThanOrEqual(
      Math.ceil(minAcceptableCount)
    );
    expect(resultA.minimumDataCount).toBeLessThanOrEqual(maxAcceptableCount);
    expect(resultB.minimumDataCount).toBeGreaterThanOrEqual(
      Math.ceil(minAcceptableCount)
    );
    expect(resultB.minimumDataCount).toBeLessThanOrEqual(maxAcceptableCount);

    // ============ 検証3: 期間要件が妥当であること ============
    // 期間は1～3ヶ月範囲（過度な長期化を避ける）
    expect(resultA.minimumPeriodMonths).toBeGreaterThanOrEqual(1);
    expect(resultA.minimumPeriodMonths).toBeLessThanOrEqual(3);
    expect(resultB.minimumPeriodMonths).toBeGreaterThanOrEqual(1);
    expect(resultB.minimumPeriodMonths).toBeLessThanOrEqual(3);

    // ============ 検証4: 地域カバー率が100%に統一されていること ============
    // 学習データセットは全対象地域をカバーしなければならない
    expect(resultA.minimumRegionCoverageRatio).toBe(1.0);
    expect(resultB.minimumRegionCoverageRatio).toBe(1.0);

    // ============ 検証5: validation.isValid フラグが正常であること ============
    expect(resultA.isValid).toBe(true);
    expect(resultB.isValid).toBe(true);

    // ============ 検証6: lastUpdatedAt が ISO 8601 形式の日時であること ============
    const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/;
    expect(resultA.lastUpdatedAt).toMatch(isoRegex);
    expect(resultB.lastUpdatedAt).toMatch(isoRegex);

    // ============ 入力3: 高リスク他部署C（見積フォーマット標準化率30%、高リスク） ============
    const otherDepartmentFormatC = {
      departmentId: "dept_other_C",
      departmentName: "営業部海外対応",
      estimateFormatStandardizationRate: 0.30, // 標準化率30% (低)
      estimatedMonthlyVolume: 400, // 月間見積件数予測（少ない）
      targetRegionCount: 20, // 対象地域数（多い）
      ocrReadabilityRisk: "high", // OCR読取難度: 高い
    };

    const resultC = quantifyMinimumLearningDataRequirements(
      otherDepartmentFormatC
    );

    // ============ 期待値3: 他部署C向け定量化値の検証（高リスク） ============
    // 計算根拠:
    // - 標準化率30%の場合、査定部署実績の1.35倍必要(大幅な非標準対応)
    // - OCR読取難度"high"による追加調整: 1.35 × 1.1 = 1.485 → 切り上げ1.5
    // - 必要件数 = 450 × 1.5 = 675件
    // - 期間 = ceil(675 / 400) = 2ヶ月 (月間400件予測で割ると割り切れず切り上げ)
    // - 地域カバー率 = 20地域 / 20地域 = 100% (全地域カバー)
    expect(resultC).toEqual({
      departmentId: "dept_other_C",
      minimumDataCount: 675,
      minimumPeriodMonths: 2,
      minimumRegionCoverageRatio: 1.0,
      ocrReadabilityAdjustmentFactor: 1.5,
      isValid: true,
      validationMessage: "",
      lastUpdatedAt: expect.any(String),
    });

    // ============ 検証7: 調整係数の段階的増加 ============
    // 標準化率が低いほど調整係数が大きくなる: C > A > B
    expect(resultC.ocrReadabilityAdjustmentFactor).toBeGreaterThan(
      resultA.ocrReadabilityAdjustmentFactor
    );
    expect(resultA.ocrReadabilityAdjustmentFactor).toBeGreaterThan(
      resultB.ocrReadabilityAdjustmentFactor
    );

    // ============ 検証8: 高リスク部署の必要件数が最多 ============
    expect(resultC.minimumDataCount).toBeGreaterThan(resultA.minimumDataCount);
    expect(resultC.minimumDataCount).toBeGreaterThan(resultB.minimumDataCount);

    // ============ 検証9: 定量化値間の相対関係が保持されていること ============
    // 必要件数 C > A > B
    expect(resultC.minimumDataCount).toBeGreaterThan(resultA.minimumDataCount);
    expect(resultA.minimumDataCount).toBeGreaterThan(resultB.minimumDataCount);

    // ============ 検証10: 地域数が多い場合でも覆率は100%に統一 ============
    expect(resultC.minimumRegionCoverageRatio).toBe(1.0);
  });
});