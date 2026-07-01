import { describe, test, expect } from '@jest/globals';
import { validateDataCompatibility } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目のメタデータ管理機能', () => {
  test('SCEN-1384: 営業システムとCRM間データ互換性検証機能 - データ項目・形式互換性判定', () => {
    // 営業システムのテストデータセット：必須項目を含む
    const salesSystemDataset = {
      items: [
        {
          field_id: 'SALES_001',
          field_name: '顧客名',
          data_type: 'string',
          max_length: 100,
          required: true,
          format: 'text'
        },
        {
          field_id: 'SALES_002',
          field_name: 'メールアドレス',
          data_type: 'string',
          max_length: 255,
          required: true,
          format: 'email'
        },
        {
          field_id: 'SALES_003',
          field_name: '電話番号',
          data_type: 'string',
          max_length: 20,
          required: true,
          format: 'phone'
        },
        {
          field_id: 'SALES_004',
          field_name: '住所',
          data_type: 'string',
          max_length: 500,
          required: true,
          format: 'text'
        },
        {
          field_id: 'SALES_005',
          field_name: 'アポ数',
          data_type: 'integer',
          min_value: 0,
          max_value: 999,
          required: false,
          format: 'numeric'
        },
        {
          field_id: 'SALES_006',
          field_name: '成約数',
          data_type: 'integer',
          min_value: 0,
          max_value: 999,
          required: false,
          format: 'numeric'
        }
      ]
    };

    // CRMのテストデータセット：異なる形式で定義
    const crmDataset = {
      items: [
        {
          crm_field_id: 'CRM_001',
          crm_field_name: 'CustomerName',
          crm_data_type: 'varchar',
          crm_max_length: 100,
          crm_required: true,
          crm_format: 'string'
        },
        {
          crm_field_id: 'CRM_002',
          crm_field_name: 'Email',
          crm_data_type: 'varchar',
          crm_max_length: 255,
          crm_required: true,
          crm_format: 'email_address'
        },
        {
          crm_field_id: 'CRM_003',
          crm_field_name: 'Phone',
          crm_data_type: 'varchar',
          crm_max_length: 20,
          crm_required: true,
          crm_format: 'phone_number'
        },
        {
          crm_field_id: 'CRM_004',
          crm_field_name: 'Address',
          crm_data_type: 'text',
          crm_max_length: 500,
          crm_required: true,
          crm_format: 'address_text'
        },
        {
          crm_field_id: 'CRM_005',
          crm_field_name: 'AppointmentCount',
          crm_data_type: 'int',
          crm_min_value: 0,
          crm_max_value: 999,
          crm_required: false,
          crm_format: 'integer'
        },
        {
          crm_field_id: 'CRM_006',
          crm_field_name: 'ContractCount',
          crm_data_type: 'int',
          crm_min_value: 0,
          crm_max_value: 999,
          crm_required: false,
          crm_format: 'integer'
        }
      ]
    };

    // マッピング仕様書定義
    const mappingSpecification = {
      mappings: [
        {
          sales_field_id: 'SALES_001',
          crm_field_id: 'CRM_001',
          required_match: true,
          compatible_types: ['string', 'varchar'],
          format_compatible: true
        },
        {
          sales_field_id: 'SALES_002',
          crm_field_id: 'CRM_002',
          required_match: true,
          compatible_types: ['string', 'varchar'],
          format_compatible: true
        },
        {
          sales_field_id: 'SALES_003',
          crm_field_id: 'CRM_003',
          required_match: true,
          compatible_types: ['string', 'varchar'],
          format_compatible: true
        },
        {
          sales_field_id: 'SALES_004',
          crm_field_id: 'CRM_004',
          required_match: true,
          compatible_types: ['string', 'text'],
          format_compatible: true
        },
        {
          sales_field_id: 'SALES_005',
          crm_field_id: 'CRM_005',
          required_match: false,
          compatible_types: ['integer', 'int'],
          format_compatible: true
        },
        {
          sales_field_id: 'SALES_006',
          crm_field_id: 'CRM_006',
          required_match: false,
          compatible_types: ['integer', 'int'],
          format_compatible: true
        }
      ]
    };

    // 互換性検証関数を実行
    const compatibilityReport = validateDataCompatibility({
      sales_dataset: salesSystemDataset,
      crm_dataset: crmDataset,
      specification: mappingSpecification
    });

    // ①全ての必須データ項目がマッピングされていることを確認
    expect(compatibilityReport.total_mandatory_fields).toBe(4);
    expect(compatibilityReport.mapped_mandatory_fields).toBe(4);
    expect(compatibilityReport.mandatory_mapping_coverage).toBe(100);

    // ②データ形式の相違が正確に検出・報告されていることを確認
    expect(compatibilityReport.format_discrepancies).toEqual([
      {
        mapping_index: 1,
        sales_format: 'email',
        crm_format: 'email_address',
        discrepancy_type: 'format_name_difference',
        severity: 'low',
        resolvable: true
      },
      {
        mapping_index: 2,
        sales_format: 'phone',
        crm_format: 'phone_number',
        discrepancy_type: 'format_name_difference',
        severity: 'low',
        resolvable: true
      },
      {
        mapping_index: 3,
        sales_format: 'text',
        crm_format: 'address_text',
        discrepancy_type: 'format_name_difference',
        severity: 'low',
        resolvable: true
      }
    ]);

    // ③互換性判定結果が仕様書の定義に従い正確に判定されていることを確認
    expect(compatibilityReport.compatibility_judgments).toEqual([
      {
        mapping_index: 0,
        sales_field_id: 'SALES_001',
        crm_field_id: 'CRM_001',
        compatibility_status: 'compatible',
        type_match: true,
        requirement_match: true,
        format_match: true
      },
      {
        mapping_index: 1,
        sales_field_id: 'SALES_002',
        crm_field_id: 'CRM_002',
        compatibility_status: 'compatible',
        type_match: true,
        requirement_match: true,
        format_match: true
      },
      {
        mapping_index: 2,
        sales_field_id: 'SALES_003',
        crm_field_id: 'CRM_003',
        compatibility_status: 'compatible',
        type_match: true,
        requirement_match: true,
        format_match: true
      },
      {
        mapping_index: 3,
        sales_field_id: 'SALES_004',
        crm_field_id: 'CRM_004',
        compatibility_status: 'compatible',
        type_match: true,
        requirement_match: true,
        format_match: true
      },
      {
        mapping_index: 4,
        sales_field_id: 'SALES_005',
        crm_field_id: 'CRM_005',
        compatibility_status: 'compatible',
        type_match: true,
        requirement_match: true,
        format_match: true
      },
      {
        mapping_index: 5,
        sales_field_id: 'SALES_006',
        crm_field_id: 'CRM_006',
        compatibility_status: 'compatible',
        type_match: true,
        requirement_match: true,
        format_match: true
      }
    ]);

    // ④検証結果レポートに詳細な互換性分析情報が含まれていることを確認
    expect(compatibilityReport.report_metadata).toEqual({
      validation_timestamp: '2024-01-15T11:00:00Z',
      total_mappings: 6,
      compatible_mappings: 6,
      incompatible_mappings: 0,
      compatibility_percentage: 100,
      specification_version: '1.0',
      analysis_status: 'completed'
    });

    expect(compatibilityReport.mapping_details).toHaveLength(6);
    expect(compatibilityReport.mapping_details.every(
      (detail: any) => detail.mapping_status === 'verified'
    )).toBe(true);

    // 仕様書で定義された全てのデータ項目について互換性判定が実施されたことを確認
    expect(compatibilityReport.specification_compliance).toEqual({
      all_spec_mappings_validated: true,
      validated_mapping_count: 6,
      expected_mapping_count: 6,
      compliance_ratio: 100,
      unvalidated_spec_items: []
    });

    // 総合判定：互換性あり
    expect(compatibilityReport.overall_compatibility_verdict).toBe('compatible');
    expect(compatibilityReport.can_proceed_with_import).toBe(true);
  });
});