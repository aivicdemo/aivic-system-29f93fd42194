import { monitorSystemUptimeAndIncidents } from '../../src/logic/it-6-3-1';

describe('月次システム稼働率・インシデント状況の監視と判定', () => {
  // SCEN-1296
  test('1ヶ月分の稼働ログから稼働率・インシデント件数・平均復旧時間を集計し、許容範囲判定を出力する', () => {
    const uptimeLogs = [
      {
        system_id: 'sys_001',
        date: '2024-01-01',
        start_time: '2024-01-01T00:00:00Z',
        end_time: '2024-01-01T06:00:00Z',
        status: 'active',
      },
      {
        system_id: 'sys_001',
        date: '2024-01-01',
        start_time: '2024-01-01T06:30:00Z',
        end_time: '2024-01-01T23:59:59Z',
        status: 'active',
      },
      {
        system_id: 'sys_001',
        date: '2024-01-02',
        start_time: '2024-01-02T00:00:00Z',
        end_time: '2024-01-02T23:59:59Z',
        status: 'active',
      },
    ];

    const incidentLogs = [
      {
        system_id: 'sys_001',
        incident_id: 'inc_001',
        occurrence_time: '2024-01-01T06:00:00Z',
        recovery_time: '2024-01-01T06:15:00Z',
        severity: 'Medium',
      },
      {
        system_id: 'sys_001',
        incident_id: 'inc_002',
        occurrence_time: '2024-01-03T12:00:00Z',
        recovery_time: '2024-01-03T12:20:00Z',
        severity: 'Low',
      },
      {
        system_id: 'sys_001',
        incident_id: 'inc_003',
        occurrence_time: '2024-01-10T14:30:00Z',
        recovery_time: '2024-01-10T14:45:00Z',
        severity: 'Medium',
      },
    ];

    const report = monitorSystemUptimeAndIncidents({
      uptimeLogs,
      incidentLogs,
      monitoring_period_start: '2024-01-01',
      monitoring_period_end: '2024-01-31',
      uptime_threshold_percent: 99.0,
      incident_threshold_count: 5,
      recovery_time_threshold_minutes: 30,
    });

    expect(report).toEqual({
      system_id: 'sys_001',
      monitoring_period: {
        start_date: '2024-01-01',
        end_date: '2024-01-31',
      },
      uptime_rate_percent: expect.any(Number),
      incident_count: 3,
      mean_recovery_time_minutes: 13.333,
      uptime_status: expect.stringMatching(/normal|warning/),
      incident_status: expect.stringMatching(/normal|warning/),
      recovery_time_status: expect.stringMatching(/normal|warning/),
      overall_status: expect.stringMatching(/normal|warning/),
      threshold_compliance: {
        uptime_threshold_percent: 99.0,
        incident_threshold_count: 5,
        recovery_time_threshold_minutes: 30,
      },
      generated_at: expect.any(String),
    });

    expect(report.uptime_rate_percent).toBeGreaterThanOrEqual(0);
    expect(report.uptime_rate_percent).toBeLessThanOrEqual(100);
    expect(report.incident_count).toBe(3);
    expect(report.mean_recovery_time_minutes).toBe(13.333);
    expect(report.incident_status).toBe('normal');
    expect(report.recovery_time_status).toBe('normal');

    if (report.uptime_rate_percent >= 99.0) {
      expect(report.uptime_status).toBe('normal');
    } else {
      expect(report.uptime_status).toBe('warning');
    }

    if (
      report.uptime_status === 'normal' &&
      report.incident_status === 'normal' &&
      report.recovery_time_status === 'normal'
    ) {
      expect(report.overall_status).toBe('normal');
    } else {
      expect(report.overall_status).toBe('warning');
    }
  });
});