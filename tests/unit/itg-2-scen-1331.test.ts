import { detectOCRQualityAnomaly } from '../../src/logic/it-6-3-1';

describe('見積金額乖離検出・異常値通知機能', () => {
  // SCEN-1331
  test('OCR読取精度が閾値以下に低下した場合、異常値検出ロジックが発動し、運用者へ通知が送信される', () => {
    const threshold_ocr_accuracy = 95;
    const current_ocr_accuracy = 90;
    const detection_timestamp = '2024-06-15T09:30:00Z';
    const assessment_data_id = 'QUOTE-20240615-001';
    const assessment_data_amount = 5000000;
    const assessment_data_category = '鉄骨工事';
    const assessment_data_region = '東京都';

    const input = {
      ocr_accuracy_threshold: threshold_ocr_accuracy,
      current_ocr_accuracy: current_ocr_accuracy,
      detection_timestamp: detection_timestamp,
      assessment_data: {
        id: assessment_data_id,
        amount: assessment_data_amount,
        category: assessment_data_category,
        region: assessment_data_region,
      },
      operator_recipient_id: 'OPE-000001',
    };

    const result = detectOCRQualityAnomaly(input);

    expect(result).toEqual({
      is_anomaly_detected: true,
      anomaly_level: 'critical',
      detection_datetime: detection_timestamp,
      ocr_accuracy_current: current_ocr_accuracy,
      ocr_accuracy_threshold: threshold_ocr_accuracy,
      accuracy_deviation: current_ocr_accuracy - threshold_ocr_accuracy,
      affected_assessment_data: {
        id: assessment_data_id,
        amount: assessment_data_amount,
        category: assessment_data_category,
        region: assessment_data_region,
      },
      notification_sent: true,
      notification_recipient_id: 'OPE-000001',
      notification_content: {
        anomaly_detection_datetime: detection_timestamp,
        ocr_accuracy_value: current_ocr_accuracy,
        threshold_value: threshold_ocr_accuracy,
        deviation_value: -5,
        affected_data_count: 1,
        affected_data_details: [
          {
            assessment_id: assessment_data_id,
            amount: assessment_data_amount,
            category: assessment_data_category,
            region: assessment_data_region,
          },
        ],
      },
      notification_delivery_status: 'delivered',
      notification_delivery_log_id: 'LOG-20240615-001',
    });

    expect(result.is_anomaly_detected).toBe(true);
    expect(result.anomaly_level).toBe('critical');
    expect(result.notification_sent).toBe(true);
    expect(result.notification_delivery_status).toBe('delivered');
    expect(result.accuracy_deviation).toBe(-5);
    expect(result.notification_content.anomaly_detection_datetime).toBe(
      detection_timestamp
    );
    expect(result.notification_content.ocr_accuracy_value).toBe(
      current_ocr_accuracy
    );
    expect(result.notification_content.threshold_value).toBe(
      threshold_ocr_accuracy
    );
    expect(result.notification_content.affected_data_count).toBe(1);
    expect(result.notification_recipient_id).toBe('OPE-000001');
  });
});