/**
 * Blog Extension Hooks
 * 博客相关的React Hooks和Extension系统钩子
 */

import { useEffect, useState, useCallback } from 'react'
import type { HookContext } from '@linch-kit/core'

/**
 * 博客文章状态类型
 */
interface BlogPost {
  id: string
  title: string
  slug: string
  content: string
  status: 'draft' | 'published' | 'archived'
  publishedAt?: Date
  viewCount: number
  likeCount: number
  commentCount: number
}

/**
 * 博客分类状态类型
 */
interface BlogCategory {
  id: string
  name: string
  slug: string
  postCount: number
}

/**
 * 博客标签状态类型
 */
interface BlogTag {
  id: string
  name: string
  slug: string
  postCount: number
}

/**
 * Extension初始化Hook
 */
export function useExtensionInit(context: HookContext) {
  useEffect(() => {
    console.log('Blog Extension initialized in component')
    
    // 初始化博客Extension
    const initBlogExtension = async () => {
      // 设置博客相关的全局状态
      // 注册博客相关的事件监听器
      // 初始化博客数据
    }
    
    initBlogExtension()
    
    return () => {
      console.log('Blog Extension cleanup')
    }
  }, [context])
}

/**
 * 博客文章列表Hook
 */
export function useBlogPosts(options: {
  limit?: number
  offset?: number
  categoryId?: string
  status?: 'draft' | 'published' | 'archived'
  featured?: boolean
} = {}) {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState(0)

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      // 这里应该调用实际的API
      // const response = await api.blog.getPosts(options)
      
      // 模拟数据
      const mockPosts: BlogPost[] = [
        {
          id: '1',
          title: '示例博客文章',
          slug: 'example-blog-post',
          content: '这是一篇示例博客文章的内容...',
          status: 'published',
          publishedAt: new Date(),
          viewCount: 100,
          likeCount: 10,
          commentCount: 5,
        },
      ]
      
      setPosts(mockPosts)
      setTotal(mockPosts.length)
      setHasMore(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch posts')
    } finally {
      setLoading(false)
    }
  }, [options])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  return {
    posts,
    loading,
    error,
    hasMore,
    total,
    refetch: fetchPosts,
  }
}

/**
 * 博客文章详情Hook
 */
export function useBlogPost(slug: string) {
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true)
      setError(null)
      
      try {
        // 这里应该调用实际的API
        // const response = await api.blog.getPostBySlug({ slug })
        
        // 模拟数据
        const mockPost: BlogPost = {
          id: '1',
          title: '示例博客文章',
          slug: 'example-blog-post',
          content: '这是一篇示例博客文章的详细内容...',
          status: 'published',
          publishedAt: new Date(),
          viewCount: 100,
          likeCount: 10,
          commentCount: 5,
        }
        
        setPost(mockPost)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch post')
      } finally {
        setLoading(false)
      }
    }

    if (slug) {
      fetchPost()
    }
  }, [slug])

  return {
    post,
    loading,
    error,
  }
}

/**
 * 博客分类Hook
 */
export function useBlogCategories() {
  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true)
      setError(null)
      
      try {
        // 这里应该调用实际的API
        // const response = await api.categories.list()
        
        // 模拟数据
        const mockCategories: BlogCategory[] = [
          {
            id: '1',
            name: '技术',
            slug: 'tech',
            postCount: 10,
          },
          {
            id: '2',
            name: '生活',
            slug: 'life',
            postCount: 5,
          },
        ]
        
        setCategories(mockCategories)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch categories')
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  return {
    categories,
    loading,
    error,
  }
}

/**
 * 博客标签Hook
 */
export function useBlogTags(limit?: number) {
  const [tags, setTags] = useState<BlogTag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTags = async () => {
      setLoading(true)
      setError(null)
      
      try {
        // 这里应该调用实际的API
        // const response = await api.tags.list({ limit })
        
        // 模拟数据
        const mockTags: BlogTag[] = [
          {
            id: '1',
            name: 'React',
            slug: 'react',
            postCount: 8,
          },
          {
            id: '2',
            name: 'TypeScript',
            slug: 'typescript',
            postCount: 6,
          },
          {
            id: '3',
            name: 'Node.js',
            slug: 'nodejs',
            postCount: 4,
          },
        ]
        
        setTags(mockTags)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch tags')
      } finally {
        setLoading(false)
      }
    }

    fetchTags()
  }, [limit])

  return {
    tags,
    loading,
    error,
  }
}

/**
 * 博客搜索Hook
 */
export function useBlogSearch(query: string) {
  const [results, setResults] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      // 这里应该调用实际的搜索API
      // const response = await api.blog.searchPosts({ query: searchQuery })
      
      // 模拟搜索结果
      const mockResults: BlogPost[] = [
        {
          id: '1',
          title: '搜索结果示例',
          slug: 'search-result-example',
          content: '这是一个搜索结果示例...',
          status: 'published',
          publishedAt: new Date(),
          viewCount: 50,
          likeCount: 5,
          commentCount: 2,
        },
      ]
      
      setResults(mockResults)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      search(query)
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [query, search])

  return {
    results,
    loading,
    error,
    search,
  }
}

/**
 * 博客文章操作Hook
 */
export function useBlogPostActions() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const likePost = useCallback(async (postId: string) => {
    setLoading(true)
    setError(null)
    
    try {
      // 这里应该调用实际的API
      // const response = await api.blog.likePost({ postId })
      
      // 模拟操作
      console.log('Liked post:', postId)
      
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to like post'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [])

  const incrementViewCount = useCallback(async (postId: string) => {
    try {
      // 这里应该调用实际的API
      // const response = await api.blog.incrementViewCount({ postId })
      
      // 模拟操作
      console.log('Incremented view count for post:', postId)
      
      return { success: true }
    } catch (err) {
      console.error('Failed to increment view count:', err)
      return { success: false }
    }
  }, [])

  return {
    likePost,
    incrementViewCount,
    loading,
    error,
  }
}

/**
 * 博客管理Hook
 */
export function useBlogAdmin() {
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)
      setError(null)
      
      try {
        // 这里应该调用实际的API
        // const response = await api.blog.getStats()
        
        // 模拟数据
        const mockStats = {
          totalPosts: 25,
          totalViews: 1250,
          totalLikes: 125,
          totalComments: 50,
        }
        
        setStats(mockStats)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch stats')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return {
    stats,
    loading,
    error,
  }
}

/**
 * 导出所有hooks
 */
export const hooks = {
  useExtensionInit,
  useBlogPosts,
  useBlogPost,
  useBlogCategories,
  useBlogTags,
  useBlogSearch,
  useBlogPostActions,
  useBlogAdmin,
}