import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { generateMonthlyAnalysisReport } from '../../src/logic/it-6-2-2-2';

const fetchMock = require('jest-fetch-mock');

describe('査定員別の判定精度・乖離パターン分析ダッシュボード', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  // SCEN-1103
  it('月次分析レポート生成機能 - 査定員数が1名の境界値で、分析レポートが正常に生成される', async () => {
    // 準備: 査定員数1名の月次分析データを構築
    const assessor_id = 'ASSESSOR_001';
    const assessor_name = '査定員A';
    const organization_id = 'ORG_001';
    const report_month = '2024-01';
    const target_date = '2024-01-31';

    // 査定員1名の分析データセット
    const assessment_results = [
      {
        assessment_id: 'ASSESS_0001',
        assessor_id: assessor_id,
        assessment_date: '2024-01-05T09:00:00Z',
        estimate_amount: 1000000,
        deviation_rate: 0.05,
        deviation_amount: 50000,
        processing_time_minutes: 15,
        judgment_result: 'approval',
        accuracy_score: 95,
        region: 'tokyo',
        construction_type: 'foundation'
      },
      {
        assessment_id: 'ASSESS_0002',
        assessor_id: assessor_id,
        assessment_date: '2024-01-10T10:30:00Z',
        estimate_amount: 500000,
        deviation_rate: 0.02,
        deviation_amount: 10000,
        processing_time_minutes: 12,
        judgment_result: 'approval',
        accuracy_score: 98,
        region: 'osaka',
        construction_type: 'structure'
      },
      {
        assessment_id: 'ASSESS_0003',
        assessor_id: assessor_id,
        assessment_date: '2024-01-15T14:00:00Z',
        estimate_amount: 800000,
        deviation_rate: 0.08,
        deviation_amount: 64000,
        processing_time_minutes: 18,
        judgment_result: 'revision_required',
        accuracy_score: 90,
        region: 'tokyo',
        construction_type: 'foundation'
      },
      {
        assessment_id: 'ASSESS_0004',
        assessor_id: assessor_id,
        assessment_date: '2024-01-20T11:00:00Z',
        estimate_amount: 1200000,
        deviation_rate: 0.03,
        deviation_amount: 36000,
        processing_time_minutes: 14,
        judgment_result: 'approval',
        accuracy_score: 96,
        region: 'fukuoka',
        construction_type: 'electrical'
      }
    ];

    const assessor_data = {
      assessor_id: assessor_id,
      assessor_name: assessor_name,
      organization_id: organization_id,
      total_assessments: 4,
      assessments: assessment_results
    };

    // Mock API レスポンス
    fetchMock.mockResponseOnce(
      JSON.stringify({
        status: 'success',
        data: {
          organization_id: organization_id,
          report_month: report_month,
          total_assessor_count: 1,
          assessor_list: [assessor_data]
        }
      }),
      { status: 200 }
    );

    // 関数実行: 月次分析レポート生成
    const result = await generateMonthlyAnalysisReport({
      organization_id: organization_id,
      report_month: report_month,
      target_date: new Date(target_date)
    });

    // 検証1: レポート生成ステータス
    expect(result.status).toBe('success');
    expect(result.report_id).toBeDefined();
    expect(result.report_id.length).toBeGreaterThan(0);

    // 検証2: 査定員データが正常に集計されていること
    expect(result.total_assessor_count).toBe(1);
    expect(result.assessor_summary).toBeDefined();
    expect(result.assessor_summary.length).toBe(1);

    const assessor_summary = result.assessor_summary[0];
    expect(assessor_summary.assessor_id).toBe(assessor_id);
    expect(assessor_summary.assessor_name).toBe(assessor_name);
    expect(assessor_summary.assessment_count).toBe(4);

    // 検証3: 統計情報が正しく計算されていること
    // 平均処理時間: (15 + 12 + 18 + 14) / 4 = 14.75 分
    expect(assessor_summary.average_processing_time_minutes).toBe(14.75);

    // 平均精度スコア: (95 + 98 + 90 + 96) / 4 = 94.75
    expect(assessor_summary.average_accuracy_score).toBe(94.75);

    // 平均乖離率: (0.05 + 0.02 + 0.08 + 0.03) / 4 = 0.045 (4.5%)
    expect(assessor_summary.average_deviation_rate).toBeCloseTo(0.045, 5);

    // 合計乖離額: 50000 + 10000 + 64000 + 36000 = 160000
    expect(assessor_summary.total_deviation_amount).toBe(160000);

    // 承認件数: 3件 (ASSESS_0001, ASSESS_0002, ASSESS_0004)
    expect(assessor_summary.approval_count).toBe(3);

    // 修正要否件数: 1件 (ASSESS_0003)
    expect(assessor_summary.revision_required_count).toBe(1);

    // 承認率: 3 / 4 = 0.75 (75%)
    expect(assessor_summary.approval_rate).toBe(0.75);

    // 検証4: 地域別の乖離パターン分析
    expect(result.regional_analysis).toBeDefined();
    expect(result.regional_analysis.tokyo).toBeDefined();
    expect(result.regional_analysis.tokyo.assessment_count).toBe(2);
    expect(result.regional_analysis.tokyo.average_deviation_rate).toBeCloseTo(0.065, 5);
    expect(result.regional_analysis.osaka.assessment_count).toBe(1);
    expect(result.regional_analysis.fukuoka.assessment_count).toBe(1);

    // 検証5: 工種別の乖離パターン分析
    expect(result.construction_type_analysis).toBeDefined();
    expect(result.construction_type_analysis.foundation.assessment_count).toBe(2);
    expect(result.construction_type_analysis.foundation.average_deviation_rate).toBeCloseTo(0.065, 5);
    expect(result.construction_type_analysis.structure.assessment_count).toBe(1);
    expect(result.construction_type_analysis.electrical.assessment_count).toBe(1);

    // 検証6: レポートのダウンロード情報
    expect(result.download_info).toBeDefined();
    expect(result.download_info.file_name).toBe(`monthly_analysis_report_2024-01.pdf`);
    expect(result.download_info.file_format).toBe('pdf');
    expect(result.download_info.file_size_bytes).toBeGreaterThan(0);
    expect(result.download_info.download_url).toBeDefined();
    expect(result.download_info.download_url.length).toBeGreaterThan(0);

    // 検証7: レポート作成日時情報
    expect(result.generated_at).toBeDefined();
    const generated_date = new Date(result.generated_at);
    expect(generated_date.getFullYear()).toBe(2024);
    expect(generated_date.getMonth()).toBe(0); // January = 0

    // 検証8: レポートが正常に出力可能な状態であること
    expect(result.is_downloadable).toBe(true);
    expect(result.download_expiry_date).toBeDefined();
    const expiry_date = new Date(result.download_expiry_date);
    expect(expiry_date.getTime()).toBeGreaterThan(generated_date.getTime());

    // 検証9: 月次分析レポートのメタデータ
    expect(result.report_period_start).toBe('2024-01-01');
    expect(result.report_period_end).toBe('2024-01-31');
    expect(result.data_quality_score).toBeGreaterThanOrEqual(0);
    expect(result.data_quality_score).toBeLessThanOrEqual(100);

    // 検証10: 複合指標の計算確認
    // 処理効率指標 = 合計査定件数 / 合計処理時間(分) * 60 (1時間あたりの件数)
    // = 4 / 59 * 60 ≈ 4.07 件/時間
    expect(result.processing_efficiency_per_hour).toBeCloseTo(4.07, 1);
  });
});