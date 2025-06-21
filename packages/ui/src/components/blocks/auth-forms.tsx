"use client"

import * as React from "react"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { z } from "zod"

import { cn } from "../../lib/utils"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card"
import { FormBuilder } from "../crud/form-builder"

/**
 * Login form data schema
 */
export const loginSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(6, "密码至少需要6个字符"),
  remember: z.boolean().optional(),
})

export type LoginFormData = z.infer<typeof loginSchema>

/**
 * Register form data schema
 */
export const registerSchema = z.object({
  name: z.string().min(2, "姓名至少需要2个字符"),
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(6, "密码至少需要6个字符"),
  confirmPassword: z.string().min(6, "确认密码至少需要6个字符"),
  terms: z.boolean().refine(val => val === true, "请同意服务条款"),
}).refine(data => data.password === data.confirmPassword, {
  message: "两次输入的密码不一致",
  path: ["confirmPassword"],
})

export type RegisterFormData = z.infer<typeof registerSchema>

/**
 * Password reset form data schema
 */
export const passwordResetSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
})

export type PasswordResetFormData = z.infer<typeof passwordResetSchema>

/**
 * Props for authentication form components
 */
export interface AuthFormProps {
  /** Form submission handler */
  onSubmit: (data: any) => void | Promise<void>
  /** Loading state */
  loading?: boolean
  /** Error message */
  error?: string
  /** Success message */
  success?: string
  /** Custom className */
  className?: string
}

/**
 * Login form component
 * 
 * @example
 * ```tsx
 * <LoginForm
 *   onSubmit={async (data) => {
 *     await signIn(data.email, data.password)
 *   }}
 *   loading={isLoading}
 *   error={error}
 * />
 * ```
 */
export function LoginForm({
  onSubmit,
  loading = false,
  error,
  success,
  className,
}: AuthFormProps) {
  const [showPassword, setShowPassword] = React.useState(false)

  const fields = [
    {
      name: "email",
      type: "email" as const,
      label: "邮箱",
      placeholder: "请输入邮箱地址",
      required: true,
    },
    {
      name: "password",
      type: "password" as const,
      label: "密码",
      placeholder: "请输入密码",
      required: true,
    },
    {
      name: "remember",
      type: "checkbox" as const,
      label: "记住我",
    },
  ]

  return (
    <Card className={cn("w-full max-w-md", className)}>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">登录</CardTitle>
        <CardDescription className="text-center">
          输入您的邮箱和密码来登录账户
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md">
            {success}
          </div>
        )}
        <FormBuilder
          fields={fields}
          schema={loginSchema}
          onSubmit={onSubmit}
          loading={loading}
          submitText={loading ? "登录中..." : "登录"}
          layout={{ type: "vertical", spacing: "md" }}
        />
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <div className="text-sm text-center text-muted-foreground">
          还没有账户？{" "}
          <a href="/register" className="text-primary hover:underline">
            立即注册
          </a>
        </div>
        <div className="text-sm text-center">
          <a href="/forgot-password" className="text-muted-foreground hover:text-primary hover:underline">
            忘记密码？
          </a>
        </div>
      </CardFooter>
    </Card>
  )
}

/**
 * Register form component
 * 
 * @example
 * ```tsx
 * <RegisterForm
 *   onSubmit={async (data) => {
 *     await signUp(data.name, data.email, data.password)
 *   }}
 *   loading={isLoading}
 *   error={error}
 * />
 * ```
 */
