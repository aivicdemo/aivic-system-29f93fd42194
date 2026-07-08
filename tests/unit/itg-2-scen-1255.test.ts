import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { collectOperatingMetricsAndGenerateAlerts } from '../../src/logic/it-1-br-2-2-2-1';

describe('運用指標の自動収集と閾値超過時のアラート生成機能', () => {
  // SCEN-1255
  test('複数の指標が同時に閾値を超過した場合、すべてのアラートが漏れなく生成される', () => {
    const testTimestamp = new Date('2024-01-15T09:00:00Z');
    const mockMetricsData = [
      {
        metricId: 'metric_001',
        metricName: '処理時間',
        metricUnit: '分',
        currentValue: 45.5,
        thresholdValue: 30.0,
        measurementTime: testTimestamp,
        metricsType: 'processing_time',
      },
      {
        metricId: 'metric_002',
        metricName: 'エラー率',
        metricUnit: '%',
        currentValue: 8.2,
        thresholdValue: 5.0,
        measurementTime: testTimestamp,
        metricsType: 'error_rate',
      },
      {
        metricId: 'metric_003',
        metricName: '処理件数',
        metricUnit: '件',
        currentValue: 250,
        thresholdValue: 200,
        measurementTime: testTimestamp,
        metricsType: 'processing_count',
      },
      {
        metricId: 'metric_004',
        metricName: 'システム稼働率',
        metricUnit: '%',
        currentValue: 98.5,
        thresholdValue: 99.0,
        measurementTime: testTimestamp,
        metricsType: 'system_uptime',
      },
    ];

    const alertThresholdConfig = {
      metric_001: { thresholdValue: 30.0, exceedanceType: 'above' },
      metric_002: { thresholdValue: 5.0, exceedanceType: 'above' },
      metric_003: { thresholdValue: 200, exceedanceType: 'above' },
      metric_004: { thresholdValue: 99.0, exceedanceType: 'below' },
    };

    const result = collectOperatingMetricsAndGenerateAlerts(
      mockMetricsData,
      alertThresholdConfig,
      testTimestamp
    );

    expect(result.alerts).toBeDefined();
    expect(result.alerts.length).toBe(4);

    const processingTimeAlert = result.alerts.find(
      (a) => a.metricId === 'metric_001'
    );
    expect(processingTimeAlert).toBeDefined();
    expect(processingTimeAlert?.metricName).toBe('処理時間');
    expect(processingTimeAlert?.currentValue).toBe(45.5);
    expect(processingTimeAlert?.thresholdValue).toBe(30.0);
    expect(processingTimeAlert?.exceedanceAmount).toBe(15.5);
    expect(processingTimeAlert?.exceedancePercentage).toBeCloseTo(51.67, 1);
    expect(processingTimeAlert?.severity).toBe('High');
    expect(processingTimeAlert?.generatedAt).toEqual(testTimestamp);
    expect(processingTimeAlert?.isDuplicate).toBe(false);

    const errorRateAlert = result.alerts.find(
      (a) => a.metricId === 'metric_002'
    );
    expect(errorRateAlert).toBeDefined();
    expect(errorRateAlert?.metricName).toBe('エラー率');
    expect(errorRateAlert?.currentValue).toBe(8.2);
    expect(errorRateAlert?.thresholdValue).toBe(5.0);
    expect(errorRateAlert?.exceedanceAmount).toBe(3.2);
    expect(errorRateAlert?.exceedancePercentage).toBe(64.0);
    expect(errorRateAlert?.severity).toBe('High');
    expect(errorRateAlert?.isDuplicate).toBe(false);

    const processingCountAlert = result.alerts.find(
      (a) => a.metricId === 'metric_003'
    );
    expect(processingCountAlert).toBeDefined();
    expect(processingCountAlert?.metricName).toBe('処理件数');
    expect(processingCountAlert?.currentValue).toBe(250);
    expect(processingCountAlert?.thresholdValue).toBe(200);
    expect(processingCountAlert?.exceedanceAmount).toBe(50);
    expect(processingCountAlert?.exceedancePercentage).toBe(25.0);
    expect(processingCountAlert?.severity).toBe('Medium');
    expect(processingCountAlert?.isDuplicate).toBe(false);

    const systemUptimeAlert = result.alerts.find(
      (a) => a.metricId === 'metric_004'
    );
    expect(systemUptimeAlert).toBeDefined();
    expect(systemUptimeAlert?.metricName).toBe('システム稼働率');
    expect(systemUptimeAlert?.currentValue).toBe(98.5);
    expect(systemUptimeAlert?.thresholdValue).toBe(99.0);
    expect(systemUptimeAlert?.exceedanceAmount).toBe(0.5);
    expect(systemUptimeAlert?.exceedancePercentage).toBeCloseTo(0.51, 1);
    expect(systemUptimeAlert?.severity).toBe('Medium');
    expect(systemUptimeAlert?.isDuplicate).toBe(false);

    const metricIds = result.alerts.map((a) => a.metricId).sort();
    expect(metricIds).toEqual([
      'metric_001',
      'metric_002',
      'metric_003',
      'metric_004',
    ]);

    for (let i = 0; i < result.alerts.length - 1; i++) {
      const currentTime = result.alerts[i].generatedAt.getTime();
      const nextTime = result.alerts[i + 1].generatedAt.getTime();
      expect(currentTime).toBeLessThanOrEqual(nextTime);
    }

    const duplicateAlerts = result.alerts.filter((a) => a.isDuplicate);
    expect(duplicateAlerts.length).toBe(0);

    expect(result.totalAlertsGenerated).toBe(4);
    expect(result.highSeverityCount).toBe(2);
    expect(result.mediumSeverityCount).toBe(2);
    expect(result.processedMetricsCount).toBe(4);
    expect(result.exceedanceMetricsCount).toBe(4);
    expect(result.collectionTimestamp).toEqual(testTimestamp);
    expect(result.processingDurationMs).toBeGreaterThanOrEqual(0);
  });
});