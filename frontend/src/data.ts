export type Question = {
    text: string;
    prompt: string;
    options: string[];
    correct: number;
    explanation: string;
    stress?: number;
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
        id: "stress-steps",
        name: "Stress Steps",
        subtitle: "Find the beat inside every word.",
        tag: "WORD STRESS",
        color: "purple",
        icon: "steps",
        time: 3,
    },
    {
        id: "rhythm-echo",
        name: "Rhythm Echo",
        subtitle: "Catch the rhythm of real conversation.",
        tag: "SENTENCE RHYTHM",
        color: "peach",
        icon: "audio",
        time: 4,
    },
    {
        id: "stress-twins",
        name: "Stress Twins",
        subtitle: "Find the words that move to the same beat.",
        tag: "STRESS & MEANING",
        color: "green",
        icon: "twins",
        time: 3,
    },
    {
        id: "soundprint",
        name: "Soundprint",
        subtitle: "See the shape of stress.",
        tag: "SOUND RECOGNITION",
        color: "blue",
        icon: "wave",
        time: 4,
    },
    {
        id: "stress-detective",
        name: "Stress Detective",
        subtitle: "Same words. Different meaning.",
        tag: "SENTENCE EMPHASIS",
        color: "pink",
        icon: "detective",
        time: 5,
    },
    {
        id: "rhythm-match",
        name: "Rhythm Match",
        subtitle: "Match the beat. Speak naturally.",
        tag: "NATURAL RHYTHM",
        color: "yellow",
        icon: "rhythm",
        time: 4,
    },
    {
        id: "shape-your-sound",
        name: "Shape Your Sound",
        subtitle: "Speak it. See it. Improve it.",
        tag: "SPEAKING STUDIO",
        color: "purple",
        icon: "mic",
        time: 5,
    },
];
const word = (
    text: string,
    options: string[],
    correct: number,
    stress: number,
): Question => ({
    text,
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
        prompt: "Choose a natural pattern for strong enthusiasm.",
        options: [
            "I REALLY wanted to SEE that MOVIE.",
            "I really TO see THAT movie.",
            "I REALLY WANTED TO SEE THAT MOVIE.",
            "I really wanted to see THAT.",
        ],
        correct: 0,
        explanation:
            "Meaningful words carry the beats. Small connecting words stay lighter and quicker.",
    },
    {
        text: "Could you pass me the salt?",
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
        text: "a record → to record",
        prompt: "Choose the noun → verb stress pair.",
        options: [
            "REcord → reCORD",
            "reCORD → REcord",
            "REcord → REcord",
            "reCORD → reCORD",
        ],
        correct: 0,
        explanation:
            "A REcord is a noun. To reCORD is an action. Moving the stress changes the grammatical role.",
    },
    {
        text: "a present → to present",
        prompt: "How does the stress move?",
        options: [
            "preSENT → PREsent",
            "PREsent → preSENT",
            "PREsent → PREsent",
            "preSENT → preSENT",
        ],
        correct: 1,
        explanation:
            "A PREsent is a gift; to preSENT is to show or introduce something.",
    },
    {
        text: "a contract → to contract",
        prompt: "Choose the usual noun → verb pattern.",
        options: [
            "conTRACT → CONtract",
            "CONtract → CONtract",
            "CONtract → conTRACT",
            "conTRACT → conTRACT",
        ],
        correct: 2,
        explanation:
            "A CONtract is an agreement. To conTRACT can mean to become smaller.",
    },
    {
        text: "an object → to object",
        prompt: "Choose the noun → verb stress pair.",
        options: [
            "obJECT → OBject",
            "OBject → OBject",
            "obJECT → obJECT",
            "OBject → obJECT",
        ],
        correct: 3,
        explanation: "An OBject is a thing. To obJECT is to express disagreement.",
    },
];

const stressSteps: StressStepsQuestion[] = [
    {
        words: [
            "apostrophe",
            "Argentina",
            "apparently",
            "available",
            "community",
            "definition",
            "development",
            "disappointing",
            "economic",
            "electrician",
            "engineering",
            "environment",
        ],
        category1Label: "Stress on 2nd syllable",
        category1Pattern: [1, 3, 1, 1],
        category1Example: "community",
        category2Label: "Stress on 3rd syllable",
        category2Pattern: [1, 1, 3, 1],
        category2Example: "information",
        correctMap: {
            apostrophe: 0,
            Argentina: 0,
            apparently: 0,
            available: 0,
            community: 0,
            definition: 0,
            development: 0,
            disappointing: 0,
            economic: 0,
            electrician: 0,
            engineering: 0,
            environment: 0,
        },
    },
    {
        words: [
            "especially",
            "experience",
            "immigration",
            "infinitive",
            "impractical",
            "information",
            "publicity",
            "punctuation",
            "reputation",
            "responsible",
            "situation",
            "unsuccessful",
        ],
        category1Label: "Stress on 2nd syllable",
        category1Pattern: [1, 3, 1, 1],
        category1Example: "community",
        category2Label: "Stress on 3rd syllable",
        category2Pattern: [1, 1, 3, 1],
        category2Example: "information",
        correctMap: {
            especially: 0,
            experience: 0,
            immigration: 0,
            infinitive: 1,
            impractical: 1,
            information: 1,
            publicity: 1,
            punctuation: 1,
            reputation: 1,
            responsible: 1,
            situation: 1,
            unsuccessful: 1,
        },
    },
];

export const questions: Record<string, Question[] | StressStepsQuestion[]> = {
    "stress-steps": stressSteps,
    soundprint: words,
    "stress-detective": detective,
    "rhythm-echo": echo,
    "stress-twins": twins,
    "rhythm-match": echo.map((q) => ({
        ...q,
        prompt: "Listen, then choose the matching strong-beat pattern.",
    })),
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
