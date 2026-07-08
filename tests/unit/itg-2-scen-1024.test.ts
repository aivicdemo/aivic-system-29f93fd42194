import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

const fetchMock = require('jest-fetch-mock');
fetchMock.enableMocks();

import { validateExplanationMaterialApproval } from '../../src/logic/it-6-3-1';

describe('IT-6-3-1: 査定判定ロジックの適用履歴と根拠の記録・検索機能', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  // SCEN-1024
  it('修正履歴が存在しない説明資料を承認しようとした場合、修正履歴不在エラーが返却される', async () => {
    const explanation_material_id = 'mat_20240115_001';
    const department_chief_user_id = 'user_chief_20240101';
    const approval_timestamp = '2024-01-15T11:00:00Z';
    const approval_status = 'approved';
    const notes = '確認完了';

    const input_payload = {
      explanation_material_id: explanation_material_id,
      department_chief_user_id: department_chief_user_id,
      approval_timestamp: approval_timestamp,
      approval_status: approval_status,
      notes: notes,
    };

    const error_response = {
      error_code: 'REVISION_HISTORY_NOT_FOUND',
      error_message: '修正履歴が存在しません。',
      error_detail: `Material ID: ${explanation_material_id} には修正履歴レコードが見つかりません。`,
      status_code: 400,
    };

    fetchMock.mockResponseOnce(JSON.stringify(error_response), {
      status: 400,
    });

    const result = await validateExplanationMaterialApproval(input_payload);

    expect(result.success).toBe(false);
    expect(result.error_code).toBe('REVISION_HISTORY_NOT_FOUND');
    expect(result.status_code).toBe(400);
    expect(result.error_message).toMatch(/修正履歴/);
    expect(result.approval_applied).toBe(false);
    expect(result.database_updated).toBe(false);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/validate-approval'),
      expect.objectContaining({
        method: 'POST',
      })
    );
  });
});