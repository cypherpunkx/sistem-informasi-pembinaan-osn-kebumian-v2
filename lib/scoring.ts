export interface ScoringResult {
    earned: number;
    isCorrect: boolean;
    feedback: string;
}

export interface ScoringAnswerKey {
    key: string;
    type: "TEXT" | "NUMERIC";
    tolerance?: number;
}

export interface ScoringRubricItem {
    component: string;
    keywords: string | string[];
    points: number;
}

export interface ScoringQuestion {
    type: string;
    weight?: number | null;
    answerKeys?: ScoringAnswerKey[];
    rubric?: ScoringRubricItem[];
}

export interface ScoringOption {
    id: number;
    isCorrect?: boolean;
}

export function calculateQuestionScore(
    question: ScoringQuestion,
    answer: string,
    options: ScoringOption[] = []
): ScoringResult {
    const weight = question.weight || 1;
    let earned = 0;
    let isCorrect = false;
    let feedback = "";

    if (!answer) {
        return { earned: 0, isCorrect: false, feedback: "No answer provided" };
    }

    // -- MULTIPLE CHOICE --
    if (question.type === "MULTIPLE_CHOICE") {
        const selectedOpt = options.find(o => o.id === parseInt(answer || "0"));
        if (selectedOpt?.isCorrect) {
            earned = weight;
            isCorrect = true;
        } else {
            // Negative Marking: -0.25 * Weight
            earned = -0.25 * weight;
            isCorrect = false;
        }
    }

    // -- SHORT ANSWER --
    else if (question.type === "SHORT_ANSWER") {
        const userVal = answer.trim();
        const keys = question.answerKeys ?? [];

        let matchFound = false;

        for (const keyObj of keys) {
            if (keyObj.type === "NUMERIC") {
                const numUser = parseFloat(userVal);
                const numKey = parseFloat(keyObj.key);
                const tolerance = keyObj.tolerance || 0;

                if (!isNaN(numUser) && !isNaN(numKey)) {
                    if (Math.abs(numUser - numKey) <= tolerance) {
                        matchFound = true;
                        break;
                    }
                }
            } else {
                // Text Match (Case Insensitive)
                if (userVal.toLowerCase() === keyObj.key.toLowerCase()) {
                    matchFound = true;
                    break;
                }
            }
        }

        if (matchFound) {
            earned = weight;
            isCorrect = true;
        }
    }

    // -- ESSAY --
    else if (question.type === "ESSAY") {
        const userText = answer.toLowerCase();
        const rubrics = question.rubric ?? [];

        let earnedRubricPoints = 0;
        let totalRubricPoints = 0;

        for (const item of rubrics) {
            totalRubricPoints += item.points;

            // Handle keywords as string (comma-sep) or array
            let keywords: string[] = [];
            if (Array.isArray(item.keywords)) {
                keywords = item.keywords.map(k => k.trim().toLowerCase());
            } else if (typeof item.keywords === 'string') {
                keywords = item.keywords.split(",").map(k => k.trim().toLowerCase());
            }

            // Check if ANY keyword matches
            const hit = keywords.some((k: string) => k && userText.includes(k));
            if (hit) {
                earnedRubricPoints += item.points;
                feedback += `✓ ${item.component}\n`;
            } else {
                feedback += `✗ Missing: ${item.component}\n`;
            }
        }

        // Scale to Question Weight
        if (totalRubricPoints > 0) {
            earned = (earnedRubricPoints / totalRubricPoints) * weight;
        }

        // Partial credit logic
        if (earned > 0) isCorrect = true;
    }

    return { earned, isCorrect, feedback };
}
