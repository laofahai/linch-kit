"use client"

import * as React from "react"
import {
  Building2,
  Briefcase,
  LayoutDashboard,
  FileText,
  BarChart3,
  Settings2,
  HelpCircle,
} from "lucide-react"
import { usePathname } from "next/navigation"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@linch-kit/ui"

// 企业级导航数据结构
const getNavigationData = (pathname: string) => {
  return {
    user: {
      name: "租户管理员",
      email: "admin@linchkit.dev",
      avatar: "/avatars/admin.jpg",
    },
    teams: [
      {
        name: "LinchKit 企业平台",
        logo: Building2,
        plan: "Enterprise",
      },
    ],
    navMain: [
      {
        title: "工作台",
        url: "/dashboard",
        icon: LayoutDashboard,
        isActive: pathname === "/dashboard",
      },
      {
        title: "租户管理",
        url: "#",
        icon: Building2,
        isActive: pathname.startsWith('/dashboard/users') || 
                 pathname.startsWith('/dashboard/settings') || 
                 pathname.startsWith('/dashboard/permissions'),
        items: [
          { 
            title: "用户管理", 
            url: "/dashboard/users",
            isActive: pathname.startsWith('/dashboard/users'),
          },
          { 
            title: "租户设置", 
            url: "/dashboard/settings",
            isActive: pathname.startsWith('/dashboard/settings'),
          },
          { 
            title: "权限配置", 
            url: "/dashboard/permissions",
            isActive: pathname.startsWith('/dashboard/permissions'),
          },
        ],
      },
      {
        title: "业务应用",
        url: "#",
        icon: Briefcase,
        items: [
          { title: "ERP 系统", url: "/apps/erp" },
          { title: "CRM 管理", url: "/apps/crm" },
          { title: "WMS 仓储", url: "/apps/wms" },
          { title: "报表分析", url: "/apps/reports" },
        ],
      },
      {
        title: "数据分析",
        url: "#",
        icon: BarChart3,
        items: [
          { title: "业务概览", url: "/dashboard/analytics/overview" },
          { title: "用户分析", url: "/dashboard/analytics/users" },
          { title: "收入报表", url: "/dashboard/analytics/revenue" },
          { title: "使用统计", url: "/dashboard/analytics/usage" },
        ],
      },
      {
        title: "tRPC 演示",
        url: "/dashboard/trpc-demo",
        icon: FileText,
        isActive: pathname === "/dashboard/trpc-demo",
      },
      {
        title: "设置",
        url: "#",
        icon: Settings2,
        items: [
          { title: "个人资料", url: "/dashboard/profile" },
          { title: "账户设置", url: "/dashboard/account" },
          { title: "通知偏好", url: "/dashboard/notifications" },
        ],
      },
      {
        title: "帮助支持",
        url: "#",
        icon: HelpCircle,
        items: [
          { title: "文档中心", url: "/docs" },
          { title: "联系支持", url: "/support" },
          { title: "反馈建议", url: "/feedback" },
        ],
      },
    ],
  }
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const data = getNavigationData(pathname)
  
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}