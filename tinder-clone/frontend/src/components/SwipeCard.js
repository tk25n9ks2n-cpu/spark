import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion, useMotionValue, useTransform } from 'framer-motion';
export const SwipeCard = ({ profile, onSwipe }) => {
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-200, 200], [-30, 30]);
    const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
    const handleDragEnd = (event, info) => {
        const threshold = 100;
        if (info.offset.x > threshold) {
            onSwipe('right');
        }
        else if (info.offset.x < -threshold) {
            onSwipe('left');
        }
        else if (info.offset.y < -threshold) {
            onSwipe('up');
        }
    };
    return (_jsxs(motion.div, { style: { x, rotate, opacity }, drag: "xy", dragConstraints: { left: 0, right: 0, top: 0, bottom: 0 }, onDragEnd: handleDragEnd, className: "absolute w-full h-full bg-white rounded-2xl shadow-2xl overflow-hidden cursor-grab active:cursor-grabbing", children: [_jsx("img", { src: profile.photos[0]?.url, alt: profile.name, className: "w-full h-full object-cover" }), _jsxs("div", { className: "absolute bottom-0 p-6 bg-gradient-to-t from-black/80 to-transparent w-full text-white", children: [_jsxs("h2", { className: "text-3xl font-bold", children: [profile.name, ", ", profile.age] }), _jsx("p", { className: "text-lg mt-2", children: profile.bio })] })] }));
};
//# sourceMappingURL=SwipeCard.js.map