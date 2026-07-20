import { motion, useMotionValue, useTransform } from 'framer-motion'

interface Profile {
  id: string
  name: string
  age: number
  bio: string
  photos: { url: string }[]
}

interface SwipeCardProps {
  profile: Profile
  onSwipe: (direction: string) => void
}

export const SwipeCard = ({ profile, onSwipe }: SwipeCardProps) => {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-30, 30])
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0])

  const handleDragEnd = (event: any, info: any) => {
    const threshold = 100
    if (info.offset.x > threshold) {
      onSwipe('right')
    } else if (info.offset.x < -threshold) {
      onSwipe('left')
    } else if (info.offset.y < -threshold) {
      onSwipe('up')
    }
  }

  return (
    <motion.div
      style={{ x, rotate, opacity }}
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragEnd={handleDragEnd}
      className="absolute w-full h-full bg-white rounded-2xl shadow-2xl overflow-hidden cursor-grab active:cursor-grabbing"
    >
      <img 
        src={profile.photos[0]?.url} 
        alt={profile.name} 
        className="w-full h-full object-cover" 
      />
      <div className="absolute bottom-0 p-6 bg-gradient-to-t from-black/80 to-transparent w-full text-white">
        <h2 className="text-3xl font-bold">{profile.name}, {profile.age}</h2>
        <p className="text-lg mt-2">{profile.bio}</p>
      </div>
    </motion.div>
  )
}
