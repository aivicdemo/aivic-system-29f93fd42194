import { describe, test, expect } from '@jest/globals';
import { standardizeDataGranularity } from '../../src/logic/it-6-3-1';

describe('査定判定ロジックの適用履歴と根拠の記録・検索機能', () => {
  // SCEN-903: [error] 学習データ標準化・形式統一 - データ粒度が不正な値の場合にエラーを返す
  test('should return error when data granularity is invalid', () => {
    const invalidGranularities = [null, undefined, '', -1, 0, NaN, 'invalid_granularity'];

    invalidGranularities.forEach((granularity) => {
      expect(() => {
        standardizeDataGranularity({
          granularity: granularity as any,
          learningData: [
            {
              caseId: 'case_001',
              amount: 1500000,
              category: 'concrete_work',
              region: 'tokyo',
              date: '2024-01-15',
            },
          ],
        });
      }).toThrow(/データ粒度/);
    });
  });

  test('should process valid granularity successfully and return standardized data', () => {
    const validInput = {
      granularity: 'item_level' as const,
      learningData: [
        {
          caseId: 'case_001',
          amount: 1500000,
          category: 'concrete_work',
          region: 'tokyo',
          date: '2024-01-15',
        },
        {
          caseId: 'case_002',
          amount: 2000000,
          category: 'steel_frame',
          region: 'osaka',
          date: '2024-02-20',
        },
      ],
    };

    const result = standardizeDataGranularity(validInput);

    expect(result).toEqual({
      status: 'success',
      standardizedCount: 2,
      granularity: 'item_level',
      processedAt: expect.any(String),
      data: expect.arrayContaining([
        expect.objectContaining({
          caseId: 'case_001',
          amount: 1500000,
          category: 'concrete_work',
          region: 'tokyo',
          date: '2024-01-15',
          normalizedAmount: 1500000,
        }),
        expect.objectContaining({
          caseId: 'case_002',
          amount: 2000000,
          category: 'steel_frame',
          region: 'osaka',
          date: '2024-02-20',
          normalizedAmount: 2000000,
        }),
      ]),
    });
  });

  test('should handle boundary case with granularity as zero', () => {
    expect(() => {
      standardizeDataGranularity({
        granularity: 0 as any,
        learningData: [
          {
            caseId: 'case_001',
            amount: 1500000,
            category: 'concrete_work',
            region: 'tokyo',
            date: '2024-01-15',
          },
        ],
      });
    }).toThrow(/データ粒度/);
  });

  test('should validate and reject negative granularity values', () => {
    expect(() => {
      standardizeDataGranularity({
        granularity: -5 as any,
        learningData: [
          {
            caseId: 'case_001',
            amount: 1500000,
            category: 'concrete_work',
            region: 'tokyo',
            date: '2024-01-15',
          },
        ],
      });
    }).toThrow(/データ粒度/);
  });

  test('should accept valid granularity types and standardize data correctly', () => {
    const validGranularities = ['item_level', 'category_level', 'region_level'];

    validGranularities.forEach((granularityType) => {
      const result = standardizeDataGranularity({
        granularity: granularityType as any,
        learningData: [
          {
            caseId: 'case_001',
            amount: 1500000,
            category: 'concrete_work',
            region: 'tokyo',
            date: '2024-01-15',
          },
        ],
      });

      expect(result.status).toBe('success');
      expect(result.granularity).toBe(granularityType);
      expect(result.standardizedCount).toBe(1);
    });
  });
});