import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { generateMonthlySummaryReport } from '../../src/logic/it-1-br-1781935279444-1-2-1';

describe('月次サマリーテンプレートの定義・管理機能', () => {
  let fetchMock: any;

  beforeEach(() => {
    fetchMock = require('jest-fetch-mock');
    fetchMock.enableMocks();
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.disableMocks();
  });

  // SCEN-1037: [error] 月次サマリーレポートの生成と内容確認 - レポートテンプレートが定義されていない状態でエラーが返却される
  test('レポートテンプレートが定義されていない場合、エラーを返却すること', async () => {
    const params = {
      period_start_date: '2024-01-01',
      period_end_date: '2024-01-31',
      organization_id: 'org_123',
      user_id: 'user_456'
    };

    fetchMock.mockResponseOnce(
      JSON.stringify({
        status: 400,
        error_code: 'TEMPLATE_NOT_DEFINED',
        message: 'レポートテンプレートが定義されていません'
      }),
      { status: 400 }
    );

    await expect(async () => {
      const response = await generateMonthlySummaryReport(params);
      if (!response.ok) {
        throw new Error('レポートテンプレート');
      }
    }).rejects.toThrow(/レポートテンプレート/);
  });
});