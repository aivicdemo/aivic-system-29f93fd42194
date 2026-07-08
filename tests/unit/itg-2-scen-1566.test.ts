import { calculateDeploymentPriority } from '../../src/logic/it-6-2-1-1';

describe('段階的展開スケジュール生成 - 初期30名実績指標からの部署優先順位算出', () => {
  // SCEN-1566
  test('初期30名の実績指標から展開対象部署の優先順位が定量的に算出される', () => {
    // === 初期30名の実績指標（基準値）===
    const initialPerformanceData = {
      assessmentTimeReductionRate: 0.35,  // 査定時間短縮率: 35%
      qualityUniformityIndex: 0.82,       // 品質均一化指標: 0.82 (0-1 scale)
      systemOperationRate: 0.96,          // システム稼働率: 96%
      ocrAccuracy: 0.89,                  // OCR精度: 89%
      aiJudgmentAccuracy: 0.87            // AI判定精度: 87%
    };

    // === 展開対象部署の候補データ ===
    const deploymentCandidates = [
      {
        departmentId: 'DEPT_A',
        departmentName: '営業企画部',
        currentWorkloadPercentage: 0.65,   // 現在の業務負荷: 65%
        estimatedScaleMultiplier: 1.5,     // スケール係数: 1.5倍
        learningDataAvailability: 0.75,    // 学習データ整備状況: 75%
        regionCoverageRate: 0.80           // 地域カバー率: 80%
      },
      {
        departmentId: 'DEPT_B',
        departmentName: '技術部',
        currentWorkloadPercentage: 0.45,   // 現在の業務負荷: 45%
        estimatedScaleMultiplier: 2.0,     // スケール係数: 2.0倍
        learningDataAvailability: 0.60,    // 学習データ整備状況: 60%
        regionCoverageRate: 0.70           // 地域カバー率: 70%
      },
      {
        departmentId: 'DEPT_C',
        departmentName: '経営管理部',
        currentWorkloadPercentage: 0.50,   // 現在の業務負荷: 50%
        estimatedScaleMultiplier: 1.2,     // スケール係数: 1.2倍
        learningDataAvailability: 0.85,    // 学習データ整備状況: 85%
        regionCoverageRate: 0.90           // 地域カバー率: 90%
      }
    ];

    // === 段階的展開パラメータ ===
    const deploymentParams = {
      evaluationWeights: {
        learningDataAvailability: 0.35,    // 学習データ整備: 35%
        regionCoverageRate: 0.25,          // 地域カバー率: 25%
        scaleMultiplier: 0.25,             // スケール係数: 25%
        workloadBalance: 0.15               // 業務負荷均衡: 15%
      },
      precisionAdjustmentFactors: {
        ocrAccuracy: 0.92,                 // OCR精度による調整係数: 0.92
        aiJudgmentAccuracy: 0.88           // AI判定精度による調整係数: 0.88
      },
      minDataAvailabilityThreshold: 0.50   // 最小学習データ整備閾値: 50%
    };

    // === 関数実行 ===
    const result = calculateDeploymentPriority(
      initialPerformanceData,
      deploymentCandidates,
      deploymentParams
    );

    // === 検証: 基本構造 ===
    expect(result).toHaveProperty('priorityRankings');
    expect(result).toHaveProperty('deploymentSchedule');
    expect(result).toHaveProperty('riskAssessment');

    // === 検証: 優先順位ランキングの構造 ===
    expect(Array.isArray(result.priorityRankings)).toBe(true);
    expect(result.priorityRankings.length).toBe(3);

    // === 検証: 各部署の優先順位スコア計算の妥当性 ===
    // DEPT_C: 学習データ最充実（85%）且つ地域カバー率最高（90%）のため最高優先度
    const deptCRanking = result.priorityRankings.find(
      (r: any) => r.departmentId === 'DEPT_C'
    );
    expect(deptCRanking).toBeDefined();
    expect(deptCRanking.priorityScore).toBeGreaterThanOrEqual(0);
    expect(deptCRanking.priorityScore).toBeLessThanOrEqual(100);
    expect(deptCRanking.rank).toBe(1);

    // === 検証: スコア詳細の内訳 ===
    expect(deptCRanking).toHaveProperty('scoreBreakdown');
    expect(deptCRanking.scoreBreakdown).toHaveProperty(
      'learningDataScore'
    );
    expect(deptCRanking.scoreBreakdown).toHaveProperty('regionCoverageScore');
    expect(deptCRanking.scoreBreakdown).toHaveProperty('scaleMultiplierScore');
    expect(deptCRanking.scoreBreakdown).toHaveProperty('workloadBalanceScore');

    // === 検証: DEPT_C の学習データスコア計算 (85% / 最大値) ===
    // 学習データ整備: 85% ÷ 100% = 0.85 (正規化)
    // スコア寄与度: 0.85 × 35 (重み) = 29.75 点
    expect(deptCRanking.scoreBreakdown.learningDataScore).toBe(29.75);

    // === 検証: DEPT_C の地域カバー率スコア計算 (90%) ===
    // 地域カバー率: 90% ÷ 100% = 0.90 (正規化)
    // スコア寄与度: 0.90 × 25 (重み) = 22.5 点
    expect(deptCRanking.scoreBreakdown.regionCoverageScore).toBe(22.5);

    // === 検証: DEPT_C のスケール係数スコア計算 (1.2倍) ===
    // スケール係数の正規化: 1.2 ÷ 2.0 (最大) = 0.60
    // スコア寄与度: 0.60 × 25 (重み) = 15.0 点
    expect(deptCRanking.scoreBreakdown.scaleMultiplierScore).toBe(15.0);

    // === 検証: DEPT_C の業務負荷均衡スコア計算 (50%) ===
    // 業務負荷が50%時の均衡度スコア: 1 - |0.50 - 0.50| = 1.0
    // スコア寄与度: 1.0 × 15 (重み) = 15.0 点
    expect(deptCRanking.scoreBreakdown.workloadBalanceScore).toBe(15.0);

    // === 検証: DEPT_C の総スコア ===
    // 合計: 29.75 + 22.5 + 15.0 + 15.0 = 82.25
    // 精度調整係数: (0.92 × 0.88) = 0.8096
    // 最終スコア: 82.25 × 0.8096 ≈ 66.60
    expect(deptCRanking.priorityScore).toBeCloseTo(66.60, 1);

    // === 検証: DEPT_A の優先順位 ===
    const deptARanking = result.priorityRankings.find(
      (r: any) => r.departmentId === 'DEPT_A'
    );
    expect(deptARanking).toBeDefined();
    expect(deptARanking.rank).toBe(2);
    // DEPT_A: 学習データ 75%, 地域カバー 80%
    // スコア計算: (0.75×35) + (0.80×25) + (1.5÷2.0×25) + (1.0×15) 
    //          = 26.25 + 20.0 + 18.75 + 15.0 = 80.0
    // 精度調整後: 80.0 × 0.8096 ≈ 64.77
    expect(deptARanking.priorityScore).toBeCloseTo(64.77, 1);

    // === 検証: DEPT_B の優先順位 ===
    const deptBRanking = result.priorityRankings.find(
      (r: any) => r.departmentId === 'DEPT_B'
    );
    expect(deptBRanking).toBeDefined();
    expect(deptBRanking.rank).toBe(3);
    // DEPT_B: 学習データ 60% < 閾値 50% は OK, 地域カバー 70%, スケール 2.0 (最大)
    // スコア計算: (0.60×35) + (0.70×25) + (2.0÷2.0×25) + (1.0×15)
    //          = 21.0 + 17.5 + 25.0 + 15.0 = 78.5
    // 精度調整後: 78.5 × 0.8096 ≈ 63.55
    expect(deptBRanking.priorityScore).toBeCloseTo(63.55, 1);

    // === 検証: 優先順位が降順にソートされている ===
    const scores = result.priorityRankings.map((r: any) => r.priorityScore);
    for (let i = 0; i < scores.length - 1; i++) {
      expect(scores[i]).toBeGreaterThanOrEqual(scores[i + 1]);
    }

    // === 検証: 展開スケジュールの構造 ===
    expect(result.deploymentSchedule).toHaveProperty('phase1');
    expect(result.deploymentSchedule).toHaveProperty('phase2');
    expect(result.deploymentSchedule).toHaveProperty('phase3');
    expect(result.deploymentSchedule).toHaveProperty('totalDurationDays');

    // === 検証: Phase 1 は最優先部署 (DEPT_C) ===
    const phase1 = result.deploymentSchedule.phase1;
    expect(phase1.departmentId).toBe('DEPT_C');
    expect(phase1.startDate).toBe('2024-02-01');
    expect(phase1.durationWeeks).toBe(12);
    expect(phase1.expectedOutcomes).toHaveProperty('targetOcrAccuracy');
    expect(phase1.expectedOutcomes).toHaveProperty('targetJudgmentAccuracy');

    // === 検証: Phase 1 の期待精度 ===
    // 初期精度から保守的に計算: OCR 89% → Phase1では 85% を期待 (4% 低下を想定)
    expect(phase1.expectedOutcomes.targetOcrAccuracy).toBe(0.85);
    // AI判定: 87% → 82% (5% 低下を想定)
    expect(phase1.expectedOutcomes.targetJudgmentAccuracy).toBe(0.82);

    // === 検証: Phase 2 は次点部署 (DEPT_A) ===
    const phase2 = result.deploymentSchedule.phase2;
    expect(phase2.departmentId).toBe('DEPT_A');
    expect(phase2.startDate).toBe('2024-05-01');
    expect(phase2.durationWeeks).toBe(12);

    // === 検証: Phase 3 は第3位部署 (DEPT_B) ===
    const phase3 = result.deploymentSchedule.phase3;
    expect(phase3.departmentId).toBe('DEPT_B');
    expect(phase3.startDate).toBe('2024-08-01');
    expect(phase3.durationWeeks).toBe(12);

    // === 検証: 総展開期間 ===
    // Phase1: 12週 + Phase2: 12週 + Phase3: 12週 + バッファ 4週
    // = (12+12+12+4) × 7 = 280日
    expect(result.deploymentSchedule.totalDurationDays).toBe(280);

    // === 検証: リスク評価の構造 ===
    expect(result.riskAssessment).toHaveProperty('overallRiskLevel');
    expect(result.riskAssessment).toHaveProperty('riskFactors');
    expect(result.riskAssessment).toHaveProperty('mitigationStrategies');

    // === 検証: リスク総合評価 ===
    // 学習データ可用性の最小値が 60% と良好、精度も高いため Low
    expect(result.riskAssessment.overallRiskLevel).toBe('Low');

    // === 検証: リスク要因の詳細 ===
    expect(Array.isArray(result.riskAssessment.riskFactors)).toBe(true);
    expect(result.riskAssessment.riskFactors.length).toBeGreaterThan(0);

    // === 検証: リスク要因に DEPT_B のデータ整備リスクが含まれている ===
    const dataAvailabilityRisk = result.riskAssessment.riskFactors.find(
      (f: any) => f.category === 'LearningDataAvailability'
    );
    expect(dataAvailabilityRisk).toBeDefined();
    expect(dataAvailabilityRisk.affectedDepartments).toContain('DEPT_B');
    expect(dataAvailabilityRisk.severity).toBe('Medium');

    // === 検証: 軽減戦略の構造 ===
    expect(Array.isArray(result.riskAssessment.mitigationStrategies)).toBe(
      true
    );
    expect(result.riskAssessment.mitigationStrategies.length).toBeGreaterThan(0);

    // === 検証: 各戦略の詳細 ===
    result.riskAssessment.mitigationStrategies.forEach((strategy: any) => {
      expect(strategy).toHaveProperty('riskCategory');
      expect(strategy).toHaveProperty('action');
      expect(strategy).toHaveProperty('owner');
      expect(strategy).toHaveProperty('timelineWeeks');
      expect(strategy.timelineWeeks).toBeGreaterThan(0);
    });

    // === 検証: 全体の出力形式の整合性 ===
    expect(result.priorityRankings.length).toBe(3);
    for (const ranking of result.priorityRankings) {
      expect(ranking).toHaveProperty('departmentId');
      expect(ranking).toHaveProperty('departmentName');
      expect(ranking).toHaveProperty('rank');
      expect(ranking).toHaveProperty('priorityScore');
      expect(ranking).toHaveProperty('scoreBreakdown');
      expect(ranking.rank).toBeGreaterThanOrEqual(1);
      expect(ranking.rank).toBeLessThanOrEqual(3);
      expect(ranking.priorityScore).toBeGreaterThan(0);
      expect(ranking.priorityScore).toBeLessThanOrEqual(100);
    }

    // === 検証: スケジュール統一性 ===
    expect(phase1.durationWeeks).toBe(phase2.durationWeeks);
    expect(phase2.durationWeeks).toBe(phase3.durationWeeks);

    // === 検証: 展開スケジュール内での日付が順序通り ===
    const phase1StartMs = new Date(phase1.startDate).getTime();
    const phase2StartMs = new Date(phase2.startDate).getTime();
    const phase3StartMs = new Date(phase3.startDate).getTime();
    expect(phase1StartMs).toBeLessThan(phase2StartMs);
    expect(phase2StartMs).toBeLessThan(phase3StartMs);

    // === 検証: Phase 間隔が 3 ヶ月 (13週) ===
    const phase1To2Weeks = (phase2StartMs - phase1StartMs) / (1000 * 60 * 60 * 24 * 7);
    const phase2To3Weeks = (phase3StartMs - phase2StartMs) / (1000 * 60 * 60 * 24 * 7);
    expect(phase1To2Weeks).toBeCloseTo(13, 0);
    expect(phase2To3Weeks).toBeCloseTo(13, 0);
  });
});