interface Profile {
    id: string;
    name: string;
    age: number;
    bio: string;
    photos: {
        url: string;
    }[];
}
interface SwipeCardProps {
    profile: Profile;
    onSwipe: (direction: string) => void;
}
export declare const SwipeCard: ({ profile, onSwipe }: SwipeCardProps) => import("react").JSX.Element;
export {};
//# sourceMappingURL=SwipeCard.d.ts.map