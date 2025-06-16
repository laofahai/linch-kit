// import { router } from './router';
// import { reportRouter } from './routers/report';
// import { userRouter } from './routers/user';

import { trpcRouter } from '@/_lib/trpc/router'

export const appRouter = trpcRouter({
  // report: reportRouter,
  // user: userRouter,
})

// 导出类型
export type AppRouter = typeof appRouter
