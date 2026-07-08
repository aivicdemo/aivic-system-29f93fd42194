import { describe, test, expect, beforeEach } from '@jest/globals';
import { generateVerificationReport } from '../../src/logic/it-6-2-2-2';

describe('査定員別の判定精度・乖離パターン分析ダッシュボード', () => {
  // SCEN-1555: [edge] 見積査定員による運用マニュアル検証と合否判定 - 複数の検証項目が不合格と判定された場合、すべての指摘が査定部署長への報告資料に統合される
  test('複数の検証項目が不合格のときすべての指摘が報告資料に統合される', () => {
    const verificationItems = [
      {
        item_id: 'VERIFY_001',
        item_name: '査定根拠の妥当性',
        judgment: 'NG',
        reason: '過去案件データとの比較が不足している',
        improvement_guidance: '最低3件以上の過去案件との比較を実施してください'
      },
      {
        item_id: 'VERIFY_002',
        item_name: '評価額の算出根拠',
        judgment: 'NG',
        reason: '補正係数の適用根拠が明確でない',
        improvement_guidance: '地域別・季節別の補正係数の根拠文献を明示してください'
      },
      {
        item_id: 'VERIFY_003',
        item_name: '提出書類の完全性',
        judgment: 'NG',
        reason: '物価本の版番号が記載されていない',
        improvement_guidance: '物価本の版番号・公開日・有効期限を資料に必ず記載してください'
      }
    ];

    const report = generateVerificationReport({
      case_id: 'TEST_CASE_20240115_001',
      appraiser_id: 'APPR_0042',
      appraisal_date: '2024-01-15T10:30:00Z',
      verification_items: verificationItems,
      generated_at: '2024-01-15T11:00:00Z'
    });

    expect(report).toBeDefined();
    expect(report.case_id).toBe('TEST_CASE_20240115_001');
    expect(report.appraiser_id).toBe('APPR_0042');
    expect(report.ng_count).toBe(3);
    expect(report.report_status).toBe('GENERATED');

    expect(report.consolidated_findings).toHaveLength(3);

    expect(report.consolidated_findings[0]).toEqual({
      sequence: 1,
      item_id: 'VERIFY_001',
      item_name: '査定根拠の妥当性',
      judgment: 'NG',
      reason: '過去案件データとの比較が不足している',
      improvement_guidance: '最低3件以上の過去案件との比較を実施してください'
    });

    expect(report.consolidated_findings[1]).toEqual({
      sequence: 2,
      item_id: 'VERIFY_002',
      item_name: '評価額の算出根拠',
      judgment: 'NG',
      reason: '補正係数の適用根拠が明確でない',
      improvement_guidance: '地域別・季節別の補正係数の根拠文献を明示してください'
    });

    expect(report.consolidated_findings[2]).toEqual({
      sequence: 3,
      item_id: 'VERIFY_003',
      item_name: '提出書類の完全性',
      judgment: 'NG',
      reason: '物価本の版番号が記載されていない',
      improvement_guidance: '物価本の版番号・公開日・有効期限を資料に必ず記載してください'
    });

    expect(report.consolidated_findings[0].item_name).not.toBe(report.consolidated_findings[1].item_name);
    expect(report.consolidated_findings[1].item_name).not.toBe(report.consolidated_findings[2].item_name);
    expect(report.consolidated_findings[0].item_name).not.toBe(report.consolidated_findings[2].item_name);

    expect(report.report_format).toBe('PDF');
    expect(report.department_head_recipient).toBe('DEPT_QA_ADMIN');
    expect(report.distribution_status).toBe('READY_FOR_DISTRIBUTION');
  });
});