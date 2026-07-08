import { describe, test, expect } from '@jest/globals';
import { analyzeImprovementThemesByConstructionType } from '../../src/logic/it-6-2-2-2';

describe('改善テーマ・指導対象者の特定 - 工種別乖離パターン分析', () => {
  // SCEN-1076
  test('工種別の乖離パターンから改善テーマが正しく抽出される', () => {
    const input = {
      constructionTypes: [
        {
          typeId: 'CT-001',
          typeName: '外壁工事',
          deviationPatterns: [
            {
              patternId: 'DP-001',
              category: 'OVERPRICE',
              deviationRate: 15.5,
              deviationAmount: 450000,
              referenceDataCount: 12,
              affectedAssessors: ['ASSESSOR-001', 'ASSESSOR-002', 'ASSESSOR-003'],
            },
            {
              patternId: 'DP-002',
              category: 'UNDERPRICE',
              deviationRate: 8.2,
              deviationAmount: 180000,
              referenceDataCount: 8,
              affectedAssessors: ['ASSESSOR-004', 'ASSESSOR-005'],
            },
          ],
        },
        {
          typeId: 'CT-002',
          typeName: '屋根工事',
          deviationPatterns: [
            {
              patternId: 'DP-003',
              category: 'OVERPRICE',
              deviationRate: 22.3,
              deviationAmount: 680000,
              referenceDataCount: 15,
              affectedAssessors: ['ASSESSOR-001', 'ASSESSOR-006', 'ASSESSOR-007'],
            },
          ],
        },
        {
          typeId: 'CT-003',
          typeName: '内装工事',
          deviationPatterns: [
            {
              patternId: 'DP-004',
              category: 'OVERPRICE',
              deviationRate: 12.0,
              deviationAmount: 290000,
              referenceDataCount: 20,
              affectedAssessors: ['ASSESSOR-008', 'ASSESSOR-009'],
            },
            {
              patternId: 'DP-005',
              category: 'UNDERPRICE',
              deviationRate: 5.1,
              deviationAmount: 95000,
              referenceDataCount: 10,
              affectedAssessors: ['ASSESSOR-010'],
            },
            {
              patternId: 'DP-006',
              category: 'STANDARD',
              deviationRate: 2.8,
              deviationAmount: 45000,
              referenceDataCount: 18,
              affectedAssessors: ['ASSESSOR-011', 'ASSESSOR-012'],
            },
          ],
        },
      ],
      toleranceThreshold: 10.0,
      analysisDate: '2024-03-31T23:59:59Z',
    };

    const result = analyzeImprovementThemesByConstructionType(input);

    expect(result).toEqual({
      analysisExecutionTimestamp: '2024-03-31T23:59:59Z',
      analysisStatus: 'COMPLETED',
      improvementThemesByConstructionType: [
        {
          constructionTypeId: 'CT-001',
          constructionTypeName: '外壁工事',
          extractedThemes: [
            {
              themeId: 'THEME-001-OVERPRICE',
              themeName: '見積金額の過度な高値設定の是正',
              severity: 'HIGH',
              deviationPatternSource: 'DP-001',
              baselineDeviationRate: 15.5,
              affectedAssessorCount: 3,
              affectedAssessors: ['ASSESSOR-001', 'ASSESSOR-002', 'ASSESSOR-003'],
              trainingObjectives: [
                '市場相場の把握精度向上',
                '補正係数の適切な適用方法',
                '過去案件データ活用スキル',
              ],
              estimatedImprovementRate: 12.4,
              priorityScore: 82,
            },
            {
              themeId: 'THEME-001-UNDERPRICE',
              themeName: '見積金額の過度な低値設定の是正',
              severity: 'MEDIUM',
              deviationPatternSource: 'DP-002',
              baselineDeviationRate: 8.2,
              affectedAssessorCount: 2,
              affectedAssessors: ['ASSESSOR-004', 'ASSESSOR-005'],
              trainingObjectives: [
                '原価構造の理解深化',
                'リスク補正の考慮方法',
              ],
              estimatedImprovementRate: 6.5,
              priorityScore: 56,
            },
          ],
          constructionTypeImprovementPriority: 1,
        },
        {
          constructionTypeId: 'CT-002',
          constructionTypeName: '屋根工事',
          extractedThemes: [
            {
              themeId: 'THEME-002-OVERPRICE',
              themeName: '見積金額の過度な高値設定の是正',
              severity: 'CRITICAL',
              deviationPatternSource: 'DP-003',
              baselineDeviationRate: 22.3,
              affectedAssessorCount: 3,
              affectedAssessors: ['ASSESSOR-001', 'ASSESSOR-006', 'ASSESSOR-007'],
              trainingObjectives: [
                '高度な相場分析スキル',
                '業界別単価の把握',
                '地域別補正係数の活用',
              ],
              estimatedImprovementRate: 17.8,
              priorityScore: 95,
            },
          ],
          constructionTypeImprovementPriority: 0,
        },
        {
          constructionTypeId: 'CT-003',
          constructionTypeName: '内装工事',
          extractedThemes: [
            {
              themeId: 'THEME-003-OVERPRICE',
              themeName: '見積金額の過度な高値設定の是正',
              severity: 'MEDIUM',
              deviationPatternSource: 'DP-004',
              baselineDeviationRate: 12.0,
              affectedAssessorCount: 2,
              affectedAssessors: ['ASSESSOR-008', 'ASSESSOR-009'],
              trainingObjectives: [
                '内装工事の相場動向把握',
                '素材別単価の適用',
              ],
              estimatedImprovementRate: 9.6,
              priorityScore: 68,
            },
          ],
          constructionTypeImprovementPriority: 2,
        },
      ],
      mappingValidationStatus: 'VALID',
      mappingValidationDetails: {
        totalConstructionTypesAnalyzed: 3,
        themesExtractedCount: 4,
        assessorThemeMappingCount: 7,
        unmappedAssessorCount: 0,
        consistencyCheckPassed: true,
      },
      summaryMetrics: {
        highestPrioritySeverity: 'CRITICAL',
        averagePriorityScore: 75.25,
        totalAffectedAssessors: 7,
        overallImprovementPotential: 46.3,
      },
    });

    expect(result.analysisStatus).toBe('COMPLETED');
    expect(result.improvementThemesByConstructionType.length).toBe(3);
    expect(result.improvementThemesByConstructionType[0].constructionTypeName).toBe(
      '外壁工事'
    );
    expect(result.improvementThemesByConstructionType[0].extractedThemes.length).toBe(2);
    expect(
      result.improvementThemesByConstructionType[0].extractedThemes[0].severity
    ).toBe('HIGH');
    expect(result.improvementThemesByConstructionType[1].constructionTypeName).toBe(
      '屋根工事'
    );
    expect(
      result.improvementThemesByConstructionType[1].extractedThemes[0].baselineDeviationRate
    ).toBe(22.3);
    expect(result.improvementThemesByConstructionType[1].constructionTypeImprovementPriority).toBe(
      0
    );
    expect(result.improvementThemesByConstructionType[2].constructionTypeName).toBe(
      '内装工事'
    );
    expect(result.improvementThemesByConstructionType[2].extractedThemes.length).toBe(1);
    expect(result.mappingValidationStatus).toBe('VALID');
    expect(result.mappingValidationDetails.totalConstructionTypesAnalyzed).toBe(3);
    expect(result.mappingValidationDetails.themesExtractedCount).toBe(4);
    expect(result.mappingValidationDetails.consistencyCheckPassed).toBe(true);
    expect(result.summaryMetrics.highestPrioritySeverity).toBe('CRITICAL');
    expect(result.summaryMetrics.averagePriorityScore).toBe(75.25);
    expect(result.summaryMetrics.totalAffectedAssessors).toBe(7);
    expect(result.summaryMetrics.overallImprovementPotential).toBe(46.3);
  });
});