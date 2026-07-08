import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { analyzeCorrectionSlaBySalesstaff } from '../../src/logic/it-6-2-2-2';

describe('査定員別の判定精度・乖離パターン分析ダッシュボード', () => {
  // SCEN-1440: [error] 読取誤り修正SLA可視化機能 - 修正段階の完了時間データが欠落している場合にエラーハンドリングされる
  test('修正段階の完了時間データが欠落している場合、適切なエラーハンドリングが実行される', () => {
    // 準備: 修正段階の完了時間データが欠落している査定案件データ
    const correction_sla_dataset = [
      {
        assessment_project_id: 'PROJ-001',
        assessor_name: '査定員A',
        ocr_reading_error_detected_at: new Date('2024-03-15T09:00:00Z'),
        correction_analysis_completed_at: new Date('2024-03-15T09:15:00Z'),
        correction_implementation_started_at: new Date('2024-03-15T09:30:00Z'),
        correction_implementation_completed_at: new Date('2024-03-15T10:00:00Z'),
        correction_verification_completed_at: new Date('2024-03-15T10:15:00Z'),
        sla_target_minutes: 30
      },
      {
        assessment_project_id: 'PROJ-002',
        assessor_name: '査定員B',
        ocr_reading_error_detected_at: new Date('2024-03-15T10:00:00Z'),
        correction_analysis_completed_at: new Date('2024-03-15T10:10:00Z'),
        correction_implementation_started_at: new Date('2024-03-15T10:20:00Z'),
        correction_implementation_completed_at: null, // 欠落データ
        correction_verification_completed_at: new Date('2024-03-15T11:00:00Z'),
        sla_target_minutes: 30
      },
      {
        assessment_project_id: 'PROJ-003',
        assessor_name: '査定員C',
        ocr_reading_error_detected_at: new Date('2024-03-15T11:00:00Z'),
        correction_analysis_completed_at: new Date('2024-03-15T11:05:00Z'),
        correction_implementation_started_at: new Date('2024-03-15T11:15:00Z'),
        correction_implementation_completed_at: new Date('2024-03-15T11:45:00Z'),
        correction_verification_completed_at: null, // 欠落データ
        sla_target_minutes: 30
      }
    ];

    // 実行: SLA可視化レポート生成を試行
    expect(() => {
      analyzeCorrectionSlaBySalesstaff(correction_sla_dataset);
    }).toThrow(/完了時間/);
  });
});