import { recordAuditLogForCorrection } from '../../src/logic/it-6-2-2-1';

describe('修正内容監査ログ記録機能 - 実施者情報検証', () => {
  // SCEN-1444
  test('実施者情報が不足している場合に記録不可エラーが発生する', () => {
    const correction_input = {
      correction_id: 'CORR-20250526-001',
      correction_datetime: new Date('2025-05-26T10:30:00Z'),
      corrected_before_value: '850000',
      corrected_after_value: '920000',
      correction_reason: '地域別補正係数を反映',
      applicable_assessment_id: 'ASS-2025-05-0042',
      implementer_user_id: null,
      implementer_user_name: null,
      implementer_department: null,
    };

    expect(() => recordAuditLogForCorrection(correction_input)).toThrow(/実施者/);
  });
});