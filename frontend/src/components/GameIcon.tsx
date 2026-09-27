import { AudioLines, ChartNoAxesCombined, Headphones, Mic, Search, Layers, Footprints } from "lucide-react";

export function GameIcon({ id, size = 27 }: { id: string; size?: number }) {
    const Icon =
        (
            {
                "stress-sort": Footprints,
                "rhythm-match": Headphones,
                "stress-twins": Layers,
                "what-do-they-mean": Search,
            } as Record<string, typeof Mic>
        )[id] || AudioLines;
    return <Icon size={size} />;
}
