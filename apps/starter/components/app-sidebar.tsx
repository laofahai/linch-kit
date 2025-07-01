"use client"

import * as React from "react"
import {
  Building2,
  Briefcase,
  Shield,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// LinchKit 工作台数据
interface LinchKitSidebarProps {
  user?: {
    name: string
    email: string
    avatar: string
    role: 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'USER'
  }
  currentTenant?: {
    name: string
    plan: string
  }
}

// 简化的数据结构 - 基于租户管理员角色
const data = {
  user: {
    name: "租户管理员",
    email: "admin@linchkit.dev",
    avatar: "/avatars/admin.jpg",
  },
  teams: [
    {
      name: "LinchKit 平台",
      logo: Building2,
      plan: "Enterprise",
    },
  ],
  navMain: [
    {
      title: "租户管理",
      url: "/dashboard/management",
      icon: Building2,
      items: [
        { title: "用户管理", url: "/dashboard/users" },
        { title: "租户设置", url: "/dashboard/settings" },
        { title: "权限配置", url: "/dashboard/permissions" },
      ],
    },
    {
      title: "业务应用",
      url: "/apps",
      icon: Briefcase,
      items: [
        { title: "ERP 系统", url: "/apps/erp" },
        { title: "CRM 管理", url: "/apps/crm" },
        { title: "WMS 仓储", url: "/apps/wms" },
        { title: "报表分析", url: "/apps/reports" },
      ],
    },
  ],
  projects: [
    {
      name: "快速操作",
      url: "#",
      icon: Shield,
    },
  ],
}

export function AppSidebar({ 
  ...props 
}: LinchKitSidebarProps & React.ComponentProps<typeof Sidebar>) {
  
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