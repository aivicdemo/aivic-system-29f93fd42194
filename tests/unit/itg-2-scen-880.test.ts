import { issueDivisionJudgmentStandardUnificationDirective } from '../../src/logic/it-1-br-6-2-1';

describe('査定員別の判定ばらつき率と相場乖離傾向の自動集計・分析機能', () => {
  // SCEN-880: [normal] 査定部署別判定基準統一・策定支援機能 - 新人査定員配置時に判定基準統一指示が自動発行される
  test('新人査定員配置登録後、判定基準統一指示が自動発行され、標準化基準が周知される', () => {
    const newAuditorDeployment = {
      deploymentId: 'dep_20240115_001',
      divisionCode: 'DIV_COST_ESTIMATE',
      deploymentDate: '2024-01-15T09:00:00Z',
      auditorId: 'aud_new_0042',
      auditorName: '新人査定員_太郎',
      auditorLevel: 'junior',
      supervisorId: 'aud_exp_0001',
    };

    const existingDivisionStandard = {
      divisionCode: 'DIV_COST_ESTIMATE',
      standardVersion: 'v2.3',
      standardizedDate: '2023-12-01T00:00:00Z',
      judgmentCriteria: [
        {
          categoryCode: 'CAT_MATERIAL_COST',
          allowableDeviation: 5.0,
          lowerBound: 95.0,
          upperBound: 105.0,
          unitPrice: 10000,
        },
        {
          categoryCode: 'CAT_LABOR_COST',
          allowableDeviation: 7.0,
          lowerBound: 93.0,
          upperBound: 107.0,
          unitPrice: 8000,
        },
        {
          categoryCode: 'CAT_EQUIPMENT_COST',
          allowableDeviation: 10.0,
          lowerBound: 90.0,
          upperBound: 110.0,
          unitPrice: 5000,
        },
      ],
    };

    const result = issueDivisionJudgmentStandardUnificationDirective(
      newAuditorDeployment,
      existingDivisionStandard
    );

    expect(result.directiveId).toBeDefined();
    expect(result.directiveId).toMatch(/^dir_/);

    expect(result.status).toBe('issued');
    expect(result.issuedAt).toBe('2024-01-15T09:00:00Z');

    expect(result.targetDivisionCode).toBe('DIV_COST_ESTIMATE');
    expect(result.targetDivisionName).toBe('原価管理部署');

    expect(result.auditorId).toBe('aud_new_0042');
    expect(result.auditorName).toBe('新人査定員_太郎');
    expect(result.auditorLevel).toBe('junior');
    expect(result.supervisorId).toBe('aud_exp_0001');
    expect(result.deploymentDate).toBe('2024-01-15T09:00:00Z');

    expect(result.standardVersion).toBe('v2.3');
    expect(result.standardizedDate).toBe('2023-12-01T00:00:00Z');

    expect(result.judgmentCriteria).toHaveLength(3);
    expect(result.judgmentCriteria[0].categoryCode).toBe('CAT_MATERIAL_COST');
    expect(result.judgmentCriteria[0].allowableDeviation).toBe(5.0);
    expect(result.judgmentCriteria[0].lowerBound).toBe(95.0);
    expect(result.judgmentCriteria[0].upperBound).toBe(105.0);
    expect(result.judgmentCriteria[0].unitPrice).toBe(10000);

    expect(result.judgmentCriteria[1].categoryCode).toBe('CAT_LABOR_COST');
    expect(result.judgmentCriteria[1].allowableDeviation).toBe(7.0);
    expect(result.judgmentCriteria[1].lowerBound).toBe(93.0);
    expect(result.judgmentCriteria[1].upperBound).toBe(107.0);
    expect(result.judgmentCriteria[1].unitPrice).toBe(8000);

    expect(result.judgmentCriteria[2].categoryCode).toBe('CAT_EQUIPMENT_COST');
    expect(result.judgmentCriteria[2].allowableDeviation).toBe(10.0);
    expect(result.judgmentCriteria[2].lowerBound).toBe(90.0);
    expect(result.judgmentCriteria[2].upperBound).toBe(110.0);
    expect(result.judgmentCriteria[2].unitPrice).toBe(5000);

    expect(result.notificationChannels).toContain('email');
    expect(result.notificationChannels).toContain('dashboard');
    expect(result.notificationChannels).toContain('log');

    expect(result.acknowledgementRequired).toBe(true);
    expect(result.acknowledgementDeadline).toBe('2024-01-19T18:00:00Z');

    expect(result.directiveTitle).toBe('新人査定員配置に伴う判定基準統一指示');
    expect(result.directiveContent).toContain('DIV_COST_ESTIMATE');
    expect(result.directiveContent).toContain('新人査定員_太郎');
    expect(result.directiveContent).toContain('v2.3');

    expect(result.isAutoIssued).toBe(true);
    expect(result.triggerEvent).toBe('junior_auditor_deployment');
  });
});