export interface ErrorRate {
  cer: number; // character error rate
  wer: number; // word error rate
}

// Compute Levenshtein distance
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // deletion
        dp[i][j - 1] + 1, // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }
  return dp[m][n];
}

export function computeCERWER(reference: string, hypothesis: string): ErrorRate {
  const refChars = reference;
  const hypChars = hypothesis;
  const charDist = levenshtein(refChars, hypChars);
  const cer = refChars.length > 0 ? charDist / refChars.length : 0;

  const refWords = reference.trim().split(/\s+/).filter(Boolean);
  const hypWords = hypothesis.trim().split(/\s+/).filter(Boolean);
  const maxLen = Math.max(refWords.length, hypWords.length);
  const wordDist = levenshtein(refWords.join(" "), hypWords.join(" "));
  const wer = maxLen > 0 ? wordDist / maxLen : 0;

  return { cer, wer };
}
