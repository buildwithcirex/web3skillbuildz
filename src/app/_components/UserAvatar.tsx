import Image from 'next/image'
import { avatarFor } from '@/lib/avatar'

export default function UserAvatar({
  userId,
  name,
  size = 40,
  className = '',
}: {
  userId: string
  name: string
  size?: number
  className?: string
}) {
  return (
    <Image
      src={avatarFor(userId)}
      alt={`${name}'s avatar`}
      title={name}
      width={size}
      height={size}
      className={`shrink-0 bg-white border-2 border-stone-900 object-cover ${className}`}
      style={{ width: size, height: size }}
    />
  )
}
