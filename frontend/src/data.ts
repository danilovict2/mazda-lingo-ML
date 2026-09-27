export type Question = {
    text: string;
    /** Clip id in public/audio/, generated from scripts/clips.json. */
    audio?: string;
    prompt: string;
    options: string[];
    correct: number;
    explanation: string;
    stress?: number;
};

/** Say It Right: the player says `text` aloud, stressing the **marked** word(s). */
export type SpeakQuestion = {
    text: string;
    /** Model recording of the sentence with the intended stress. */
    audio: string;
};

export type StressStepsQuestion = {
    words: string[];
    category1Label: string;
    category1Pattern: number[];
    category1Example: string;
    category2Label: string;
    category2Pattern: number[];
    category2Example: string;
    correctMap: Record<string, number>;
};
export const games = [
    {
        id: "stress-sort",
        tip: "The tall bar is the stressed syllable: said louder, longer and higher. Put each word under the pattern it matches.",
        example: { clip: "sort-community", label: "com-MU-ni-ty" },
        name: "Stress Sort",
        subtitle: "Group words by their stressed syllable.",
        tag: "WORD STRESS · LEXICAL PHONOLOGY",
        color: "purple",
        icon: "steps",
        time: 3,
    },
    {
        id: "stress-twins",
        tip: "Many words move their stress: the noun stresses the start, the verb the end. Find the one word that doesn’t move.",
        example: { clip: "twins-object", label: "an OB-ject, to ob-JECT" },
        name: "Stress Twins",
        subtitle: "Explore how stress distinguishes nouns and verbs.",
        tag: "WORD STRESS · GRAMMAR",
        color: "green",
        icon: "twins",
        time: 3,
    },
    {
        id: "what-do-they-mean",
        tip: "The stressed word is said louder and higher, and it changes what the speaker really means.",
        example: { clip: "rhythm-station", label: "We’re MEETING at the station" },
        name: "What do they mean?",
        subtitle: "Discover how emphasis changes the implied meaning.",
        tag: "SENTENCE STRESS · PRAGMATICS",
        color: "pink",
        icon: "detective",
        time: 5,
    },
    {
        id: "rhythm-match",
        tip: "English has a beat: key words are strong, while small words like “to”, “the” and “at” stay quick and light.",
        example: { clip: "studio-medium", label: "a natural sentence rhythm" },
        name: "Rhythm Match",
        subtitle: "Compare the spacing between stressed beats.",
        tag: "SPEECH TIMING · PROSODY",
        color: "peach",
        icon: "audio",
        time: 4,
    },
    {
        id: "say-it-right",
        tip: "Say the sentence and make the highlighted words stand out: louder and a little longer than the rest.",
        example: { clip: "detective-coffee", label: "I didn’t say she stole my COFFEE" },
        name: "Say It Right",
        subtitle: "Say the sentence with the right words stressed.",
        tag: "SPEAKING · SENTENCE STRESS",
        color: "blue",
        icon: "mic",
        time: 4,
    },
];
const word = (
    text: string,
    options: string[],
    correct: number,
    stress: number,
): Question => ({
    text,
    audio: `word-${text}`,
    prompt: "Which syllable carries the strongest beat?",
    options,
    correct,
    stress,
    explanation: `Exactly where the beat belongs: ${options[correct]}. Give that syllable a little more length and energy.`,
});
const words = [
    word(
        "photography",
        ["PHO-tog-ra-phy", "pho-TOG-ra-phy", "pho-tog-RA-phy", "pho-tog-ra-PHY"],
        1,
        1,
    ),
    word(
        "beautiful",
        ["BEAU-ti-ful", "beau-TI-ful", "beau-ti-FUL", "All syllables equally"],
        0,
        0,
    ),
    word(
        "opportunity",
        [
            "OP-por-tu-ni-ty",
            "op-POR-tu-ni-ty",
            "op-por-TU-ni-ty",
            "op-por-tu-ni-TY",
        ],
        2,
        2,
    ),
    word(
        "computer",
        ["COM-pu-ter", "com-PU-ter", "com-pu-TER", "All syllables equally"],
        1,
        1,
    ),
    word(
        "understand",
        ["UN-der-stand", "un-DER-stand", "un-der-STAND", "All syllables equally"],
        2,
        2,
    ),
];
const detective: Question[] = [
    {
        text: "I didn’t say **she** stole my coffee.",
        audio: "detective-she",
        prompt: "What is the speaker suggesting?",
        options: [
            "Someone else might have taken it.",
            "They took something other than coffee.",
            "The coffee belonged to someone else.",
            "The speaker is sure nothing was stolen.",
        ],
        correct: 0,
        explanation:
            "Stressing “she” contrasts her with someone else. The speaker leaves open the possibility that another person took the coffee.",
    },
    {
        text: "Why am I the **only** one copying my cousin?",
        audio: "detective-only",
        prompt: "What does the emphasis imply?",
        options: [
            "The cousin is not worth copying.",
            "Other people should be doing it too.",
            "Someone else is being copied.",
            "The speaker wants to stop talking.",
        ],
        correct: 1,
        explanation:
            "“Only” highlights that nobody else is doing it. The speaker expects others to join in.",
    },
    {
        text: "I wanted the **blue** one.",
        audio: "detective-blue",
        prompt: "What is the speaker correcting?",
        options: [
            "Who wanted it.",
            "When they wanted it.",
            "The color of the item.",
            "How many they wanted.",
        ],
        correct: 2,
        explanation:
            "The emphasis on “blue” contrasts the color with other available colors.",
    },
    {
        text: "She **actually** finished the project.",
        audio: "detective-actually",
        prompt: "What feeling does the stress add?",
        options: [
            "Doubt about which project.",
            "A request to finish sooner.",
            "A correction about who helped.",
            "Surprise that she finished.",
        ],
        correct: 3,
        explanation:
            "Stressing “actually” signals that the result is surprising or contrary to expectations.",
    },
    {
        text: "I said we should leave **now**.",
        audio: "detective-now",
        prompt: "What matters most to the speaker?",
        options: [
            "The people who are leaving.",
            "The timing of leaving.",
            "The destination.",
            "The mode of travel.",
        ],
        correct: 1,
        explanation:
            "Stressing “now” makes the timing the focus: immediately, rather than later.",
    },
];
const echo: Question[] = [
    {
        text: "I really wanted to see that movie.",
        audio: "rhythm-movie",
        prompt: "Choose a natural pattern for strong enthusiasm.",
        options: [
            "I REALLY wanted to see that MOVIE.",
            "I really TO see THAT movie.",
            "I REALLY WANTED TO SEE THAT MOVIE.",
            "I really wanted to see THAT.",
        ],
        correct: 0,
        explanation:
            "“Really” carries the enthusiasm and “movie” is the key information, so they take the beats. The words in between stay lighter and quicker.",
    },
    {
        text: "Could you pass me the salt?",
        audio: "rhythm-salt",
        prompt: "Which pattern sounds like a neutral request?",
        options: [
            "COULD YOU PASS ME THE SALT?",
            "Could you PASS me the SALT?",
            "Could YOU pass ME the salt?",
            "Could you pass me THE salt?",
        ],
        correct: 1,
        explanation:
            "“Pass” and “salt” carry the key information, while the surrounding words connect the beats.",
    },
    {
        text: "We’re meeting at the station.",
        audio: "rhythm-station",
        prompt: "Where are the natural main beats?",
        options: [
            "WE’RE meeting AT THE station.",
            "We’re MEETING at THE station.",
            "We’re MEETING at the STATION.",
            "We’re meeting AT the station.",
        ],
        correct: 2,
        explanation:
            "The action and location are the information words: “meeting” and “station.”",
    },
    {
        text: "It’s a beautiful day outside.",
        audio: "rhythm-day",
        prompt: "Choose the most natural neutral rhythm.",
        options: [
            "IT’S A beautiful day outside.",
            "It’s a BEAUTIFUL DAY OUTSIDE.",
            "It’s A beautiful DAY outside.",
            "It’s a beautiful day OUTSIDE only.",
        ],
        correct: 1,
        explanation:
            "Adjectives, nouns, and adverbs can carry the main beats. “It’s a” is lighter.",
    },
];
const twins: Question[] = [
    {
        text: "Compare these four words:",
        prompt: "Which word keeps the same stress as a noun and a verb?",
        options: [
            "permit",
            "record",
            "desert",
            "promise",
        ],
        correct: 3,
        explanation:
            "promise keeps the PROM-ise stress in both forms. permit, record, and desert all change stress between noun and verb.",
    },
    {
        text: "Compare these four words:",
        prompt: "Which word keeps the same stress as a noun and a verb?",
        options: [
            "produce",
            "present",
            "answer",
            "progress",
        ],
        correct: 2,
        explanation:
            "answer keeps the AN-swer stress in both forms. produce, present, and progress all move the stress.",
    },
    {
        text: "Compare these four words:",
        prompt: "Which word keeps the same stress as a noun and a verb?",
        options: [
            "extract",
            "console",
            "protest",
            "support",
        ],
        correct: 3,
        explanation:
            "support keeps the sup-PORT stress in both forms. extract, console, and protest all change their stress pattern.",
    },
    {
        text: "Compare these four words:",
        prompt: "Which word keeps the same stress as a noun and a verb?",
        options: [
            "increase",
            "conflict",
            "paper",
            "rebel",
        ],
        correct: 2,
        explanation:
            "paper keeps the PA-per stress in both forms. increase, conflict, and rebel all shift their stress.",
    },
];

