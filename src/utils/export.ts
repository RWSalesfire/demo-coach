import type { AnalysisResult } from '../types/analysis';

export function generateResultsSummary(results: AnalysisResult, prospectName: string): string {
  const lines: string[] = [];

  lines.push('SALESFIRE DEMO COACH - ANALYSIS RESULTS');
  lines.push('='.repeat(50));
  lines.push('');
  lines.push(`Prospect: ${prospectName}`);
  lines.push(`Date: ${new Date().toLocaleDateString()}`);
  lines.push('');
  lines.push(`OVERALL SCORE: ${results.overallScore.toFixed(1)}/10`);
  lines.push('');

  lines.push('KEY STRENGTHS:');
  results.keyStrengths.forEach((s, i) => lines.push(`  ${i + 1}. ${s}`));
  lines.push('');

  lines.push('PRIORITY IMPROVEMENTS:');
  results.priorityImprovements.forEach((s, i) => lines.push(`  ${i + 1}. ${s}`));
  lines.push('');

  lines.push('CATEGORY SCORES:');
  results.categories.forEach((cat) => {
    lines.push(`  ${cat.name}: ${cat.score}/10`);
    lines.push(`    Summary: ${cat.summary}`);
    if (cat.nextDemo) {
      lines.push(`    Next Demo Tip: ${cat.nextDemo}`);
    }
    lines.push('');
  });

  return lines.join('\n');
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      return true;
    } catch {
      return false;
    } finally {
      document.body.removeChild(textarea);
    }
  }
}

export function generateShareableLink(historyId: string): string {
  const baseUrl = window.location.origin + window.location.pathname;
  return `${baseUrl}?analysis=${historyId}`;
}

export function generatePDFContent(results: AnalysisResult, prospectName: string): string {
  // Generate HTML content for PDF
  const getScoreColor = (score: number) => {
    if (score >= 8) return '#4ade80';
    if (score >= 6) return '#facc15';
    return '#f87171';
  };

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Demo Analysis - ${prospectName}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 40px;
          color: #1f2937;
        }
        h1 { color: #f97316; margin-bottom: 5px; }
        h2 { color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; margin-top: 30px; }
        h3 { color: #4b5563; }
        .score-large {
          font-size: 48px;
          font-weight: bold;
          margin: 20px 0;
        }
        .category {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
          margin: 10px 0;
        }
        .category-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .tip-box {
          background: #fff7ed;
          border: 1px solid #fed7aa;
          border-radius: 8px;
          padding: 12px;
          margin-top: 10px;
        }
        .tip-box strong { color: #ea580c; }
        ul { padding-left: 20px; }
        li { margin: 5px 0; }
        .quote {
          border-left: 3px solid #9ca3af;
          padding-left: 12px;
          font-style: italic;
          color: #6b7280;
          margin: 10px 0;
        }
      </style>
    </head>
    <body>
      <h1>Salesfire Demo Coach</h1>
      <p style="color: #6b7280;">Analysis Report for ${prospectName} - ${new Date().toLocaleDateString()}</p>

      <h2>Overall Score</h2>
      <div class="score-large" style="color: ${getScoreColor(results.overallScore)}">
        ${results.overallScore.toFixed(1)}/10
      </div>

      <h2>Key Strengths</h2>
      <ul>
        ${results.keyStrengths.map(s => `<li>${s}</li>`).join('')}
      </ul>

      <h2>Priority Improvements</h2>
      <ol>
        ${results.priorityImprovements.map(s => `<li>${s}</li>`).join('')}
      </ol>

      <h2>Detailed Analysis</h2>
      ${results.categories.map(cat => `
        <div class="category">
          <div class="category-header">
            <h3 style="margin: 0;">${cat.name}</h3>
            <span style="font-size: 24px; font-weight: bold; color: ${getScoreColor(cat.score)}">${cat.score}/10</span>
          </div>
          <p>${cat.summary}</p>
          ${cat.quotes?.map(q => `
            <div class="quote">"${q.transcript}"</div>
            <p><strong>Coaching:</strong> ${q.feedback}</p>
          `).join('') || ''}
          ${cat.nextDemo ? `
            <div class="tip-box">
              <strong>Next Demo, Try This:</strong> ${cat.nextDemo}
            </div>
          ` : ''}
        </div>
      `).join('')}

      <hr style="margin-top: 40px; border-color: #e5e7eb;">
      <p style="color: #9ca3af; font-size: 12px; text-align: center;">
        Generated by Salesfire Demo Coach
      </p>
    </body>
    </html>
  `;

  return html;
}

export function downloadPDF(results: AnalysisResult, prospectName: string) {
  const html = generatePDFContent(results, prospectName);

  // Create a new window and print to PDF
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}
