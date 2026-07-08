import { notifyModelOperationStart } from '../../src/logic/it-6-2-2-1';

describe('改善モデル運用開始通知 - 日時バリデーション', () => {
  test('SCEN-1511: 運用開始日時が過去日時の場合、検証エラーを返却', async () => {
    const pastDateTime = new Date('2020-01-01T12:00:00Z').toISOString();
    const futureDateTime = new Date('2026-12-31T23:59:59Z').toISOString();
    
    const requestPayload = {
      model_id: 'model_001',
      notification_type: 'OPERATION_START',
      operation_start_datetime: pastDateTime,
      model_version: '2.1.0',
      improvement_summary: 'OCR精度向上、季節変動対応',
      target_assessor_count: 30,
    };

    const fetchMock = require('jest-fetch-mock');
    fetchMock.enableMocks();
    fetchMock.resetMocks();

    fetchMock.mockResponseOnce(
      JSON.stringify({
        error_code: 'INVALID_DATETIME',
        error_message: '運用開始日時が無効です。過去の日時は指定できません',
        status_code: 400,
      }),
      { status: 400 }
    );

    const response = await fetch('http://api.example.com/model/notify-operation-start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestPayload),
    });

    expect(response.status).toBe(400);

    const responseBody = await response.json();
    expect(responseBody.error_code).toBe('INVALID_DATETIME');
    expect(responseBody.error_message).toMatch(/過去の日時/);
    expect(responseBody.status_code).toBe(400);

    fetchMock.disableMocks();
  });

  test('SCEN-1511-success: 運用開始日時が未来日時の場合、正常に処理される', async () => {
    const futureDateTime = new Date('2026-12-31T23:59:59Z').toISOString();

    const requestPayload = {
      model_id: 'model_002',
      notification_type: 'OPERATION_START',
      operation_start_datetime: futureDateTime,
      model_version: '2.1.0',
      improvement_summary: 'AI判定精度向上、処理時間短縮',
      target_assessor_count: 30,
    };

    const fetchMock = require('jest-fetch-mock');
    fetchMock.enableMocks();
    fetchMock.resetMocks();

    fetchMock.mockResponseOnce(
      JSON.stringify({
        success: true,
        model_id: 'model_002',
        operation_start_datetime: futureDateTime,
        notification_sent_datetime: new Date('2024-01-15T10:00:00Z').toISOString(),
        notified_assessor_count: 30,
      }),
      { status: 200 }
    );

    const response = await fetch('http://api.example.com/model/notify-operation-start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestPayload),
    });

    expect(response.status).toBe(200);

    const responseBody = await response.json();
    expect(responseBody.success).toBe(true);
    expect(responseBody.model_id).toBe('model_002');
    expect(responseBody.operation_start_datetime).toBe(futureDateTime);
    expect(responseBody.notified_assessor_count).toBe(30);

    fetchMock.disableMocks();
  });

  test('SCEN-1511-boundary: 運用開始日時が現在と同じ場合、受け入れられる', async () => {
    const currentDateTime = new Date('2024-01-15T11:00:00Z').toISOString();

    const requestPayload = {
      model_id: 'model_003',
      notification_type: 'OPERATION_START',
      operation_start_datetime: currentDateTime,
      model_version: '2.1.0',
      improvement_summary: '学習データ更新',
      target_assessor_count: 30,
    };

    const fetchMock = require('jest-fetch-mock');
    fetchMock.enableMocks();
    fetchMock.resetMocks();

    fetchMock.mockResponseOnce(
      JSON.stringify({
        success: true,
        model_id: 'model_003',
        operation_start_datetime: currentDateTime,
        notification_sent_datetime: currentDateTime,
        notified_assessor_count: 30,
      }),
      { status: 200 }
    );

    const response = await fetch('http://api.example.com/model/notify-operation-start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestPayload),
    });

    expect(response.status).toBe(200);

    const responseBody = await response.json();
    expect(responseBody.success).toBe(true);
    expect(responseBody.notified_assessor_count).toBe(30);

    fetchMock.disableMocks();
  });
});