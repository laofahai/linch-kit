import { UserManagement } from './UserManagement'

export default function UsersPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">用户管理</h1>
          <p className="text-muted-foreground">
            管理系统用户账户、角色和权限设置
          </p>
        </div>
      </div>
      <UserManagement />
    </div>
  )
}