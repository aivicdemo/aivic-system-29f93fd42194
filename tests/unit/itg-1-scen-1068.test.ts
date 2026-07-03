import { evaluateNewStaffCompetency } from '../../src/logic/it-1-2-1';

describe('新入スタッフ到達度評価機能', () => {
  test('SCEN-1068: 請求書作成・営業報告書集計・契約書管理の3業務すべてが合格基準を満たしている場合に合格判定される', () => {
    const staff_id = 'STAFF_001';
    const evaluation_date = new Date('2024-12-15T09:00:00Z');
    const pass_threshold = 70;

    const invoice_creation_score = 85;
    const sales_report_aggregation_score = 80;
    const contract_management_score = 75;

    const evaluation_input = {
      staff_id: staff_id,
      evaluation_date: evaluation_date,
      invoice_creation_score: invoice_creation_score,
      sales_report_aggregation_score: sales_report_aggregation_score,
      contract_management_score: contract_management_score,
      pass_threshold: pass_threshold,
    };

    const result = evaluateNewStaffCompetency(evaluation_input);

    expect(result.overall_judgment).toBe('合格');
    expect(result.staff_id).toBe(staff_id);
    expect(result.invoice_creation_judgment).toBe('合格');
    expect(result.sales_report_aggregation_judgment).toBe('合格');
    expect(result.contract_management_judgment).toBe('合格');
    expect(result.invoice_creation_score).toBe(invoice_creation_score);
    expect(result.sales_report_aggregation_score).toBe(sales_report_aggregation_score);
    expect(result.contract_management_score).toBe(contract_management_score);
    expect(result.evaluation_date).toEqual(evaluation_date);
    expect(result.pass_threshold).toBe(pass_threshold);

    const all_pass = [
      invoice_creation_score >= pass_threshold,
      sales_report_aggregation_score >= pass_threshold,
      contract_management_score >= pass_threshold,
    ].every((v) => v === true);

    expect(all_pass).toBe(true);
  });

  test('SCEN-1068-ERR: いずれかの業務スコアが合格基準以下の場合に不合格判定される', () => {
    const staff_id = 'STAFF_002';
    const evaluation_date = new Date('2024-12-15T10:00:00Z');
    const pass_threshold = 70;

    const invoice_creation_score = 65;
    const sales_report_aggregation_score = 80;
    const contract_management_score = 75;

    const evaluation_input = {
      staff_id: staff_id,
      evaluation_date: evaluation_date,
      invoice_creation_score: invoice_creation_score,
      sales_report_aggregation_score: sales_report_aggregation_score,
      contract_management_score: contract_management_score,
      pass_threshold: pass_threshold,
    };

    const result = evaluateNewStaffCompetency(evaluation_input);

    expect(result.overall_judgment).toBe('不合格');
    expect(result.invoice_creation_judgment).toBe('不合格');
    expect(result.sales_report_aggregation_judgment).toBe('合格');
    expect(result.contract_management_judgment).toBe('合格');
  });

  test('SCEN-1068-ERR: 複数業務が合格基準以下の場合に不合格判定される', () => {
    const staff_id = 'STAFF_003';
    const evaluation_date = new Date('2024-12-15T11:00:00Z');
    const pass_threshold = 70;

    const invoice_creation_score = 60;
    const sales_report_aggregation_score = 65;
    const contract_management_score = 75;

    const evaluation_input = {
      staff_id: staff_id,
      evaluation_date: evaluation_date,
      invoice_creation_score: invoice_creation_score,
      sales_report_aggregation_score: sales_report_aggregation_score,
      contract_management_score: contract_management_score,
      pass_threshold: pass_threshold,
    };

    const result = evaluateNewStaffCompetency(evaluation_input);

    expect(result.overall_judgment).toBe('不合格');
    expect(result.invoice_creation_judgment).toBe('不合格');
    expect(result.sales_report_aggregation_judgment).toBe('不合格');
    expect(result.contract_management_judgment).toBe('合格');
  });

  test('SCEN-1068-ERR: すべての業務が合格基準以下の場合に不合格判定される', () => {
    const staff_id = 'STAFF_004';
    const evaluation_date = new Date('2024-12-15T12:00:00Z');
    const pass_threshold = 70;

    const invoice_creation_score = 50;
    const sales_report_aggregation_score = 55;
    const contract_management_score = 60;

    const evaluation_input = {
      staff_id: staff_id,
      evaluation_date: evaluation_date,
      invoice_creation_score: invoice_creation_score,
      sales_report_aggregation_score: sales_report_aggregation_score,
      contract_management_score: contract_management_score,
      pass_threshold: pass_threshold,
    };

    const result = evaluateNewStaffCompetency(evaluation_input);

    expect(result.overall_judgment).toBe('不合格');
    expect(result.invoice_creation_judgment).toBe('不合格');
    expect(result.sales_report_aggregation_judgment).toBe('不合格');
    expect(result.contract_management_judgment).toBe('不合格');
  });

  test('SCEN-1068-BOUNDARY: 合格基準値と同じスコアの場合に合格判定される', () => {
    const staff_id = 'STAFF_005';
    const evaluation_date = new Date('2024-12-15T13:00:00Z');
    const pass_threshold = 70;

    const invoice_creation_score = 70;
    const sales_report_aggregation_score = 70;
    const contract_management_score = 70;

    const evaluation_input = {
      staff_id: staff_id,
      evaluation_date: evaluation_date,
      invoice_creation_score: invoice_creation_score,
      sales_report_aggregation_score: sales_report_aggregation_score,
      contract_management_score: contract_management_score,
      pass_threshold: pass_threshold,
    };

    const result = evaluateNewStaffCompetency(evaluation_input);

    expect(result.overall_judgment).toBe('合格');
    expect(result.invoice_creation_judgment).toBe('合格');
    expect(result.sales_report_aggregation_judgment).toBe('合格');
    expect(result.contract_management_judgment).toBe('合格');
  });

  test('SCEN-1068-ERR: 合格基準値より1点低いスコアの場合に不合格判定される', () => {
    const staff_id = 'STAFF_006';
    const evaluation_date = new Date('2024-12-15T14:00:00Z');
    const pass_threshold = 70;

    const invoice_creation_score = 69;
    const sales_report_aggregation_score = 80;
    const contract_management_score = 75;

    const evaluation_input = {
      staff_id: staff_id,
      evaluation_date: evaluation_date,
      invoice_creation_score: invoice_creation_score,
      sales_report_aggregation_score: sales_report_aggregation_score,
      contract_management_score: contract_management_score,
      pass_threshold: pass_threshold,
    };

    const result = evaluateNewStaffCompetency(evaluation_input);

    expect(result.overall_judgment).toBe('不合格');
    expect(result.invoice_creation_judgment).toBe('不合格');
  });

  test('SCEN-1068-ERR: staff_id が空の場合にエラーを発生させる', () => {
    const evaluation_input = {
      staff_id: '',
      evaluation_date: new Date('2024-12-15T15:00:00Z'),
      invoice_creation_score: 85,
      sales_report_aggregation_score: 80,
      contract_management_score: 75,
      pass_threshold: 70,
    };

    expect(() => evaluateNewStaffCompetency(evaluation_input)).toThrow(/スタッフID/);
  });

  test('SCEN-1068-ERR: evaluation_date が無効な場合にエラーを発生させる', () => {
    const evaluation_input = {
      staff_id: 'STAFF_007',
      evaluation_date: new Date('invalid'),
      invoice_creation_score: 85,
      sales_report_aggregation_score: 80,
      contract_management_score: 75,
      pass_threshold: 70,
    };

    expect(() => evaluateNewStaffCompetency(evaluation_input)).toThrow(/評価日時/);
  });

  test('SCEN-1068-ERR: invoice_creation_score が負の数の場合にエラーを発生させる', () => {
    const evaluation_input = {
      staff_id: 'STAFF_008',
      evaluation_date: new Date('2024-12-15T16:00:00Z'),
      invoice_creation_score: -10,
      sales_report_aggregation_score: 80,
      contract_management_score: 75,
      pass_threshold: 70,
    };

    expect(() => evaluateNewStaffCompetency(evaluation_input)).toThrow(/請求書作成スコア/);
  });

  test('SCEN-1068-ERR: sales_report_aggregation_score が100を超える場合にエラーを発生させる', () => {
    const evaluation_input = {
      staff_id: 'STAFF_009',
      evaluation_date: new Date('2024-12-15T17:00:00Z'),
      invoice_creation_score: 85,
      sales_report_aggregation_score: 105,
      contract_management_score: 75,
      pass_threshold: 70,
    };

    expect(() => evaluateNewStaffCompetency(evaluation_input)).toThrow(/営業報告書集計スコア/);
  });

  test('SCEN-1068-ERR: contract_management_score が100を超える場合にエラーを発生させる', () => {
    const evaluation_input = {
      staff_id: 'STAFF_010',
      evaluation_date: new Date('2024-12-15T18:00:00Z'),
      invoice_creation_score: 85,
      sales_report_aggregation_score: 80,
      contract_management_score: 110,
      pass_threshold: 70,
    };

    expect(() => evaluateNewStaffCompetency(evaluation_input)).toThrow(/契約書管理スコア/);
  });

  test('SCEN-1068-ERR: pass_threshold が負の数の場合にエラーを発生させる', () => {
    const evaluation_input = {
      staff_id: 'STAFF_011',
      evaluation_date: new Date('2024-12-15T19:00:00Z'),
      invoice_creation_score: 85,
      sales_report_aggregation_score: 80,
      contract_management_score: 75,
      pass_threshold: -5,
    };

    expect(() => evaluateNewStaffCompetency(evaluation_input)).toThrow(/合格基準/);
  });
});