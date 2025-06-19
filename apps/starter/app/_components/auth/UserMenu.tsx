'use client'

import { useAuthContext } from '@/_providers/authProvider'
import { useTranslation } from 'react-i18next'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@linch-kit/ui/shadcn'
import { Button } from '@linch-kit/ui/shadcn'
import { Avatar, AvatarFallback, AvatarImage } from '@linch-kit/ui/shadcn'
import { User, Settings, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function UserMenu() {
  const { t } = useTranslation()
  const { user, signOut, isAuthenticated } = useAuthContext()
  const router = useRouter()

  if (!isAuthenticated || !user) {
    return (
      <Button
        variant="ghost"
        onClick={() => router.push('/login')}
      >
        {t('auth.signIn.title')}
      </Button>
    )
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  const getUserInitials = (name?: string | null) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.image || undefined} alt={user.name || t('auth.user.unnamed')} />
            <AvatarFallback>{getUserInitials(user.name)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.name || t('auth.user.unnamed')}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email || user.id}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/profile')}>
          <User className="mr-2 h-4 w-4" />
          <span>{t('auth.user.profile')}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/settings')}>
          <Settings className="mr-2 h-4 w-4" />
          <span>{t('auth.user.settings')}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>{t('auth.user.signOut')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
