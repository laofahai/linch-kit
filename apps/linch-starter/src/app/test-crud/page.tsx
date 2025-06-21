"use client"

import { useState } from "react"
import { z } from "zod"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable, FormBuilder, SearchableSelect } from "@linch-kit/ui/crud"
import { Button } from "@linch-kit/ui"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@linch-kit/ui"

// 示例数据类型
interface User {
  id: string
  name: string
  email: string
  role: "admin" | "user" | "editor"
  status: "active" | "inactive"
  createdAt: string
}

// 示例数据
const sampleUsers: User[] = [
  {
    id: "1",
    name: "张三",
    email: "zhangsan@example.com",
    role: "admin",
    status: "active",
    createdAt: "2024-01-15",
  },
  {
    id: "2", 
    name: "李四",
    email: "lisi@example.com",
    role: "user",
    status: "active",
    createdAt: "2024-01-16",
  },
  {
    id: "3",
    name: "王五",
    email: "wangwu@example.com", 
    role: "editor",
    status: "inactive",
    createdAt: "2024-01-17",
  },
  {
    id: "4",
    name: "赵六",
    email: "zhaoliu@example.com",
    role: "user", 
    status: "active",
    createdAt: "2024-01-18",
  },
]

// 表格列定义
const columns: ColumnDef<User>[] = [
  {
    accessorKey: "name",
    header: "姓名",
  },
  {
    accessorKey: "email", 
    header: "邮箱",
  },
  {
    accessorKey: "role",
    header: "角色",
    cell: ({ row }) => {
      const role = row.getValue("role") as string
      const roleMap = {
        admin: "管理员",
        user: "用户", 
        editor: "编辑者"
      }
      return roleMap[role as keyof typeof roleMap] || role
    },
  },
  {
    accessorKey: "status",
    header: "状态",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <span className={`px-2 py-1 rounded-full text-xs ${
          status === "active" 
            ? "bg-green-100 text-green-800" 
            : "bg-red-100 text-red-800"
        }`}>
          {status === "active" ? "活跃" : "非活跃"}
        </span>
      )
    },
  },
  {
    accessorKey: "createdAt",
    header: "创建时间",
  },
]

// 表单 Schema
const userSchema = z.object({
  name: z.string().min(1, "姓名不能为空"),
  email: z.string().email("请输入有效的邮箱地址"),
  role: z.enum(["admin", "user", "editor"]),
  status: z.enum(["active", "inactive"]),
  bio: z.string().optional(),
  notifications: z.boolean().default(false),
})

type UserFormData = z.infer<typeof userSchema>

