import { describe, test, expect, beforeEach } from '@jest/globals';
import { validateFinalApprovalResponse } from '../../src/logic/it-1-1-1';

describe('営業成果データの自動検証ルール定義と異常検出機能', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1221: [edge] 回答内容の最終承認検証機能 - 顧客への説明文が空文字列の場合、修正指示が返される
  test('顧客への説明文が空文字列の場合、修正指示エラーが返される', () => {
    const approval_input = {
      customer_name: 'テスト顧客株式会社',
      transaction_content: '営業成果報告',
      customer_explanation: '',
      approval_date: '2024-01-15T10:00:00Z',
      approver_id: 'mgr_001'
    };

    expect(() => validateFinalApprovalResponse(approval_input)).toThrow(/顧客への説明文/);
  });

  test('顧客への説明文が有効な値の場合、承認が成功する', () => {
    const approval_input = {
      customer_name: 'テスト顧客株式会社',
      transaction_content: '営業成果報告',
      customer_explanation: '本月のアポ数は20件、成約数は5件となりました。',
      approval_date: '2024-01-15T10:00:00Z',
      approver_id: 'mgr_001'
    };

    const result = validateFinalApprovalResponse(approval_input);

    expect(result).toEqual({
      approval_status: 'approved',
      approval_timestamp: '2024-01-15T10:00:00Z',
      approver_id: 'mgr_001'
    });
  });

  test('複数の必須フィールドが空の場合、最初の空フィールドについて修正指示が返される', () => {
    const approval_input = {
      customer_name: '',
      transaction_content: '営業成果報告',
      customer_explanation: '',
      approval_date: '2024-01-15T10:00:00Z',
      approver_id: 'mgr_001'
    };

    expect(() => validateFinalApprovalResponse(approval_input)).toThrow(/顧客名|顧客への説明文/);
  });

  test('顧客への説明文がホワイトスペースのみの場合、修正指示が返される', () => {
    const approval_input = {
      customer_name: 'テスト顧客株式会社',
      transaction_content: '営業成果報告',
      customer_explanation: '   ',
      approval_date: '2024-01-15T10:00:00Z',
      approver_id: 'mgr_001'
    };

    expect(() => validateFinalApprovalResponse(approval_input)).toThrow(/顧客への説明文/);
  });

  test('顧客への説明文が有効で且つ他フィールドも完全な場合、承認情報が返される', () => {
    const approval_input = {
      customer_name: 'ABC商事',
      transaction_content: '月次営業成果確認',
      customer_explanation: 'この度は営業成果のご報告です。詳細は別紙をご参照ください。',
      approval_date: '2024-01-20T14:30:00Z',
      approver_id: 'rep_002'
    };

    const result = validateFinalApprovalResponse(approval_input);

    expect(result.approval_status).toBe('approved');
    expect(result.approval_timestamp).toBe('2024-01-20T14:30:00Z');
    expect(result.approver_id).toBe('rep_002');
  });
});