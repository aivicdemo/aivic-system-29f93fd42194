import { calculateGroupExpansionCorrectionCoefficient } from '../../src/logic/it-6-2-1-1';

describe('査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化', () => {
  // SCEN-1311: [normal] スケーリング係数と補正係数の自動計算 - グループ企業横展開時の精度低下補正係数が正規の範囲内（0.85～0.95）で計算される
  test('should calculate correction coefficient within range 0.85-0.95 for multiple group company combinations', () => {
    const testPatterns = [
      {
        groupCompanies: [
          {
            companyId: 'GC001',
            companyName: '子会社A',
            pastAssessmentDataCount: 150,
            assessmentAccuracyRate: 0.92,
            ocrAccuracyRate: 0.88,
          },
          {
            companyId: 'GC002',
            companyName: '子会社B',
            pastAssessmentDataCount: 120,
            assessmentAccuracyRate: 0.89,
            ocrAccuracyRate: 0.85,
          },
          {
            companyId: 'GC003',
            companyName: '子会社C',
            pastAssessmentDataCount: 100,
            assessmentAccuracyRate: 0.91,
            ocrAccuracyRate: 0.87,
          },
        ],
      },
      {
        groupCompanies: [
          {
            companyId: 'GC004',
            companyName: '関連企業D',
            pastAssessmentDataCount: 200,
            assessmentAccuracyRate: 0.94,
            ocrAccuracyRate: 0.90,
          },
          {
            companyId: 'GC005',
            companyName: '関連企業E',
            pastAssessmentDataCount: 110,
            assessmentAccuracyRate: 0.87,
            ocrAccuracyRate: 0.83,
          },
          {
            companyId: 'GC006',
            companyName: '関連企業F',
            pastAssessmentDataCount: 105,
            assessmentAccuracyRate: 0.90,
            ocrAccuracyRate: 0.86,
          },
        ],
      },
      {
        groupCompanies: [
          {
            companyId: 'GC007',
            companyName: '提携企業G',
            pastAssessmentDataCount: 180,
            assessmentAccuracyRate: 0.93,
            ocrAccuracyRate: 0.89,
          },
          {
            companyId: 'GC008',
            companyName: '提携企業H',
            pastAssessmentDataCount: 125,
            assessmentAccuracyRate: 0.88,
            ocrAccuracyRate: 0.84,
          },
          {
            companyId: 'GC009',
            companyName: '提携企業I',
            pastAssessmentDataCount: 115,
            assessmentAccuracyRate: 0.91,
            ocrAccuracyRate: 0.88,
          },
        ],
      },
      {
        groupCompanies: [
          {
            companyId: 'GC010',
            companyName: 'グループ企業J',
            pastAssessmentDataCount: 160,
            assessmentAccuracyRate: 0.92,
            ocrAccuracyRate: 0.87,
          },
          {
            companyId: 'GC011',
            companyName: 'グループ企業K',
            pastAssessmentDataCount: 130,
            assessmentAccuracyRate: 0.89,
            ocrAccuracyRate: 0.86,
          },
          {
            companyId: 'GC012',
            companyName: 'グループ企業L',
            pastAssessmentDataCount: 140,
            assessmentAccuracyRate: 0.90,
            ocrAccuracyRate: 0.85,
          },
        ],
      },
      {
        groupCompanies: [
          {
            companyId: 'GC013',
            companyName: '展開対象企業M',
            pastAssessmentDataCount: 170,
            assessmentAccuracyRate: 0.93,
            ocrAccuracyRate: 0.91,
          },
          {
            companyId: 'GC014',
            companyName: '展開対象企業N',
            pastAssessmentDataCount: 135,
            assessmentAccuracyRate: 0.88,
            ocrAccuracyRate: 0.82,
          },
          {
            companyId: 'GC015',
            companyName: '展開対象企業O',
            pastAssessmentDataCount: 120,
            assessmentAccuracyRate: 0.92,
            ocrAccuracyRate: 0.89,
          },
        ],
      },
    ];

    const calculationLogs: Array<{
      patternIndex: number;
      correctionCoefficient: number;
      baselineAccuracyRate: number;
      targetAccuracyRate: number;
      rationale: string;
    }> = [];

    testPatterns.forEach((pattern, patternIndex) => {
      const result = calculateGroupExpansionCorrectionCoefficient({
        groupCompanies: pattern.groupCompanies,
      });

      expect(result.correctionCoefficient).toBeGreaterThanOrEqual(0.85);
      expect(result.correctionCoefficient).toBeLessThanOrEqual(0.95);

      calculationLogs.push({
        patternIndex,
        correctionCoefficient: result.correctionCoefficient,
        baselineAccuracyRate: result.baselineAccuracyRate,
        targetAccuracyRate: result.targetAccuracyRate,
        rationale: result.rationale,
      });
    });

    expect(calculationLogs).toHaveLength(5);

    calculationLogs.forEach((log) => {
      expect(log.correctionCoefficient).toBeGreaterThanOrEqual(0.85);
      expect(log.correctionCoefficient).toBeLessThanOrEqual(0.95);
      expect(log.rationale).toBeDefined();
      expect(log.rationale.length).toBeGreaterThan(0);
      expect(log.baselineAccuracyRate).toBeGreaterThan(0);
      expect(log.baselineAccuracyRate).toBeLessThanOrEqual(1);
      expect(log.targetAccuracyRate).toBeGreaterThan(0);
      expect(log.targetAccuracyRate).toBeLessThanOrEqual(1);
    });

    const allCoefficientsInRange = calculationLogs.every(
      (log) => log.correctionCoefficient >= 0.85 && log.correctionCoefficient <= 0.95
    );
    expect(allCoefficientsInRange).toBe(true);
  });
});