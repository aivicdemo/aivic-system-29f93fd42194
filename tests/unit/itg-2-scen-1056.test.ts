import { describe, test, expect, beforeEach } from '@jest/globals';
import {
  generateMonthlyAnalysisReport,
  validateReportDataIntegrity,
  calculateAssessmentStatistics
} from '../../src/logic/it-1-br-2-2-2-1';

describe('月次分析レポート自動生成・検証機能', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1056
  test('月次分析レポートのデータ集計が正確であることが検証される', () => {
    // 前提データ：2024年1月の査定実績
    const targetMonth = '2024-01';
    const assessmentRecords = [
      {
        id: 'ASS001',
        assessor_id: 'ASR001',
        assessment_date: '2024-01-05T09:30:00Z',
        quotation_amount: 1000000,
        assessment_rank: 'A'
      },
      {
        id: 'ASS002',
        assessor_id: 'ASR001',
        assessment_date: '2024-01-08T10:15:00Z',
        quotation_amount: 1200000,
        assessment_rank: 'B'
      },
      {
        id: 'ASS003',
        assessor_id: 'ASR002',
        assessment_date: '2024-01-12T11:45:00Z',
        quotation_amount: 900000,
        assessment_rank: 'A'
      },
      {
        id: 'ASS004',
        assessor_id: 'ASR002',
        assessment_date: '2024-01-15T14:20:00Z',
        quotation_amount: 1100000,
        assessment_rank: 'C'
      },
      {
        id: 'ASS005',
        assessor_id: 'ASR001',
        assessment_date: '2024-01-20T16:00:00Z',
        quotation_amount: 950000,
        assessment_rank: 'A'
      }
    ];

    // レポート生成の入力パラメータ
    const reportInput = {
      target_month: targetMonth,
      assessment_records: assessmentRecords,
      include_statistics: true,
      include_duplicate_check: true
    };

    // レポート生成実行
    const generatedReport = generateMonthlyAnalysisReport(reportInput);

    // 期待値の計算：月次集計値
    const expected_total_count = 5;
    const expected_assessment_amount_total = 1000000 + 1200000 + 900000 + 1100000 + 950000; // 5,150,000
    const expected_average_amount = 5150000 / 5; // 1,030,000
    const sorted_amounts = [900000, 950000, 1000000, 1100000, 1200000];
    const expected_median_amount = sorted_amounts[2]; // 1,000,000
    const expected_min_amount = 900000;
    const expected_max_amount = 1200000;

    // 期待値：ランク別集計
    const expected_rank_A_count = 3; // ASS001, ASS003, ASS005
    const expected_rank_B_count = 1; // ASS002
    const expected_rank_C_count = 1; // ASS004

    // 期待値：査정員별 집計
    const expected_assessor_ASR001_count = 3; // ASS001, ASS002, ASS005
    const expected_assessor_ASR002_count = 2; // ASS003, ASS004

    // 1. レポート全体の構造を検証
    expect(generatedReport).toHaveProperty('report_id');
    expect(generatedReport).toHaveProperty('target_month', targetMonth);
    expect(generatedReport).toHaveProperty('generated_at');
    expect(generatedReport).toHaveProperty('summary');
    expect(generatedReport).toHaveProperty('rank_breakdown');
    expect(generatedReport).toHaveProperty('assessor_breakdown');
    expect(generatedReport).toHaveProperty('statistics');
    expect(generatedReport).toHaveProperty('data_integrity_check');

    // 2. 集計対象期間内のすべてのレコードがレポートに含まれていることを確認
    expect(generatedReport.summary.total_assessment_count).toBe(expected_total_count);
    expect(generatedReport.summary.records_included).toBe(expected_total_count);

    // 3. 合計金額の検証（小計と合計の整合性）
    expect(generatedReport.summary.total_quotation_amount).toBe(expected_assessment_amount_total);
    expect(generatedReport.summary.sum_verification).toBe(true);

    // 4. 平均値の計算精度を検証
    expect(generatedReport.statistics.average_quotation_amount).toBe(expected_average_amount);

    // 5. 中央値の計算精度を検証
    expect(generatedReport.statistics.median_quotation_amount).toBe(expected_median_amount);

    // 6. 最小・最大値の検証
    expect(generatedReport.statistics.min_quotation_amount).toBe(expected_min_amount);
    expect(generatedReport.statistics.max_quotation_amount).toBe(expected_max_amount);

    // 7. ランク別集計の正確性を検証
    expect(generatedReport.rank_breakdown.rank_A.count).toBe(expected_rank_A_count);
    expect(generatedReport.rank_breakdown.rank_B.count).toBe(expected_rank_B_count);
    expect(generatedReport.rank_breakdown.rank_C.count).toBe(expected_rank_C_count);

    // 8. ランク別集計の合計確認（重複なし）
    const rank_total = 
      generatedReport.rank_breakdown.rank_A.count + 
      generatedReport.rank_breakdown.rank_B.count + 
      generatedReport.rank_breakdown.rank_C.count;
    expect(rank_total).toBe(expected_total_count);

    // 9. 査定員別集計の正確性を検証
    expect(generatedReport.assessor_breakdown.ASR001.count).toBe(expected_assessor_ASR001_count);
    expect(generatedReport.assessor_breakdown.ASR002.count).toBe(expected_assessor_ASR002_count);

    // 10. 査定員別集計の合計確認（重複なし）
    const assessor_total = 
      generatedReport.assessor_breakdown.ASR001.count + 
      generatedReport.assessor_breakdown.ASR002.count;
    expect(assessor_total).toBe(expected_total_count);

    // 11. 重複検出チェックの実行と結果確認
    const duplication_check = validateReportDataIntegrity({
      report_data: generatedReport,
      source_records: assessmentRecords
    });

    expect(duplication_check.has_duplicates).toBe(false);
    expect(duplication_check.duplicate_count).toBe(0);
    expect(duplication_check.missing_records).toBe(0);
    expect(duplication_check.integrity_status).toBe('PASSED');

    // 12. データ整合性チェック：レポート内の合計がソースレコードの合計と一致
    expect(generatedReport.data_integrity_check.source_record_count).toBe(assessmentRecords.length);
    expect(generatedReport.data_integrity_check.report_record_count).toBe(expected_total_count);
    expect(generatedReport.data_integrity_check.records_match).toBe(true);

    // 13. 小計と合計の検証
    const rank_A_amount_total = 1000000 + 900000 + 950000; // 2,850,000
    const rank_B_amount_total = 1200000; // 1,200,000
    const rank_C_amount_total = 1100000; // 1,100,000
    const subtotal_sum = rank_A_amount_total + rank_B_amount_total + rank_C_amount_total;

    expect(generatedReport.rank_breakdown.rank_A.total_amount).toBe(rank_A_amount_total);
    expect(generatedReport.rank_breakdown.rank_B.total_amount).toBe(rank_B_amount_total);
    expect(generatedReport.rank_breakdown.rank_C.total_amount).toBe(rank_C_amount_total);
    expect(subtotal_sum).toBe(expected_assessment_amount_total);

    // 14. 統計計算検証：分散と標準偏差
    const variance_input = assessmentRecords.map(r => r.quotation_amount);
    const stats_result = calculateAssessmentStatistics({
      amounts: variance_input
    });

    expect(stats_result.mean).toBe(expected_average_amount);
    expect(stats_result.median).toBe(expected_median_amount);
    expect(stats_result.min).toBe(expected_min_amount);
    expect(stats_result.max).toBe(expected_max_amount);
    expect(stats_result.count).toBe(5);
    expect(typeof stats_result.standard_deviation).toBe('number');
    expect(stats_result.standard_deviation).toBeGreaterThan(0);

    // 15. レポート生成メタデータの検証
    expect(generatedReport.generated_at).toBeDefined();
    expect(new Date(generatedReport.generated_at)).toBeInstanceOf(Date);
    expect(generatedReport.report_status).toBe('COMPLETED');
    expect(generatedReport.validation_passed).toBe(true);
  });
});