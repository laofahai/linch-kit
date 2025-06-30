import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
// import bcrypt from 'bcryptjs'

const signupSchema = z.object({
  name: z.string().min(2, '姓名至少2个字符'),
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(8, '密码至少8位'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = signupSchema.parse(body)

    // 检查用户是否已存在
    const existingUser = await prisma.user.findUnique({
      where: {
        email: validatedData.email
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { message: '该邮箱已被注册' },
        { status: 400 }
      )
    }

    // 在实际应用中，应该对密码进行哈希处理
    // const hashedPassword = await bcrypt.hash(validatedData.password, 12)

    // 创建新用户
    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        // password: hashedPassword, // 需要添加password字段到User model
        role: 'user',
        status: 'active',
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      }
    })

    // 在实际应用中，这里应该发送验证邮件
    // await sendVerificationEmail(user.email, user.id)

    return NextResponse.json(
      { 
        message: '注册成功！请查收验证邮件。',
        user: user
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: '输入数据无效', errors: error.errors },
        { status: 400 }
      )
    }

    console.error('注册错误:', error)
    return NextResponse.json(
      { message: '服务器内部错误' },
      { status: 500 }
    )
  }
}