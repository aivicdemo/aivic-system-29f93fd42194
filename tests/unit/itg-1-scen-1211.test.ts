import { saveInquiryRecord } from '../../src/logic/it-1-2-1';

const fetchMock = require('jest-fetch-mock');

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  // SCEN-1211
  test('根拠資料が空配列の場合でも、問い合わせ記録は保存される', async () => {
    fetchMock.resetMocks();

    const inquiry_record = {
      inquiry_id: 'INQ-20240115-001',
      customer_id: 'CUST-ABC123',
      inquiry_date: '2024-01-15T09:30:00Z',
      inquiry_category: '請求内容確認',
      inquiry_content: 'アポ数の計算根拠を教えてください',
      verification_status: '検証完了',
      verification_result: '正確',
      root_cause: 'データ入力の誤解',
      evidence_documents: [],
      response_content: '契約書に基づいて正確に計算されています',
      response_date: '2024-01-16T10:00:00Z',
      response_confirmed: true,
      record_created_at: '2024-01-16T10:15:00Z',
      record_created_by: 'OP-USER-001'
    };

    fetchMock.mockResponseOnce(
      JSON.stringify({
        success: true,
        inquiry_record_id: 'REC-20240116-001',
        saved_data: inquiry_record
      }),
      { status: 200 }
    );

    const result = await saveInquiryRecord(inquiry_record);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(true);
    expect(result.inquiry_record_id).toBe('REC-20240116-001');
    expect(result.saved_data).toEqual(inquiry_record);
    expect(result.saved_data.evidence_documents).toEqual([]);
    expect(result.saved_data.evidence_documents).toHaveLength(0);
    expect(result.saved_data.inquiry_id).toBe('INQ-20240115-001');
    expect(result.saved_data.customer_id).toBe('CUST-ABC123');
    expect(result.saved_data.inquiry_date).toBe('2024-01-15T09:30:00Z');
    expect(result.saved_data.verification_status).toBe('検証完了');
    expect(result.saved_data.verification_result).toBe('正確');
    expect(result.saved_data.response_confirmed).toBe(true);
    expect(result.saved_data.record_created_at).toBe('2024-01-16T10:15:00Z');
  });
});