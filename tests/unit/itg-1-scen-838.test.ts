import { compareContractChanges } from '../../src/logic/it-1781935279444-2-1-1';

describe('Contract Change Comparison and Diff Visualization', () => {
  test('SCEN-838: Multiple contract items changed - all diffs displayed individually with visual distinction', () => {
    // Precondition: existing contract with multiple items to be changed
    const previous_contract = {
      contract_id: 'C001',
      contract_amount_yen: 1000000,
      delivery_deadline: '2024-03-31',
      delivery_scope: 'Scope_A'
    };

    const updated_contract = {
      contract_id: 'C001',
      contract_amount_yen: 1200000,
      delivery_deadline: '2024-04-30',
      delivery_scope: 'Scope_A,Scope_B'
    };

    // Execute: compare contract changes
    const result = compareContractChanges(previous_contract, updated_contract);

    // Assert: all three items have individual diffs displayed
    expect(result.diffs).toHaveLength(3);

    // Assert: contract amount diff is present and correct
    const amount_diff = result.diffs.find((d: any) => d.field_name === 'contract_amount_yen');
    expect(amount_diff).toBeDefined();
    expect(amount_diff.previous_value).toBe(1000000);
    expect(amount_diff.updated_value).toBe(1200000);
    expect(amount_diff.change_amount).toBe(200000);
    expect(amount_diff.visual_highlight_type).toBe('amount_change');

    // Assert: delivery deadline diff is present and correct
    const deadline_diff = result.diffs.find((d: any) => d.field_name === 'delivery_deadline');
    expect(deadline_diff).toBeDefined();
    expect(deadline_diff.previous_value).toBe('2024-03-31');
    expect(deadline_diff.updated_value).toBe('2024-04-30');
    expect(deadline_diff.days_extended).toBe(30);
    expect(deadline_diff.visual_highlight_type).toBe('date_change');

    // Assert: delivery scope diff is present and correct
    const scope_diff = result.diffs.find((d: any) => d.field_name === 'delivery_scope');
    expect(scope_diff).toBeDefined();
    expect(scope_diff.previous_value).toBe('Scope_A');
    expect(scope_diff.updated_value).toBe('Scope_A,Scope_B');
    expect(scope_diff.added_scopes).toEqual(['Scope_B']);
    expect(scope_diff.visual_highlight_type).toBe('scope_addition');

    // Assert: all diffs are visually distinguished
    expect(result.diffs.every((d: any) => d.visual_highlight_type)).toBe(true);

    // Assert: all diffs are viewable on single screen
    expect(result.single_screen_display).toBe(true);
    expect(result.display_format).toBe('tabular');

    // Assert: comparison result contains both previous and updated state
    expect(result.comparison_id).toMatch(/^COMP_/);
    expect(result.comparison_timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(result.total_changed_fields).toBe(3);
  });
});