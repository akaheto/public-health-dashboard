// Statistical Alert Engine
// Detects statistically significant increases in health metrics

export interface AlertThreshold {
  datasetId: string;
  severity: "warning" | "critical";
  zScoreThreshold: number; // Number of standard deviations (typically 2.0)
  minTrendDays: number; // Minimum days of consecutive increase
  changePercentage?: number; // Minimum % increase from baseline
}

export interface DataPoint {
  date: string;
  value: number;
}

export interface AlertResult {
  datasetId: string;
  severity: "warning" | "critical";
  triggered: boolean;
  currentValue: number;
  baselineAverage: number;
  zScore: number;
  changePercent: number;
  trendDays: number;
  message: string;
  triggeredAt: string;
}

export class AlertEngine {
  /**
   * Calculate mean and standard deviation of values
   */
  static calculateStats(values: number[]): { mean: number; stdDev: number } {
    if (values.length === 0) {
      return { mean: 0, stdDev: 0 };
    }

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance =
      values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return { mean, stdDev };
  }

  /**
   * Calculate 7-day moving average
   */
  static calculateMovingAverage(dataPoints: DataPoint[], windowDays: number = 7): DataPoint[] {
    const result: DataPoint[] = [];

    for (let i = 0; i < dataPoints.length; i++) {
      const start = Math.max(0, i - windowDays + 1);
      const window = dataPoints.slice(start, i + 1);
      const average = window.reduce((sum, dp) => sum + dp.value, 0) / window.length;

      result.push({
        date: dataPoints[i].date,
        value: average,
      });
    }

    return result;
  }

  /**
   * Detect consecutive increases in trend
   */
  static detectTrendDays(dataPoints: DataPoint[]): number {
    if (dataPoints.length < 2) return 0;

    let trendDays = 1;
    for (let i = dataPoints.length - 2; i >= 0; i--) {
      if (dataPoints[i + 1].value > dataPoints[i].value) {
        trendDays++;
      } else {
        break;
      }
    }

    return trendDays;
  }

  /**
   * Calculate Z-score for a value
   */
  static calculateZScore(value: number, mean: number, stdDev: number): number {
    if (stdDev === 0) return 0;
    return (value - mean) / stdDev;
  }

  /**
   * Calculate percent change from baseline
   */
  static calculatePercentChange(current: number, baseline: number): number {
    if (baseline === 0) return 0;
    return ((current - baseline) / baseline) * 100;
  }

  /**
   * Check if alert should be triggered
   */
  static checkAlert(
    dataPoints: DataPoint[],
    threshold: AlertThreshold,
    baselineDays: number = 30
  ): AlertResult {
    const now = new Date();
    const result: AlertResult = {
      datasetId: threshold.datasetId,
      severity: threshold.severity,
      triggered: false,
      currentValue: 0,
      baselineAverage: 0,
      zScore: 0,
      changePercent: 0,
      trendDays: 0,
      message: "",
      triggeredAt: now.toISOString(),
    };

    if (dataPoints.length < 2) {
      result.message = "Insufficient data points for analysis";
      return result;
    }

    // Get recent data point
    const currentPoint = dataPoints[dataPoints.length - 1];
    result.currentValue = currentPoint.value;

    // Calculate baseline (last N days)
    const baselineStart = Math.max(0, dataPoints.length - baselineDays);
    const baselineData = dataPoints.slice(baselineStart, -1); // Exclude current point

    if (baselineData.length < 7) {
      result.message = "Insufficient baseline data (need at least 7 days)";
      return result;
    }

    // Calculate statistics
    const baselineValues = baselineData.map((dp) => dp.value);
    const { mean, stdDev } = this.calculateStats(baselineValues);
    result.baselineAverage = mean;

    // Calculate Z-score
    result.zScore = this.calculateZScore(currentPoint.value, mean, stdDev);

    // Calculate percent change
    result.changePercent = this.calculatePercentChange(currentPoint.value, mean);

    // Detect trend
    const recentData = dataPoints.slice(Math.max(0, dataPoints.length - 14));
    result.trendDays = this.detectTrendDays(recentData);

    // Check alert conditions
    const exceedsZScore = Math.abs(result.zScore) >= threshold.zScoreThreshold;
    const meetsTrendRequirement = result.trendDays >= threshold.minTrendDays;
    const meetsPercentChange = threshold.changePercentage
      ? result.changePercent >= threshold.changePercentage
      : true;
    const isIncreasing = result.currentValue > mean;

    result.triggered =
      exceedsZScore && meetsTrendRequirement && meetsPercentChange && isIncreasing;

    // Generate message
    if (result.triggered) {
      result.message =
        `${threshold.severity.toUpperCase()}: ${threshold.datasetId} ` +
        `increased ${result.changePercent.toFixed(1)}% ` +
        `(${result.trendDays} days of growth, z-score: ${result.zScore.toFixed(2)})`;
    } else {
      const reasons: string[] = [];
      if (!exceedsZScore) reasons.push(`z-score ${result.zScore.toFixed(2)} < ${threshold.zScoreThreshold}`);
      if (!meetsTrendRequirement) reasons.push(`trend ${result.trendDays}d < ${threshold.minTrendDays}d`);
      if (!meetsPercentChange) reasons.push(`change ${result.changePercent.toFixed(1)}% < ${threshold.changePercentage}%`);
      if (!isIncreasing) reasons.push("not increasing");

      result.message = `No alert: ${reasons.join(", ")}`;
    }

    return result;
  }

  /**
   * Process multiple datasets for alerts
   */
  static checkMultipleAlerts(
    datasetMap: Record<string, DataPoint[]>,
    thresholds: AlertThreshold[]
  ): AlertResult[] {
    const alerts: AlertResult[] = [];

    for (const threshold of thresholds) {
      const dataPoints = datasetMap[threshold.datasetId];
      if (!dataPoints || dataPoints.length === 0) {
        continue;
      }

      const alert = this.checkAlert(dataPoints, threshold);
      alerts.push(alert);
    }

    return alerts;
  }
}
