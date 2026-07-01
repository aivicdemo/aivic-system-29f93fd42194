import { describe, test, expect, beforeEach } from '@jest/globals';
import { validateAndProcessMetadata } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目メタデータ管理機能 - 未定義メタデータの処理', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-612: [error] 営業データ項目メタデータ管理 - 未定義のメタデータ項目で処理がスキップまたはエラーとなる
  test('未定義のメタデータ項目を含むデータセット処理時にエラーハンドリングが実行され、エラーログが記録される', () => {
    const metadataDefinitions = [
      {
        item_id: 'apo_count',
        item_name: 'アポ数',
        unit: '件',
        data_type: 'integer',
        calculation_logic: 'COUNT(contact_date)',
        report_mapping: 'report_metric_apo',
      },
      {
        item_id: 'contract_count',
        item_name: '成約数',
        unit: '件',
        data_type: 'integer',
        calculation_logic: 'COUNT(contract_date)',
        report_mapping: 'report_metric_contract',
      },
    ];

    const datasetWithUndefinedMetadata = [
      {
        item_id: 'apo_count',
        value: 5,
      },
      {
        item_id: 'undefined_metric',
        value: 10,
      },
      {
        item_id: 'contract_count',
        value: 3,
      },
    ];

    const result = validateAndProcessMetadata({
      definitions: metadataDefinitions,
      dataset: datasetWithUndefinedMetadata,
      error_handling_mode: 'skip_and_log',
    });

    expect(result.status).toBe('partial_success');
    expect(result.processed_count).toBe(2);
    expect(result.skipped_count).toBe(1);
    expect(result.processed_items).toEqual([
      {
        item_id: 'apo_count',
        item_name: 'アポ数',
        value: 5,
        status: 'processed',
      },
      {
        item_id: 'contract_count',
        item_name: '成約数',
        value: 3,
        status: 'processed',
      },
    ]);
    expect(result.error_logs).toHaveLength(1);
    expect(result.error_logs[0]).toMatchObject({
      item_id: 'undefined_metric',
      error_type: 'undefined_metadata',
      message: expect.stringMatching(/undefined_metric/),
      timestamp: expect.any(String),
    });
    expect(result.skipped_items).toEqual([
      {
        item_id: 'undefined_metric',
        value: 10,
        reason: 'メタデータ定義なし',
      },
    ]);
  });

  test('未定義のメタデータ項目を含むデータセット処理時にエラーモードで処理を中断し、適切なエラーメッセージが返される', () => {
    const metadataDefinitions = [
      {
        item_id: 'apo_count',
        item_name: 'アポ数',
        unit: '件',
        data_type: 'integer',
        calculation_logic: 'COUNT(contact_date)',
        report_mapping: 'report_metric_apo',
      },
    ];

    const datasetWithUndefinedMetadata = [
      {
        item_id: 'apo_count',
        value: 5,
      },
      {
        item_id: 'unknown_field',
        value: 999,
      },
    ];

    expect(() =>
      validateAndProcessMetadata({
        definitions: metadataDefinitions,
        dataset: datasetWithUndefinedMetadata,
        error_handling_mode: 'strict',
      }),
    ).toThrow(/unknown_field/);
  });

  test('すべてのメタデータ項目が定義済みの場合、正常に処理が完了し、全件がprocessed状態で返される', () => {
    const metadataDefinitions = [
      {
        item_id: 'apo_count',
        item_name: 'アポ数',
        unit: '件',
        data_type: 'integer',
        calculation_logic: 'COUNT(contact_date)',
        report_mapping: 'report_metric_apo',
      },
      {
        item_id: 'contract_count',
        item_name: '成約数',
        unit: '件',
        data_type: 'integer',
        calculation_logic: 'COUNT(contract_date)',
        report_mapping: 'report_metric_contract',
      },
    ];

    const dataset = [
      {
        item_id: 'apo_count',
        value: 5,
      },
      {
        item_id: 'contract_count',
        value: 3,
      },
    ];

    const result = validateAndProcessMetadata({
      definitions: metadataDefinitions,
      dataset: dataset,
      error_handling_mode: 'skip_and_log',
    });

    expect(result.status).toBe('success');
    expect(result.processed_count).toBe(2);
    expect(result.skipped_count).toBe(0);
    expect(result.error_logs).toHaveLength(0);
    expect(result.processed_items).toHaveLength(2);
    expect(result.processed_items[0].status).toBe('processed');
    expect(result.processed_items[1].status).toBe('processed');
  });

  test('複数の未定義メタデータ項目を含む場合、各々に対してエラーログが個別に記録される', () => {
    const metadataDefinitions = [
      {
        item_id: 'apo_count',
        item_name: 'アポ数',
        unit: '件',
        data_type: 'integer',
        calculation_logic: 'COUNT(contact_date)',
        report_mapping: 'report_metric_apo',
      },
    ];

    const datasetWithMultipleUndefined = [
      {
        item_id: 'apo_count',
        value: 5,
      },
      {
        item_id: 'undefined_field_1',
        value: 10,
      },
      {
        item_id: 'undefined_field_2',
        value: 20,
      },
    ];

    const result = validateAndProcessMetadata({
      definitions: metadataDefinitions,
      dataset: datasetWithMultipleUndefined,
      error_handling_mode: 'skip_and_log',
    });

    expect(result.status).toBe('partial_success');
    expect(result.processed_count).toBe(1);
    expect(result.skipped_count).toBe(2);
    expect(result.error_logs).toHaveLength(2);
    expect(result.error_logs[0].item_id).toBe('undefined_field_1');
    expect(result.error_logs[1].item_id).toBe('undefined_field_2');
    expect(result.error_logs.every((log) => log.error_type === 'undefined_metadata')).toBe(true);
  });

  test('未定義メタデータの処理結果レポートに件数サマリーと詳細内訳が含まれる', () => {
    const metadataDefinitions = [
      {
        item_id: 'apo_count',
        item_name: 'アポ数',
        unit: '件',
        data_type: 'integer',
        calculation_logic: 'COUNT(contact_date)',
        report_mapping: 'report_metric_apo',
      },
      {
        item_id: 'contract_count',
        item_name: '成約数',
        unit: '件',
        data_type: 'integer',
        calculation_logic: 'COUNT(contract_date)',
        report_mapping: 'report_metric_contract',
      },
    ];

    const dataset = [
      {
        item_id: 'apo_count',
        value: 5,
      },
      {
        item_id: 'undefined_item_1',
        value: 15,
      },
      {
        item_id: 'contract_count',
        value: 3,
      },
      {
        item_id: 'undefined_item_2',
        value: 8,
      },
    ];

    const result = validateAndProcessMetadata({
      definitions: metadataDefinitions,
      dataset: dataset,
      error_handling_mode: 'skip_and_log',
    });

    expect(result.status).toBe('partial_success');
    expect(result.total_count).toBe(4);
    expect(result.processed_count).toBe(2);
    expect(result.skipped_count).toBe(2);
    expect(result.success_rate).toBe(50);
    expect(result.summary).toMatchObject({
      total_records: 4,
      successfully_processed: 2,
      skipped_due_to_undefined_metadata: 2,
      error_count: 2,
    });
  });
});