export function RegisterForm({
  onSubmit,
  loading = false,
  error,
  success,
  className,
}: AuthFormProps) {
  const fields = [
    {
      name: "name",
      type: "text" as const,
      label: "姓名",
      placeholder: "请输入您的姓名",
      required: true,
    },
    {
      name: "email",
      type: "email" as const,
      label: "邮箱",
      placeholder: "请输入邮箱地址",
      required: true,
    },
    {
      name: "password",
      type: "password" as const,
      label: "密码",
      placeholder: "请输入密码",
      required: true,
    },
    {
      name: "confirmPassword",
      type: "password" as const,
      label: "确认密码",
      placeholder: "请再次输入密码",
      required: true,
    },
    {
      name: "terms",
      type: "checkbox" as const,
      label: "我同意服务条款和隐私政策",
      required: true,
    },
  ]

  return (
    <Card className={cn("w-full max-w-md", className)}>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">注册</CardTitle>
        <CardDescription className="text-center">
          创建一个新账户来开始使用
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md">
            {success}
          </div>
        )}
        <FormBuilder
          fields={fields}
          schema={registerSchema}
          onSubmit={onSubmit}
          loading={loading}
          submitText={loading ? "注册中..." : "注册"}
          layout={{ type: "vertical", spacing: "md" }}
        />
      </CardContent>
      <CardFooter className="text-sm text-center text-muted-foreground">
        已有账户？{" "}
        <a href="/login" className="text-primary hover:underline">
          立即登录
        </a>
      </CardFooter>
    </Card>
  )
}

/**
 * Password reset form component
 * 
 * @example
 * ```tsx
 * <PasswordResetForm
 *   onSubmit={async (data) => {
 *     await sendPasswordResetEmail(data.email)
 *   }}
 *   loading={isLoading}
 *   success="重置链接已发送到您的邮箱"
 * />
 * ```
 */
export function PasswordResetForm({
  onSubmit,
  loading = false,
  error,
  success,
  className,
}: AuthFormProps) {
  const fields = [
    {
      name: "email",
      type: "email" as const,
      label: "邮箱",
      placeholder: "请输入您的邮箱地址",
      required: true,
    },
  ]

  return (
    <Card className={cn("w-full max-w-md", className)}>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">重置密码</CardTitle>
        <CardDescription className="text-center">
          输入您的邮箱地址，我们将发送重置链接给您
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md">
            {success}
          </div>
        )}
        <FormBuilder
          fields={fields}
          schema={passwordResetSchema}
          onSubmit={onSubmit}
          loading={loading}
          submitText={loading ? "发送中..." : "发送重置链接"}
          layout={{ type: "vertical", spacing: "md" }}
        />
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <div className="text-sm text-center text-muted-foreground">
          记起密码了？{" "}
          <a href="/login" className="text-primary hover:underline">
            返回登录
          </a>
        </div>
      </CardFooter>
    </Card>
  )
}

/**
 * User profile form component
 * 
 * @example
 * ```tsx
 * <UserProfileForm
 *   defaultValues={user}
 *   onSubmit={async (data) => {
 *     await updateProfile(data)
 *   }}
 *   loading={isLoading}
 * />
 * ```
 */
export function UserProfileForm({
  onSubmit,
  loading = false,
  error,
  success,
  className,
  defaultValues,
}: AuthFormProps & { defaultValues?: any }) {
  const profileSchema = z.object({
    name: z.string().min(2, "姓名至少需要2个字符"),
    email: z.string().email("请输入有效的邮箱地址"),
    bio: z.string().optional(),
    notifications: z.boolean().default(true),
  })

  const fields = [
    {
      name: "name",
      type: "text" as const,
      label: "姓名",
      placeholder: "请输入您的姓名",
      required: true,
    },
    {
      name: "email",
      type: "email" as const,
      label: "邮箱",
      placeholder: "请输入邮箱地址",
      required: true,
    },
    {
      name: "bio",
      type: "textarea" as const,
      label: "个人简介",
      placeholder: "介绍一下您自己...",
    },
    {
      name: "notifications",
      type: "switch" as const,
      label: "接收邮件通知",
      description: "接收重要更新和通知",
    },
  ]

  return (
    <Card className={cn("w-full max-w-2xl", className)}>
      <CardHeader>
        <CardTitle>个人资料</CardTitle>
        <CardDescription>
          更新您的个人信息和偏好设置
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md">
            {success}
          </div>
        )}
        <FormBuilder
          fields={fields}
          schema={profileSchema}
          onSubmit={onSubmit}
          loading={loading}
          submitText={loading ? "保存中..." : "保存更改"}
          defaultValues={defaultValues}
          layout={{ type: "grid", columns: 2, spacing: "md" }}
        />
      </CardContent>
    </Card>
  )
}
