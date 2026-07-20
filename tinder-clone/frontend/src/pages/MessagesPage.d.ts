interface Convo {
    id: string;
    user: {
        id: string;
        name: string;
        photo: string;
    };
    lastMessage: {
        content: string;
        senderId: string;
        sentAt: string;
    } | null;
    unread: number;
    updatedAt: string;
}
export declare const MessagesPage: ({ onBack, user, initialChat, onChatConsumed }: {
    onBack?: () => void;
    user: any;
    initialChat?: Convo | null;
    onChatConsumed?: () => void;
}) => import("react").JSX.Element;
export {};
//# sourceMappingURL=MessagesPage.d.ts.map