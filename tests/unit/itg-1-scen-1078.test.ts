import { describe, test, expect } from '@jest/globals';
import { extractAggregationRules } from '../../src/logic/it-1-2-1';

describe('営業データ集計標準手順書生成機能', () => {
  // SCEN-1078
  test('営業活動・成約データから顧客別・サービス別・期間別の集計単位と計算ロジックが抽出される', () => {
    const test_data = {
      sales_activities: [
        {
          activity_id: 'ACT001',
          customer_id: 'CUST_A',
          service_id: 'SRV_001',
          activity_date: '2024-01-15',
          appointment_count: 3,
          contact_type: 'phone'
        },
        {
          activity_id: 'ACT002',
          customer_id: 'CUST_A',
          service_id: 'SRV_001',
          activity_date: '2024-01-20',
          appointment_count: 2,
          contact_type: 'email'
        },
        {
          activity_id: 'ACT003',
          customer_id: 'CUST_B',
          service_id: 'SRV_001',
          activity_date: '2024-01-25',
          appointment_count: 5,
          contact_type: 'meeting'
        },
        {
          activity_id: 'ACT004',
          customer_id: 'CUST_A',
          service_id: 'SRV_002',
          activity_date: '2024-02-10',
          appointment_count: 1,
          contact_type: 'phone'
        },
        {
          activity_id: 'ACT005',
          customer_id: 'CUST_B',
          service_id: 'SRV_002',
          activity_date: '2024-02-15',
          appointment_count: 4,
          contact_type: 'email'
        }
      ],
      deals: [
        {
          deal_id: 'DEAL001',
          customer_id: 'CUST_A',
          service_id: 'SRV_001',
          deal_date: '2024-01-18',
          deal_amount: 100000
        },
        {
          deal_id: 'DEAL002',
          customer_id: 'CUST_A',
          service_id: 'SRV_001',
          deal_date: '2024-01-22',
          deal_amount: 150000
        },
        {
          deal_id: 'DEAL003',
          customer_id: 'CUST_B',
          service_id: 'SRV_001',
          deal_date: '2024-01-28',
          deal_amount: 200000
        },
        {
          deal_id: 'DEAL004',
          customer_id: 'CUST_A',
          service_id: 'SRV_002',
          deal_date: '2024-02-12',
          deal_amount: 75000
        },
        {
          deal_id: 'DEAL005',
          customer_id: 'CUST_B',
          service_id: 'SRV_002',
          deal_date: '2024-02-18',
          deal_amount: 120000
        }
      ],
      aggregation_units: ['customer', 'service', 'period']
    };

    const result = extractAggregationRules(test_data);

    expect(result).toEqual({
      customer_aggregations: [
        {
          customer_id: 'CUST_A',
          total_appointments: 6,
          total_deals: 3,
          total_deal_amount: 325000,
          period_breakdowns: [
            {
              period: '2024-01',
              appointments: 5,
              deals: 2,
              deal_amount: 250000
            },
            {
              period: '2024-02',
              appointments: 1,
              deals: 1,
              deal_amount: 75000
            }
          ]
        },
        {
          customer_id: 'CUST_B',
          total_appointments: 9,
          total_deals: 2,
          total_deal_amount: 320000,
          period_breakdowns: [
            {
              period: '2024-01',
              appointments: 5,
              deals: 1,
              deal_amount: 200000
            },
            {
              period: '2024-02',
              appointments: 4,
              deals: 1,
              deal_amount: 120000
            }
          ]
        }
      ],
      service_aggregations: [
        {
          service_id: 'SRV_001',
          total_appointments: 10,
          total_deals: 3,
          total_deal_amount: 450000,
          customer_count: 2,
          by_customer: [
            {
              customer_id: 'CUST_A',
              appointments: 5,
              deals: 2,
              deal_amount: 250000
            },
            {
              customer_id: 'CUST_B',
              appointments: 5,
              deals: 1,
              deal_amount: 200000
            }
          ]
        },
        {
          service_id: 'SRV_002',
          total_appointments: 5,
          total_deals: 2,
          total_deal_amount: 195000,
          customer_count: 2,
          by_customer: [
            {
              customer_id: 'CUST_A',
              appointments: 1,
              deals: 1,
              deal_amount: 75000
            },
            {
              customer_id: 'CUST_B',
              appointments: 4,
              deals: 1,
              deal_amount: 120000
            }
          ]
        }
      ],
      period_aggregations: [
        {
          period: '2024-01',
          total_appointments: 10,
          total_deals: 3,
          total_deal_amount: 450000,
          by_customer_service: [
            {
              customer_id: 'CUST_A',
              service_id: 'SRV_001',
              appointments: 5,
              deals: 2,
              deal_amount: 250000
            },
            {
              customer_id: 'CUST_B',
              service_id: 'SRV_001',
              appointments: 5,
              deals: 1,
              deal_amount: 200000
            }
          ]
        },
        {
          period: '2024-02',
          total_appointments: 5,
          total_deals: 2,
          total_deal_amount: 195000,
          by_customer_service: [
            {
              customer_id: 'CUST_A',
              service_id: 'SRV_002',
              appointments: 1,
              deals: 1,
              deal_amount: 75000
            },
            {
              customer_id: 'CUST_B',
              service_id: 'SRV_002',
              appointments: 4,
              deals: 1,
              deal_amount: 120000
            }
          ]
        }
      ],
      calculation_logic: {
        appointment_total: 'SUM(appointment_count)',
        deal_total: 'COUNT(deal_id)',
        deal_amount_total: 'SUM(deal_amount)',
        appointment_average: 'AVG(appointment_count)',
        deal_amount_average: 'AVG(deal_amount)'
      },
      aggregation_template: {
        structure: 'multi_level',
        primary_dimension: 'customer',
        secondary_dimension: 'service',
        tertiary_dimension: 'period',
        calculation_methods: ['sum', 'count', 'average']
      }
    });

    expect(result.customer_aggregations.length).toBe(2);
    expect(result.customer_aggregations[0].customer_id).toBe('CUST_A');
    expect(result.customer_aggregations[0].total_appointments).toBe(6);
    expect(result.customer_aggregations[0].total_deals).toBe(3);
    expect(result.customer_aggregations[0].total_deal_amount).toBe(325000);

    expect(result.customer_aggregations[1].customer_id).toBe('CUST_B');
    expect(result.customer_aggregations[1].total_appointments).toBe(9);
    expect(result.customer_aggregations[1].total_deals).toBe(2);
    expect(result.customer_aggregations[1].total_deal_amount).toBe(320000);

    expect(result.service_aggregations.length).toBe(2);
    expect(result.service_aggregations[0].service_id).toBe('SRV_001');
    expect(result.service_aggregations[0].total_appointments).toBe(10);
    expect(result.service_aggregations[0].total_deals).toBe(3);
    expect(result.service_aggregations[0].total_deal_amount).toBe(450000);
    expect(result.service_aggregations[0].customer_count).toBe(2);

    expect(result.service_aggregations[1].service_id).toBe('SRV_002');
    expect(result.service_aggregations[1].total_appointments).toBe(5);
    expect(result.service_aggregations[1].total_deals).toBe(2);
    expect(result.service_aggregations[1].total_deal_amount).toBe(195000);
    expect(result.service_aggregations[1].customer_count).toBe(2);

    expect(result.period_aggregations.length).toBe(2);
    expect(result.period_aggregations[0].period).toBe('2024-01');
    expect(result.period_aggregations[0].total_appointments).toBe(10);
    expect(result.period_aggregations[0].total_deals).toBe(3);
    expect(result.period_aggregations[0].total_deal_amount).toBe(450000);

    expect(result.period_aggregations[1].period).toBe('2024-02');
    expect(result.period_aggregations[1].total_appointments).toBe(5);
    expect(result.period_aggregations[1].total_deals).toBe(2);
    expect(result.period_aggregations[1].total_deal_amount).toBe(195000);

    expect(result.calculation_logic.appointment_total).toBe('SUM(appointment_count)');
    expect(result.calculation_logic.deal_total).toBe('COUNT(deal_id)');
    expect(result.calculation_logic.deal_amount_total).toBe('SUM(deal_amount)');
    expect(result.calculation_logic.appointment_average).toBe('AVG(appointment_count)');
    expect(result.calculation_logic.deal_amount_average).toBe('AVG(deal_amount)');

    expect(result.aggregation_template.structure).toBe('multi_level');
    expect(result.aggregation_template.primary_dimension).toBe('customer');
    expect(result.aggregation_template.secondary_dimension).toBe('service');
    expect(result.aggregation_template.tertiary_dimension).toBe('period');
    expect(result.aggregation_template.calculation_methods).toContain('sum');
    expect(result.aggregation_template.calculation_methods).toContain('count');
    expect(result.aggregation_template.calculation_methods).toContain('average');
  });
});