import { validateAndRecordAuditTrail } from '../../src/logic/it-6-3-1';

describe('査定判定ロジックの適用履歴と根拠の記録・検索機能', () => {
  // SCEN-1398: [error] OCR読取誤り判定機能 - 入力値がnullまたは空文字列の場合、処理が継続せず適切なエラーが返される
  test('入力値がnullまたは空文字列の場合、処理が継続せず適切なエラーハンドリングが行われること', () => {
    // ========== null入力のテスト ==========
    // 入力値がnullの場合、エラーレスポンスが返されることを確認
    expect(() => {
      validateAndRecordAuditTrail({
        assessmentId: null as any,
        ocrReadingResult: '金額: 1000000円',
        assessorId: 'A001',
        assessmentLogic: 'LOGIC_001',
        assessmentTimestamp: new Date('2024-01-15T11:00:00Z'),
      });
    }).toThrow(/assessmentId/);

    expect(() => {
      validateAndRecordAuditTrail({
        assessmentId: 'ASS_001',
        ocrReadingResult: null as any,
        assessorId: 'A001',
        assessmentLogic: 'LOGIC_001',
        assessmentTimestamp: new Date('2024-01-15T11:00:00Z'),
      });
    }).toThrow(/ocrReadingResult/);

    expect(() => {
      validateAndRecordAuditTrail({
        assessmentId: 'ASS_001',
        ocrReadingResult: '金額: 1000000円',
        assessorId: null as any,
        assessmentLogic: 'LOGIC_001',
        assessmentTimestamp: new Date('2024-01-15T11:00:00Z'),
      });
    }).toThrow(/assessorId/);

    // ========== 空文字列入力のテスト ==========
    // 入力値が空文字列の場合、エラーレスポンスが返されることを確認
    expect(() => {
      validateAndRecordAuditTrail({
        assessmentId: '',
        ocrReadingResult: '金額: 1000000円',
        assessorId: 'A001',
        assessmentLogic: 'LOGIC_001',
        assessmentTimestamp: new Date('2024-01-15T11:00:00Z'),
      });
    }).toThrow(/assessmentId/);

    expect(() => {
      validateAndRecordAuditTrail({
        assessmentId: 'ASS_001',
        ocrReadingResult: '',
        assessorId: 'A001',
        assessmentLogic: 'LOGIC_001',
        assessmentTimestamp: new Date('2024-01-15T11:00:00Z'),
      });
    }).toThrow(/ocrReadingResult/);

    expect(() => {
      validateAndRecordAuditTrail({
        assessmentId: 'ASS_001',
        ocrReadingResult: '金額: 1000000円',
        assessorId: '',
        assessmentLogic: 'LOGIC_001',
        assessmentTimestamp: new Date('2024-01-15T11:00:00Z'),
      });
    }).toThrow(/assessorId/);

    // ========== 正常系: 後続処理への進行確認 ==========
    // すべての入力が正常な場合、後続の査定品質判定処理が実行されること
    const validResult = validateAndRecordAuditTrail({
      assessmentId: 'ASS_001',
      ocrReadingResult: '金額: 1000000円、数量: 10個、単価: 100000円',
      assessorId: 'A001',
      assessmentLogic: 'LOGIC_001',
      assessmentTimestamp: new Date('2024-01-15T11:00:00Z'),
    });

    expect(validResult).toEqual({
      success: true,
      auditTrailId: expect.any(String),
      assessmentId: 'ASS_001',
      ocrReadingResult: '金額: 1000000円、数量: 10個、単価: 100000円',
      assessorId: 'A001',
      assessmentLogic: 'LOGIC_001',
      recordedAt: expect.any(Date),
      qualityCheckExecuted: true,
    });

    expect(validResult.success).toBe(true);
    expect(validResult.qualityCheckExecuted).toBe(true);
  });
});