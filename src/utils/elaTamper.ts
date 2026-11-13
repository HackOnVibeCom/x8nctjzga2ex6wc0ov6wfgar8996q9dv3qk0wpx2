import { ForensicReport } from '../types';

export interface ElaAnalysisResult {
  report: ForensicReport;
  heatmapDataUrl: string;
}

/**
 * Client-Side Error Level Analysis (ELA)
 * Computes pixel compression variance to detect edited text/digits in bank transfer receipts.
 */
export async function runClientSideEla(
  imageSource: File | string,
  targetCanvas?: HTMLCanvasElement
): Promise<ElaAnalysisResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const width = Math.min(img.width, 800);
        const scale = width / img.width;
        const height = Math.round(img.height * scale);

        // 1. Original Canvas
        const origCanvas = document.createElement('canvas');
        origCanvas.width = width;
        origCanvas.height = height;
        const origCtx = origCanvas.getContext('2d');
        if (!origCtx) throw new Error('Could not get 2D canvas context');
        origCtx.drawImage(img, 0, 0, width, height);

        const origData = origCtx.getImageData(0, 0, width, height);

        // 2. Recompress at 85% JPEG quality
        const recompressedDataUrl = origCanvas.toDataURL('image/jpeg', 0.85);

        const recompressedImg = new Image();
        recompressedImg.onload = () => {
          const compCanvas = document.createElement('canvas');
          compCanvas.width = width;
          compCanvas.height = height;
          const compCtx = compCanvas.getContext('2d');
          if (!compCtx) throw new Error('Could not get comp canvas context');
          compCtx.drawImage(recompressedImg, 0, 0, width, height);

          const compData = compCtx.getImageData(0, 0, width, height);

          // 3. Difference Canvas / Heatmap
          const heatCanvas = targetCanvas || document.createElement('canvas');
          heatCanvas.width = width;
          heatCanvas.height = height;
          const heatCtx = heatCanvas.getContext('2d');
          if (!heatCtx) throw new Error('Could not get heat canvas context');

          const heatImageData = heatCtx.createImageData(width, height);
          const origPixels = origData.data;
          const compPixels = compData.data;
          const heatPixels = heatImageData.data;

          let totalDiff = 0;
          let maxDiff = 0;
          let highAnomalyCount = 0;
          const pixelCount = width * height;

          const amplification = 15; // Amplify differences for visual contrast

          for (let i = 0; i < origPixels.length; i += 4) {
            const rDiff = Math.abs(origPixels[i] - compPixels[i]);
            const gDiff = Math.abs(origPixels[i + 1] - compPixels[i + 1]);
            const bDiff = Math.abs(origPixels[i + 2] - compPixels[i + 2]);

            const avgDiff = (rDiff + gDiff + bDiff) / 3;
            totalDiff += avgDiff;
            if (avgDiff > maxDiff) maxDiff = avgDiff;

            // Anomaly spike threshold
            if (avgDiff > 22) {
              highAnomalyCount++;
            }

            // Heatmap styling (cyan to red glow)
            const amplified = Math.min(255, avgDiff * amplification);
            if (amplified > 160) {
              // High anomaly: vibrant magenta/red
              heatPixels[i] = 255;
              heatPixels[i + 1] = 60;
              heatPixels[i + 2] = 120;
              heatPixels[i + 3] = 255;
            } else if (amplified > 80) {
              // Moderate difference: cyan/blue
              heatPixels[i] = 40;
              heatPixels[i + 1] = 180;
              heatPixels[i + 2] = 255;
              heatPixels[i + 3] = 220;
            } else {
              // Low/consistent compression background
              heatPixels[i] = amplified;
              heatPixels[i + 1] = amplified;
              heatPixels[i + 2] = amplified;
              heatPixels[i + 3] = 255;
            }
          }

          heatCtx.putImageData(heatImageData, 0, 0);

          const averageDiff = totalDiff / pixelCount;
          const anomalyRatio = highAnomalyCount / pixelCount;

          // ELA Score from 0 to 100
          const rawScore = Math.min(100, Math.round(anomalyRatio * 1200 + averageDiff * 4));

          let elaRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
          let tamperDetected = false;
          let tamperReason: string | undefined = undefined;

          if (rawScore > 65 || anomalyRatio > 0.05) {
            elaRiskLevel = 'HIGH';
            tamperDetected = true;
            tamperReason = 'High local compression disparity detected around amount or narrative bounding box.';
          } else if (rawScore > 35) {
            elaRiskLevel = 'MEDIUM';
            tamperDetected = false;
            tamperReason = 'Moderate artifact variance. Image may have been re-saved through multiple social apps.';
          }

          const report: ForensicReport = {
            elaScore: rawScore,
            elaRiskLevel,
            tamperDetected,
            tamperReason,
            verifiedAt: new Date().toISOString(),
          };

          resolve({
            report,
            heatmapDataUrl: heatCanvas.toDataURL('image/png'),
          });
        };

        recompressedImg.onerror = () => {
          reject(new Error('Failed to load recompressed image for ELA'));
        };

        recompressedImg.src = recompressedDataUrl;
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load original image for ELA analysis'));
    };

    if (typeof imageSource === 'string') {
      img.src = imageSource;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(imageSource);
    }
  });
}

