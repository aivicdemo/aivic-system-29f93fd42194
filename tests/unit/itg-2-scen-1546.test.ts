import { describe, test, expect } from '@jest/globals';
import { generateOperationManualV1 } from '../../src/logic/it-6-2-1-1';

describe('it-6-2-1-1: 査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化', () => {
  // SCEN-1546
  test('should generate operation manual with regional update criteria correctly when past project data contains regional differences', () => {
    const input_past_project_data = [
      {
        project_id: 'proj_hokkaido_001',
        region: 'hokkaido',
        construction_type: 'excavation',
        unit_price: 8500,
        quantity: 100,
        total_amount: 850000,
        project_date: '2024-01-15',
      },
      {
        project_id: 'proj_hokkaido_002',
        region: 'hokkaido',
        construction_type: 'excavation',
        unit_price: 8700,
        quantity: 120,
        total_amount: 1044000,
        project_date: '2024-02-10',
      },
      {
        project_id: 'proj_kanto_001',
        region: 'kanto',
        construction_type: 'excavation',
        unit_price: 7800,
        quantity: 150,
        total_amount: 1170000,
        project_date: '2024-01-20',
      },
      {
        project_id: 'proj_kanto_002',
        region: 'kanto',
        construction_type: 'excavation',
        unit_price: 7900,
        quantity: 160,
        total_amount: 1264000,
        project_date: '2024-02-15',
      },
      {
        project_id: 'proj_kansai_001',
        region: 'kansai',
        construction_type: 'excavation',
        unit_price: 7200,
        quantity: 140,
        total_amount: 1008000,
        project_date: '2024-01-25',
      },
      {
        project_id: 'proj_kansai_002',
        region: 'kansai',
        construction_type: 'excavation',
        unit_price: 7400,
        quantity: 135,
        total_amount: 999000,
        project_date: '2024-02-20',
      },
      {
        project_id: 'proj_kyushu_001',
        region: 'kyushu',
        construction_type: 'excavation',
        unit_price: 6900,
        quantity: 130,
        total_amount: 897000,
        project_date: '2024-01-18',
      },
      {
        project_id: 'proj_kyushu_002',
        region: 'kyushu',
        construction_type: 'excavation',
        unit_price: 7100,
        quantity: 125,
        total_amount: 887500,
        project_date: '2024-02-12',
      },
    ];

    const regional_standards = {
      hokkaido: {
        avg_unit_price: 8600,
        min_unit_price: 8500,
        max_unit_price: 8700,
        deviation_lower: 8170,
        deviation_upper: 9030,
      },
      kanto: {
        avg_unit_price: 7850,
        min_unit_price: 7800,
        max_unit_price: 7900,
        deviation_lower: 7457,
        deviation_upper: 8243,
      },
      kansai: {
        avg_unit_price: 7300,
        min_unit_price: 7200,
        max_unit_price: 7400,
        deviation_lower: 6935,
        deviation_upper: 7665,
      },
      kyushu: {
        avg_unit_price: 7000,
        min_unit_price: 6900,
        max_unit_price: 7100,
        deviation_lower: 6650,
        deviation_upper: 7350,
      },
    };

    const generated_manual = generateOperationManualV1({
      past_project_data: input_past_project_data,
      regional_standards: regional_standards,
      manual_version: 'v1.0',
      generation_timestamp: '2024-03-01T09:00:00Z',
    });

    // Section exists validation
    expect(generated_manual.sections).toBeDefined();
    expect(Array.isArray(generated_manual.sections)).toBe(true);

    const regional_section = generated_manual.sections.find(
      (sec: { section_title: string }) => sec.section_title === 'Regional Update Criteria'
    );
    expect(regional_section).toBeDefined();

    // Regional criteria content validation
    expect(regional_section.content).toBeDefined();
    expect(regional_section.content.regions).toBeDefined();
    expect(Array.isArray(regional_section.content.regions)).toBe(true);

    const hokkaido_criteria = regional_section.content.regions.find(
      (reg: { region_name: string }) => reg.region_name === 'hokkaido'
    );
    expect(hokkaido_criteria).toBeDefined();
    expect(hokkaido_criteria.average_unit_price).toBe(8600);
    expect(hokkaido_criteria.minimum_unit_price).toBe(8500);
    expect(hokkaido_criteria.maximum_unit_price).toBe(8700);
    expect(hokkaido_criteria.acceptable_range_lower).toBe(8170);
    expect(hokkaido_criteria.acceptable_range_upper).toBe(9030);

    const kanto_criteria = regional_section.content.regions.find(
      (reg: { region_name: string }) => reg.region_name === 'kanto'
    );
    expect(kanto_criteria).toBeDefined();
    expect(kanto_criteria.average_unit_price).toBe(7850);
    expect(kanto_criteria.minimum_unit_price).toBe(7800);
    expect(kanto_criteria.maximum_unit_price).toBe(7900);
    expect(kanto_criteria.acceptable_range_lower).toBe(7457);
    expect(kanto_criteria.acceptable_range_upper).toBe(8243);

    const kansai_criteria = regional_section.content.regions.find(
      (reg: { region_name: string }) => reg.region_name === 'kansai'
    );
    expect(kansai_criteria).toBeDefined();
    expect(kansai_criteria.average_unit_price).toBe(7300);
    expect(kansai_criteria.minimum_unit_price).toBe(7200);
    expect(kansai_criteria.maximum_unit_price).toBe(7400);
    expect(kansai_criteria.acceptable_range_lower).toBe(6935);
    expect(kansai_criteria.acceptable_range_upper).toBe(7665);

    const kyushu_criteria = regional_section.content.regions.find(
      (reg: { region_name: string }) => reg.region_name === 'kyushu'
    );
    expect(kyushu_criteria).toBeDefined();
    expect(kyushu_criteria.average_unit_price).toBe(7000);
    expect(kyushu_criteria.minimum_unit_price).toBe(6900);
    expect(kyushu_criteria.maximum_unit_price).toBe(7100);
    expect(kyushu_criteria.acceptable_range_lower).toBe(6650);
    expect(kyushu_criteria.acceptable_range_upper).toBe(7350);

    // Regional differences clarity validation
    expect(hokkaido_criteria.average_unit_price).toBeGreaterThan(kanto_criteria.average_unit_price);
    expect(kanto_criteria.average_unit_price).toBeGreaterThan(kansai_criteria.average_unit_price);
    expect(kansai_criteria.average_unit_price).toBeGreaterThan(kyushu_criteria.average_unit_price);

    // Differences text validation
    expect(regional_section.content.regional_differences).toBeDefined();
    expect(regional_section.content.regional_differences).toContain('hokkaido');
    expect(regional_section.content.regional_differences).toContain('kanto');
    expect(regional_section.content.regional_differences).toContain('kansai');
    expect(regional_section.content.regional_differences).toContain('kyushu');

    // Manual format and metadata validation
    expect(generated_manual.manual_title).toBe('Operation Manual v1.0');
    expect(generated_manual.version).toBe('v1.0');
    expect(generated_manual.generation_date).toBe('2024-03-01T09:00:00Z');
    expect(generated_manual.format_type).toBe('structured_json');
    expect(generated_manual.is_readable).toBe(true);
    expect(typeof generated_manual.total_sections).toBe('number');
    expect(generated_manual.total_sections).toBeGreaterThanOrEqual(1);
  });
});