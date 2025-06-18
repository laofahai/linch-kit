import { publicProcedure, trpcRouter } from '@/_lib/trpc/router'

export const userRouter = trpcRouter({
  // 在这里定义用户相关的路由
  // 例如：获取用户信息、更新用户资料等
  getUser: publicProcedure.query(async ({ ctx }) => {
    return ctx.user
  }),
  // updateUser: createProtectedProcedure
  //   .input(z.object({ name: z.string().optional(), email: z.string().email().optional() }))
  //   .mutation(async ({ ctx, input }) => {
  //     return ctx.userService.updateUser(ctx.user.id, input)
  //   }),
})