// Sentences whose stress the checker judged correctly in calibration (see stress_check.py).
const speak: SpeakQuestion[] = [
    { text: "I wanted the **blue** one.", audio: "detective-blue" },
    { text: "We’re **meeting** at the station.", audio: "rhythm-station" },
    { text: "I said we should leave **now**.", audio: "detective-now" },
    { text: "Why am I the **only** one copying my cousin?", audio: "detective-only" },
    { text: "Could you **pass** me the **salt**?", audio: "rhythm-salt" },
    { text: "I **really** wanted to see that **movie**.", audio: "rhythm-movie" },
];

const stressSteps: StressStepsQuestion[] = [
    {
        words: [
            "apostrophe",
            "apparently",
            "available",
            "development",
            "environment",
            "Argentina",
            "definition",
            "disappointing",
            "engineering",
            "reputation",
        ],
        category1Label: "Stress on 2nd syllable",
        category1Pattern: [1, 3, 1, 1],
        category1Example: "community",
        category2Label: "Stress on 3rd syllable",
        category2Pattern: [1, 1, 3, 1],
        category2Example: "information",
        correctMap: {
            apostrophe: 0,
            apparently: 0,
            available: 0,
            development: 0,
            environment: 0,
            Argentina: 1,
            definition: 1,
            disappointing: 1,
            engineering: 1,
            reputation: 1,
        },
    },
];

export const questions: Record<string, Question[] | StressStepsQuestion[] | SpeakQuestion[]> = {
    "say-it-right": speak,
    "stress-sort": stressSteps,
    "what-do-they-mean": detective,
    "rhythm-match": echo,
    "stress-twins": twins,
};
export const placement = [words[0], echo[1], twins[0], detective[2], words[2]];
export const skills = [
    "Word stress",
    "Sentence stress",
    "Rhythm",
    "Emphasis",
    "Recognition",
    "Pronunciation",
    "Fluency",
];
export const scores = [82, 68, 75, 71, 90, 79, 73];
export type Progress = {
    xp: number;
    completed: string[];
    answers: number;
    correct: number;
    placed: boolean;
    level: string;
    sessions: { name: string; accuracy: number; date: string }[];
};
export const initialProgress: Progress = {
    xp: 360,
    completed: [],
    answers: 0,
    correct: 0,
    placed: false,
    level: "Explorer",
    sessions: [],
};
