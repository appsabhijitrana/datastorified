export const getScoreLabel = (score: number) => score <= 30 ? "Avoid" : score <= 50 ? "Risky" : score <= 70 ? "Consider Carefully" : score <= 85 ? "Good Decision" : "Strong Decision";
