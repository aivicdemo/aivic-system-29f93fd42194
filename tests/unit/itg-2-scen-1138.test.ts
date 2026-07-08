import { measureAccuracyAfterModelUpdate } from '../../src/logic/it-6-2-1-1';

describe('Model Update Accuracy Measurement - Production Environment Validation', () => {
  test('SCEN-1138: Reject accuracy measurement when production environment is inactive', async () => {
    // Arrange
    const inactiveProductionEnvironmentStatus = 'INACTIVE';
    const accuracyMeasurementRequest = {
      modelVersion: 'v2.1.0',
      testDatasetId: 'test-dataset-20240115',
      environmentStatus: inactiveProductionEnvironmentStatus,
      measurementType: 'POST_MODEL_UPDATE',
      timestamp: new Date('2024-01-15T11:00:00Z').toISOString(),
    };

    // Act & Assert
    await expect(async () => {
      await measureAccuracyAfterModelUpdate(accuracyMeasurementRequest);
    }).rejects.toThrow(/本番環境/);
  });
});