import { describe, test, expect, beforeEach } from '@jest/globals';
import {
  validateResponseContentWithEvidenceCheck,
} from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能', () => {
  // SCEN-1195: [edge] 回答内容の最終確認・承認機能 - 根拠資料が部分的に不足している状態で検証が実行された場合、警告ステータスで修正指示が返される
  test('根拠資料が部分的に不足している状態で検証を実行すると、警告ステータスと不足資料の詳細が返される', () => {
    const responseContent = {
      response_id: 'resp-2024-001',
      customer_id: 'cust-12345',
      inquiry_type: '請求内容_異議申立',
      inquiry_date: '2024-01-15',
      response_content: '請求額の計算ロジックを確認し、割引適用条件を再検証いたしました。',
      response_date: '2024-01-20',
      supporting_documents: [
        {
          doc_id: 'doc-001',
          doc_type: '営業活動記録',
          doc_name: 'アポ数集計_2024-01',
          upload_status: 'uploaded',
          upload_timestamp: '2024-01-19T10:30:00Z',
        },
        {
          doc_id: 'doc-002',
          doc_type: '契約書',
          doc_name: '基本契約書_rev3',
          upload_status: 'not_uploaded',
          upload_timestamp: null,
        },
      ],
      required_documents: [
        {
          req_doc_type: '営業活動記録',
          requirement_level: 'mandatory',
          count: 1,
        },
        {
          req_doc_type: '契約書',
          requirement_level: 'mandatory',
          count: 1,
        },
        {
          req_doc_type: '提案資料',
          requirement_level: 'mandatory',
          count: 1,
        },
      ],
    };

    const validationResult = validateResponseContentWithEvidenceCheck(responseContent);

    expect(validationResult.status).toBe('WARNING');
    expect(validationResult.messages).toContainEqual(
      expect.objectContaining({
        message_type: 'missing_evidence',
        message_text: expect.stringContaining('不足している根拠資料'),
      })
    );
    expect(validationResult.messages.length).toBeGreaterThan(0);

    const missingEvidenceMessage = validationResult.messages.find(
      (msg) => msg.message_type === 'missing_evidence'
    );

    expect(missingEvidenceMessage).toBeDefined();
    expect(missingEvidenceMessage?.message_text).toContain('契約書');
    expect(missingEvidenceMessage?.message_text).toContain('提案資料');
    expect(missingEvidenceMessage?.missing_doc_types).toEqual(
      expect.arrayContaining(['契約書', '提案資料'])
    );
    expect(missingEvidenceMessage?.missing_doc_types.length).toBe(2);

    expect(validationResult.can_proceed_to_approval).toBe(false);
    expect(validationResult.approval_status).toBe('blocked');
  });
});