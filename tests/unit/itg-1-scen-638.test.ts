import { detectSalesDataAnomalies } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能', () => {
  // SCEN-638: [edge] 営業データ品質異常検出・補正指示生成機能 - 複数の異常が同一レコードに存在する場合、すべての異常が検出され個別の補正指示が生成される
  test('should detect all anomalies in a single record and generate individual correction instructions without duplication', () => {
    // Prepare test data with multiple anomalies in a single record
    // Anomalies: customer_name is empty, email_address format is invalid, phone_number is empty, amount is negative
    const anomalousRecord = {
      id: 'REC001',
      customer_name: '', // Anomaly 1: Required field is empty
      email_address: 'invalid-email-format', // Anomaly 2: Invalid email format
      phone_number: '', // Anomaly 3: Required field is empty
      amount: -5000, // Anomaly 4: Negative amount (invalid range)
      transaction_date: '2024-01-15',
      service_type: 'consulting',
    };

    // Execute anomaly detection
    const result = detectSalesDataAnomalies([anomalousRecord]);

    // Verify that exactly 4 anomalies are detected
    expect(result.anomalyCount).toBe(4);

    // Verify that the anomalies array contains all detected anomalies
    expect(result.anomalies).toHaveLength(4);

    // Verify that each anomaly has a unique field and correction instruction
    const anomalyFieldSet = new Set(result.anomalies.map((a) => a.field));
    expect(anomalyFieldSet.size).toBe(4); // No duplicate fields

    // Verify correction instructions are generated for each anomaly
    expect(result.correctionInstructions).toHaveLength(4);

    // Verify that correction instructions do not contain duplicates
    const instructionSet = new Set(result.correctionInstructions.map((ci) => ci.field));
    expect(instructionSet.size).toBe(4); // No duplicate instructions

    // Verify each anomaly is correctly detected and mapped
    const customerNameAnomaly = result.anomalies.find(
      (a) => a.field === 'customer_name'
    );
    expect(customerNameAnomaly).toBeDefined();
    expect(customerNameAnomaly?.type).toBe('missing_required_field');
    expect(customerNameAnomaly?.recordId).toBe('REC001');

    const emailAnomaly = result.anomalies.find((a) => a.field === 'email_address');
    expect(emailAnomaly).toBeDefined();
    expect(emailAnomaly?.type).toBe('invalid_format');
    expect(emailAnomaly?.value).toBe('invalid-email-format');

    const phoneAnomaly = result.anomalies.find((a) => a.field === 'phone_number');
    expect(phoneAnomaly).toBeDefined();
    expect(phoneAnomaly?.type).toBe('missing_required_field');

    const amountAnomaly = result.anomalies.find((a) => a.field === 'amount');
    expect(amountAnomaly).toBeDefined();
    expect(amountAnomaly?.type).toBe('out_of_range');
    expect(amountAnomaly?.value).toBe(-5000);

    // Verify correction instruction for customer_name
    const customerNameInstruction = result.correctionInstructions.find(
      (ci) => ci.field === 'customer_name'
    );
    expect(customerNameInstruction).toBeDefined();
    expect(customerNameInstruction?.instruction).toContain('顧客名は必須項目');
    expect(customerNameInstruction?.recordId).toBe('REC001');

    // Verify correction instruction for email_address
    const emailInstruction = result.correctionInstructions.find(
      (ci) => ci.field === 'email_address'
    );
    expect(emailInstruction).toBeDefined();
    expect(emailInstruction?.instruction).toContain('メールアドレスは正しい形式で入力');

    // Verify correction instruction for phone_number
    const phoneInstruction = result.correctionInstructions.find(
      (ci) => ci.field === 'phone_number'
    );
    expect(phoneInstruction).toBeDefined();
    expect(phoneInstruction?.instruction).toContain('電話番号は必須項目');

    // Verify correction instruction for amount
    const amountInstruction = result.correctionInstructions.find(
      (ci) => ci.field === 'amount'
    );
    expect(amountInstruction).toBeDefined();
    expect(amountInstruction?.instruction).toContain('金額は正の値で入力');
    expect(amountInstruction?.allowedRange).toEqual({ min: 0, max: null });

    // Verify all field mappings are accurate
    result.correctionInstructions.forEach((instruction) => {
      expect(instruction.recordId).toBe('REC001');
      expect(instruction.field).toBeTruthy();
      expect(instruction.instruction).toBeTruthy();
    });

    // Verify no anomaly is duplicated in the result
    const allAnomalyIds = result.anomalies.map((a) => `${a.recordId}_${a.field}`);
    const uniqueAnomalyIds = new Set(allAnomalyIds);
    expect(uniqueAnomalyIds.size).toBe(allAnomalyIds.length);
  });
});