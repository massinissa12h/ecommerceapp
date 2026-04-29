'use client'

import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSocialNotifications } from '@/hooks/use-social-notifications'

export function NotificationBell({ userId }: { userId: string | null }) {
  const { total } = useSocialNotifications(userId)

  return (
    <Link href="/friends" aria-label={`Notifications (${total})`}>
      <motion.div whileTap={{ scale: 0.94 }}>
        <Button variant="ghost" size="sm" className="relative rounded-full">
          <Bell className="w-5 h-5" />
          <AnimatePresence>
            {total > 0 && (
              <motion.span
                key={total}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[11px] rounded-full min-w-5 h-5 px-1 flex items-center justify-center font-bold"
              >
                {total > 99 ? '99+' : total}
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </motion.div>
    </Link>
  )
}
