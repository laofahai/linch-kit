import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Tab {
  id: string
  title: string
  path: string
  icon?: string
  closable?: boolean
  pinned?: boolean
  modified?: boolean
}

interface TabsState {
  tabs: Tab[]
  activeTabId: string | null

  // 标签页操作
  addTab: (tab: Omit<Tab, 'id'>) => void
  removeTab: (id: string) => void
  setActiveTab: (id: string) => void
  updateTab: (id: string, updates: Partial<Tab>) => void

  // 标签页排序
  reorderTabs: (sourceIndex: number, destinationIndex: number) => void

  // 标签页状态
  pinTab: (id: string) => void
  unpinTab: (id: string) => void
  closeOthers: (id: string) => void
  closeTabs: (ids: string[]) => void

  // 工具方法
  getActiveTab: () => Tab | null
  getTabById: (id: string) => Tab | null
  getTabByPath: (path: string) => Tab | null

  // 状态重置
  reset: () => void
}

const generateTabId = (path: string): string => {
  return `tab-${path.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}`
}

const defaultTabs: Tab[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    path: '/dashboard',
    icon: 'Home',
    closable: false,
    pinned: true,
  },
]

export const useTabsStore = create<TabsState>()(
  persist(
    (set, get) => ({
      tabs: defaultTabs,
      activeTabId: 'dashboard',

      addTab: tabData => {
        const { tabs } = get()

        // 检查是否已存在相同路径的标签页
        const existingTab = tabs.find(tab => tab.path === tabData.path)
        if (existingTab) {
          set({ activeTabId: existingTab.id })
          return
        }

        // 创建新标签页
        const newTab: Tab = {
          id: generateTabId(tabData.path),
          closable: true,
          pinned: false,
          modified: false,
          ...tabData,
        }

        set(state => ({
          tabs: [...state.tabs, newTab],
          activeTabId: newTab.id,
        }))
      },

      removeTab: id => {
        const { tabs, activeTabId } = get()
        const tabIndex = tabs.findIndex(tab => tab.id === id)

        if (tabIndex === -1) return

        const tab = tabs[tabIndex]

        // 不能关闭不可关闭的标签页
        if (tab.closable === false) return

        const newTabs = tabs.filter(tab => tab.id !== id)

        // 如果关闭的是当前活动标签页，需要选择新的活动标签页
        let newActiveTabId = activeTabId
        if (activeTabId === id) {
          if (newTabs.length > 0) {
            // 优先选择右边的标签页，如果没有则选择左边的
            const nextTab = newTabs[tabIndex] || newTabs[tabIndex - 1]
            newActiveTabId = nextTab.id
          } else {
            newActiveTabId = null
          }
        }

        set({
          tabs: newTabs,
          activeTabId: newActiveTabId,
        })
      },

      setActiveTab: id => {
        const { tabs } = get()
        const tab = tabs.find(tab => tab.id === id)
        if (tab) {
          set({ activeTabId: id })
        }
      },

      updateTab: (id, updates) => {
        set(state => ({
          tabs: state.tabs.map(tab => (tab.id === id ? { ...tab, ...updates } : tab)),
        }))
      },

      reorderTabs: (sourceIndex, destinationIndex) => {
        const { tabs } = get()
        const newTabs = [...tabs]
        const [reorderedTab] = newTabs.splice(sourceIndex, 1)
        newTabs.splice(destinationIndex, 0, reorderedTab)

        set({ tabs: newTabs })
      },

      pinTab: id => {
        set(state => ({
          tabs: state.tabs.map(tab => (tab.id === id ? { ...tab, pinned: true } : tab)),
        }))
      },

      unpinTab: id => {
        set(state => ({
          tabs: state.tabs.map(tab => (tab.id === id ? { ...tab, pinned: false } : tab)),
        }))
      },

      closeOthers: id => {
        const { tabs } = get()
        const targetTab = tabs.find(tab => tab.id === id)
        if (!targetTab) return

        const newTabs = tabs.filter(tab => tab.id === id || tab.closable === false || tab.pinned)

        set({
          tabs: newTabs,
          activeTabId: id,
        })
      },

      closeTabs: ids => {
        const { tabs, activeTabId } = get()
        const newTabs = tabs.filter(tab => !ids.includes(tab.id) || tab.closable === false)

        // 如果当前活动标签页被关闭，选择新的活动标签页
        let newActiveTabId = activeTabId
        if (activeTabId && ids.includes(activeTabId)) {
          newActiveTabId = newTabs.length > 0 ? newTabs[0].id : null
        }

        set({
          tabs: newTabs,
          activeTabId: newActiveTabId,
        })
      },

      getActiveTab: () => {
        const { tabs, activeTabId } = get()
        return tabs.find(tab => tab.id === activeTabId) || null
      },

      getTabById: id => {
        const { tabs } = get()
        return tabs.find(tab => tab.id === id) || null
      },

      getTabByPath: path => {
        const { tabs } = get()
        return tabs.find(tab => tab.path === path) || null
      },

      reset: () => {
        set({
          tabs: defaultTabs,
          activeTabId: 'dashboard',
        })
      },
    }),
    {
      name: 'tabs-storage',
      // 只持久化必要的状态
      partialize: state => ({
        tabs: state.tabs,
        activeTabId: state.activeTabId,
      }),
    }
  )
)
