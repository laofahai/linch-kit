"use client"

import * as React from "react"
import { TrendingUp, TrendingDown, Minus, MoreHorizontal } from "lucide-react"

import { cn } from "../../lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"

/**
 * Stats card data interface
 */
export interface StatsCardData {
  /** Card title */
  title: string
  /** Main value */
  value: string | number
  /** Description or subtitle */
  description?: string
  /** Change percentage */
  change?: number
  /** Change period (e.g., "vs last month") */
  changePeriod?: string
  /** Card icon */
  icon?: React.ComponentType<{ className?: string }>
  /** Custom trend indicator */
  trend?: "up" | "down" | "neutral"
  /** Additional actions */
  actions?: Array<{
    label: string
    onClick: () => void
  }>
}

/**
 * Props for StatsCard component
 */
export interface StatsCardProps {
  /** Stats data */
  data: StatsCardData
  /** Custom className */
  className?: string
  /** Loading state */
  loading?: boolean
}

/**
 * Statistics card component with trend indicators
 * 
 * @example
 * ```tsx
 * <StatsCard
 *   data={{
 *     title: "Total Users",
 *     value: "2,543",
 *     description: "Active users",
 *     change: 12.5,
 *     changePeriod: "vs last month",
 *     icon: Users,
 *   }}
 * />
 * ```
 */
export function StatsCard({ data, className, loading = false }: StatsCardProps) {
  const {
    title,
    value,
    description,
    change,
    changePeriod,
    icon: Icon,
    trend,
    actions,
  } = data

  // Determine trend based on change value or explicit trend
  const trendDirection = trend || (change !== undefined ? (change > 0 ? "up" : change < 0 ? "down" : "neutral") : "neutral")

  const TrendIcon = trendDirection === "up" ? TrendingUp : trendDirection === "down" ? TrendingDown : Minus

  const trendColor = trendDirection === "up" 
    ? "text-green-600" 
    : trendDirection === "down" 
    ? "text-red-600" 
    : "text-muted-foreground"

  if (loading) {
    return (
      <Card className={cn("", className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="h-4 w-24 bg-muted animate-pulse rounded" />
          <div className="h-4 w-4 bg-muted animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          <div className="h-8 w-32 bg-muted animate-pulse rounded mb-2" />
          <div className="h-3 w-20 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="flex items-center space-x-2">
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
          {actions && actions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {actions.map((action, index) => (
                  <DropdownMenuItem key={index} onClick={action.onClick}>
                    {action.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          {description && <span>{description}</span>}
          {change !== undefined && (
            <div className={cn("flex items-center", trendColor)}>
              <TrendIcon className="h-3 w-3 mr-1" />
              <span>{Math.abs(change)}%</span>
              {changePeriod && <span className="ml-1">{changePeriod}</span>}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Props for ChartContainer component
 */
export interface ChartContainerProps {
  /** Chart title */
  title: string
  /** Chart description */
  description?: string
  /** Chart content */
  children: React.ReactNode
  /** Custom className */
  className?: string
  /** Loading state */
  loading?: boolean
  /** Chart actions */
  actions?: React.ReactNode
}

/**
 * Chart container component for future chart library integration
 * 
 * @example
 * ```tsx
 * <ChartContainer
 *   title="Revenue Overview"
 *   description="Monthly revenue for the last 6 months"
 *   actions={<Button variant="outline" size="sm">Export</Button>}
 * >
 *   <YourChartComponent />
 * </ChartContainer>
 * ```
 */
export function ChartContainer({
  title,
  description,
  children,
  className,
  loading = false,
  actions,
}: ChartContainerProps) {
  if (loading) {
    return (
      <Card className={cn("", className)}>
        <CardHeader>
          <div className="h-6 w-48 bg-muted animate-pulse rounded" />
          {description && <div className="h-4 w-64 bg-muted animate-pulse rounded" />}
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="space-y-1">
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {actions && <div className="flex items-center space-x-2">{actions}</div>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

/**
 * Props for layout components
 */
export interface LayoutProps {
  /** Child content */
  children: React.ReactNode
  /** Custom className */
  className?: string
  /** Gap between items */
  gap?: "sm" | "md" | "lg"
}

/**
 * List layout component for vertical data display
 * 
 * @example
 * ```tsx
 * <ListLayout gap="md">
 *   <StatsCard data={statsData1} />
 *   <StatsCard data={statsData2} />
 *   <StatsCard data={statsData3} />
 * </ListLayout>
 * ```
 */
export function ListLayout({ children, className, gap = "md" }: LayoutProps) {
  const gapClasses = {
    sm: "space-y-2",
    md: "space-y-4",
    lg: "space-y-6",
  }

  return (
    <div className={cn("flex flex-col", gapClasses[gap], className)}>
      {children}
    </div>
  )
}

/**
 * Grid layout component for responsive data display
 * 
 * @example
 * ```tsx
 * <GridLayout gap="md">
 *   <StatsCard data={statsData1} />
 *   <StatsCard data={statsData2} />
 *   <StatsCard data={statsData3} />
 *   <StatsCard data={statsData4} />
 * </GridLayout>
 * ```
 */
export function GridLayout({ children, className, gap = "md" }: LayoutProps) {
  const gapClasses = {
    sm: "gap-2",
    md: "gap-4",
    lg: "gap-6",
  }

  return (
    <div className={cn(
      "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
      gapClasses[gap],
      className
    )}>
      {children}
    </div>
  )
}

/**
 * Stats grid component for displaying multiple stats cards
 * 
 * @example
 * ```tsx
 * const statsData = [
 *   { title: "Total Users", value: "2,543", change: 12.5 },
 *   { title: "Revenue", value: "$45,231", change: -2.1 },
 *   { title: "Orders", value: "1,234", change: 8.3 },
 *   { title: "Conversion", value: "3.2%", change: 0.5 },
 * ]
 * 
 * <StatsGrid data={statsData} />
 * ```
 */
export function StatsGrid({ 
  data, 
  className, 
  loading = false 
}: { 
  data: StatsCardData[]
  className?: string
  loading?: boolean
}) {
  return (
    <GridLayout className={className}>
      {data.map((stats, index) => (
        <StatsCard key={index} data={stats} loading={loading} />
      ))}
    </GridLayout>
  )
}