export default function TestCrudPage() {
  const [users, setUsers] = useState<User[]>(sampleUsers)
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])
  const [selectedRole, setSelectedRole] = useState<string>("")
  const [selectedMultiple, setSelectedMultiple] = useState<(string | number)[]>([])

  // 表单字段配置
  const formFields = [
    {
      name: "name",
      type: "text" as const,
      label: "姓名",
      placeholder: "请输入姓名",
      required: true,
      layout: { colSpan: 2 },
    },
    {
      name: "email", 
      type: "email" as const,
      label: "邮箱",
      placeholder: "请输入邮箱地址",
      required: true,
      layout: { colSpan: 2 },
    },
    {
      name: "role",
      type: "select" as const,
      label: "角色",
      options: [
        { label: "管理员", value: "admin" },
        { label: "用户", value: "user" },
        { label: "编辑者", value: "editor" },
      ],
    },
    {
      name: "status",
      type: "select" as const,
      label: "状态", 
      options: [
        { label: "活跃", value: "active" },
        { label: "非活跃", value: "inactive" },
      ],
    },
    {
      name: "bio",
      type: "textarea" as const,
      label: "个人简介",
      placeholder: "请输入个人简介",
      layout: { colSpan: 2 },
    },
    {
      name: "notifications",
      type: "switch" as const,
      label: "接收通知",
      description: "是否接收系统通知",
    },
  ]

  // 选择器选项
  const roleOptions = [
    { value: "admin", label: "管理员", description: "拥有所有权限" },
    { value: "user", label: "用户", description: "基础用户权限" },
    { value: "editor", label: "编辑者", description: "内容编辑权限" },
  ]

  const multipleOptions = [
    { value: "option1", label: "选项 1", group: "分组 A" },
    { value: "option2", label: "选项 2", group: "分组 A" },
    { value: "option3", label: "选项 3", group: "分组 B" },
    { value: "option4", label: "选项 4", group: "分组 B" },
    { value: "option5", label: "选项 5", group: "分组 C" },
  ]

  // 表格操作
  const tableActions = [
    {
      label: "编辑",
      onClick: (user: User) => {
        console.log("编辑用户:", user)
      },
    },
    {
      label: "删除",
      onClick: (user: User) => {
        setUsers(users.filter(u => u.id !== user.id))
      },
      variant: "destructive" as const,
    },
  ]

  // 表单提交
  const handleFormSubmit = (data: UserFormData) => {
    console.log("表单数据:", data)
    const newUser: User = {
      id: Date.now().toString(),
      ...data,
      createdAt: new Date().toISOString().split('T')[0],
    }
    setUsers([...users, newUser])
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">CRUD 组件测试</h1>
        <p className="text-muted-foreground mt-2">
          测试 DataTable、FormBuilder 和 SearchableSelect 组件
        </p>
      </div>

      {/* DataTable 测试 */}
      <Card>
        <CardHeader>
          <CardTitle>DataTable 组件测试</CardTitle>
          <CardDescription>
            支持排序、筛选、分页、行选择和操作菜单
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={users}
            config={{
              searchable: true,
              searchColumn: "name",
              searchPlaceholder: "搜索用户姓名...",
              selectable: true,
              columnVisibility: true,
              pagination: {
                defaultPageSize: 5,
                pageSizeOptions: [5, 10, 20],
                showSizeChanger: true,
              },
            }}
            actions={tableActions}
            onRowClick={(user) => console.log("点击行:", user)}
            onSelectionChange={setSelectedUsers}
            emptyMessage="暂无用户数据"
          />
          {selectedUsers.length > 0 && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium">
                已选择 {selectedUsers.length} 个用户:
              </p>
              <p className="text-sm text-muted-foreground">
                {selectedUsers.map(u => u.name).join(", ")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* FormBuilder 测试 */}
      <Card>
        <CardHeader>
          <CardTitle>FormBuilder 组件测试</CardTitle>
          <CardDescription>
            基于配置的动态表单生成，支持多种字段类型和布局
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormBuilder
            fields={formFields}
            schema={userSchema}
            onSubmit={handleFormSubmit}
            layout={{ type: "grid", columns: 2 }}
            submitText="创建用户"
            defaultValues={{
              role: "user",
              status: "active",
              notifications: false,
            }}
          />
        </CardContent>
      </Card>

      {/* SearchableSelect 测试 */}
      <Card>
        <CardHeader>
          <CardTitle>SearchableSelect 组件测试</CardTitle>
          <CardDescription>
            可搜索的选择器，支持单选、多选和分组
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="text-sm font-medium mb-2 block">单选模式</label>
            <SearchableSelect
              options={roleOptions}
              value={selectedRole}
              onValueChange={(value) => setSelectedRole(value as string)}
              placeholder="选择角色"
              searchPlaceholder="搜索角色..."
            />
            {selectedRole && (
              <p className="text-sm text-muted-foreground mt-2">
                已选择: {roleOptions.find(r => r.value === selectedRole)?.label}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">多选模式（分组）</label>
            <SearchableSelect
              options={multipleOptions}
              value={selectedMultiple}
              onValueChange={setSelectedMultiple}
              multiple
              placeholder="选择多个选项"
              searchPlaceholder="搜索选项..."
              maxDisplayItems={2}
            />
            {selectedMultiple.length > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                已选择 {selectedMultiple.length} 个选项
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
