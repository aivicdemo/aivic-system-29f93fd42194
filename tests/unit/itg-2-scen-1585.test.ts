import { determineExpansionExecutability } from '../../src/logic/it-6-2-1-1';

describe('Expansion Plan Execution Feasibility Determination', () => {
  // SCEN-1585: [normal] 展開計画実行可否判定機能 - Go判定時に展開対象部署・展開時期・必要リソースを決定し、No-Go判定時に改善課題と再評価時期を返す
  test('should determine Go execution and return deployment departments, timing, and required resources when quality criteria are met', () => {
    const goScenarioInput = {
      initialOperationMetrics: {
        ocrAccuracy: 0.94,
        aiJudgmentAccuracy: 0.92,
        systemUptime: 0.998,
        processingTimeReductionRate: 0.35,
        qualityUniformityIndex: 0.89,
      },
      targetDepartments: [
        {
          departmentId: 'DEPT-001',
          departmentName: '東京支店',
          estimatedQuotationVolume: 450,
          currentStaffCount: 8,
          learningDataCoverage: 0.92,
          formatCompatibility: 0.95,
        },
        {
          departmentId: 'DEPT-002',
          departmentName: '大阪支店',
          estimatedQuotationVolume: 320,
          currentStaffCount: 6,
          learningDataCoverage: 0.88,
          formatCompatibility: 0.91,
        },
      ],
      qualityCriteria: {
        minimumOcrAccuracy: 0.90,
        minimumAiJudgmentAccuracy: 0.88,
        minimumSystemUptime: 0.995,
        minimumQualityUniformityIndex: 0.85,
        minimumLearningDataCoverage: 0.80,
      },
      resourceConstraints: {
        maxConcurrentDeployments: 2,
        availableTrainingPersonnel: 5,
        maxMonthlyDeploymentCost: 2500000,
      },
      deploymentSchedule: {
        currentMonth: 5,
        planningHorizon: 12,
      },
    };

    const goResult = determineExpansionExecutability(goScenarioInput);

    expect(goResult.executabilityJudgment).toBe('Go');
    expect(goResult.targetDepartments).toEqual(['DEPT-001', 'DEPT-002']);
    expect(goResult.deploymentTiming).toEqual({
      firstWaveMonth: 6,
      secondWaveMonth: 7,
      completionTargetMonth: 8,
    });
    expect(goResult.requiredResources).toEqual({
      totalTrainingPersonnelRequired: 4,
      estimatedTotalCost: 1800000,
      implementationDurationWeeks: 8,
      dataPreparationRequiredSamples: 150,
    });
    expect(goResult.improvementIssues).toBeUndefined();
    expect(goResult.reevaluationTiming).toBeUndefined();
  });

  test('should determine No-Go execution and return improvement issues and reevaluation timing when quality criteria are not met', () => {
    const noGoScenarioInput = {
      initialOperationMetrics: {
        ocrAccuracy: 0.87,
        aiJudgmentAccuracy: 0.84,
        systemUptime: 0.992,
        processingTimeReductionRate: 0.18,
        qualityUniformityIndex: 0.72,
      },
      targetDepartments: [
        {
          departmentId: 'DEPT-003',
          departmentName: '福岡支店',
          estimatedQuotationVolume: 280,
          currentStaffCount: 5,
          learningDataCoverage: 0.65,
          formatCompatibility: 0.72,
        },
      ],
      qualityCriteria: {
        minimumOcrAccuracy: 0.90,
        minimumAiJudgmentAccuracy: 0.88,
        minimumSystemUptime: 0.995,
        minimumQualityUniformityIndex: 0.85,
        minimumLearningDataCoverage: 0.80,
      },
      resourceConstraints: {
        maxConcurrentDeployments: 2,
        availableTrainingPersonnel: 2,
        maxMonthlyDeploymentCost: 1000000,
      },
      deploymentSchedule: {
        currentMonth: 5,
        planningHorizon: 12,
      },
    };

    const noGoResult = determineExpansionExecutability(noGoScenarioInput);

    expect(noGoResult.executabilityJudgment).toBe('No-Go');
    expect(noGoResult.targetDepartments).toBeUndefined();
    expect(noGoResult.deploymentTiming).toBeUndefined();
    expect(noGoResult.requiredResources).toBeUndefined();
    expect(noGoResult.improvementIssues).toEqual([
      {
        issueId: 'OCR_ACCURACY_SHORTFALL',
        issueName: 'OCR読取精度が基準値未達',
        currentValue: 0.87,
        requiredValue: 0.90,
        improvementGapPercentage: 3.4,
        priority: 'High',
        recommendedAction: 'OCR学習データの追加・更新と再学習を実行',
      },
      {
        issueId: 'AI_JUDGMENT_ACCURACY_SHORTFALL',
        issueName: 'AI判定精度が基準値未達',
        currentValue: 0.84,
        requiredValue: 0.88,
        improvementGapPercentage: 4.5,
        priority: 'High',
        recommendedAction: '過去案件データの補正と判定ロジックの再学習を実行',
      },
      {
        issueId: 'QUALITY_UNIFORMITY_SHORTFALL',
        issueName: '品質均一化指標が基準値未達',
        currentValue: 0.72,
        requiredValue: 0.85,
        improvementGapPercentage: 15.3,
        priority: 'High',
        recommendedAction: '査定員間の判定基準統一と教育指導を強化',
      },
      {
        issueId: 'LEARNING_DATA_COVERAGE_SHORTFALL',
        issueName: '学習データカバー率が基準値未達（福岡支店）',
        currentValue: 0.65,
        requiredValue: 0.80,
        improvementGapPercentage: 18.8,
        priority: 'High',
        recommendedAction: '福岡支店対象地域の過去案件データ収集と物価本補整',
      },
      {
        issueId: 'RESOURCE_INSUFFICIENT',
        issueName: '利用可能な訓練人員が不足',
        currentValue: 2,
        requiredValue: 3,
        improvementGapPercentage: 33.3,
        priority: 'Medium',
        recommendedAction: '訓練要員の確保またはスケジュール調整',
      },
    ]);
    expect(noGoResult.reevaluationTiming).toEqual({
      reevaluationTargetMonth: 8,
      daysUntilReevaluation: 90,
      recommendedCheckpoints: [
        {
          checkpointMonth: 6,
          checkpointName: 'OCR精度改善状況の中間確認',
          targetMetric: 'ocrAccuracy',
          targetValue: 0.91,
        },
        {
          checkpointMonth: 7,
          checkpointName: 'AI判定精度と品質均一化の確認',
          targetMetric: 'qualityUniformityIndex',
          targetValue: 0.83,
        },
      ],
    });
  });
});