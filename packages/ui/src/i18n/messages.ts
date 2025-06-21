/**
 * UI 组件内置国际化消息
 * 
 * 用户可以覆盖这些消息或添加自己的翻译
 */

export const defaultMessages = {
  en: {
    // DataTable 相关
    'table.search': 'Search...',
    'table.noResults': 'No results found.',
    'table.loading': 'Loading...',
    'table.rowsPerPage': 'Rows per page',
    'table.page': 'Page',
    'table.of': 'of',
    'table.previous': 'Previous',
    'table.next': 'Next',
    'table.first': 'First',
    'table.last': 'Last',
    'table.selectAll': 'Select all',
    'table.selectRow': 'Select row',
    'table.actions': 'Actions',
    'table.columns': 'Columns',
    'table.toggleColumns': 'Toggle columns',
    'table.sortAsc': 'Sort ascending',
    'table.sortDesc': 'Sort descending',
    'table.unsort': 'Unsort',
    'table.filter': 'Filter',
    'table.clearFilter': 'Clear filter',
    'table.selectedRows': '{count} row(s) selected',

    // FormBuilder 相关
    'form.submit': 'Submit',
    'form.cancel': 'Cancel',
    'form.save': 'Save',
    'form.reset': 'Reset',
    'form.loading': 'Submitting...',
    'form.required': 'This field is required',
    'form.invalid': 'Invalid value',
    'form.minLength': 'Minimum {min} characters required',
    'form.maxLength': 'Maximum {max} characters allowed',
    'form.email': 'Please enter a valid email address',
    'form.url': 'Please enter a valid URL',
    'form.number': 'Please enter a valid number',
    'form.min': 'Value must be at least {min}',
    'form.max': 'Value must be at most {max}',
    'form.pattern': 'Invalid format',
    'form.selectOption': 'Select an option',
    'form.selectMultiple': 'Select options',
    'form.noOptions': 'No options available',
    'form.searchOptions': 'Search options...',
    'form.addItem': 'Add item',
    'form.removeItem': 'Remove item',
    'form.uploadFile': 'Upload file',
    'form.dragDropFile': 'Drag and drop file here, or click to select',
    'form.fileSize': 'File size must be less than {size}',
    'form.fileType': 'Invalid file type',

    // SearchableSelect 相关
    'select.search': 'Search...',
    'select.noResults': 'No results found',
    'select.loading': 'Loading...',
    'select.placeholder': 'Select an option',
    'select.multiPlaceholder': 'Select options',
    'select.clear': 'Clear',
    'select.clearAll': 'Clear all',
    'select.selected': '{count} selected',

    // Dialog 相关
    'dialog.close': 'Close',
    'dialog.confirm': 'Confirm',
    'dialog.cancel': 'Cancel',
    'dialog.ok': 'OK',
    'dialog.yes': 'Yes',
    'dialog.no': 'No',
    'dialog.delete': 'Delete',
    'dialog.save': 'Save',

    // Toast 相关
    'toast.success': 'Success',
    'toast.error': 'Error',
    'toast.warning': 'Warning',
    'toast.info': 'Info',
    'toast.close': 'Close',
    'toast.undo': 'Undo',

    // 通用
    'common.loading': 'Loading...',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.close': 'Close',
    'common.retry': 'Retry',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',
    'common.finish': 'Finish',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.view': 'View',
    'common.add': 'Add',
    'common.remove': 'Remove',
    'common.clear': 'Clear',
    'common.reset': 'Reset',
    'common.refresh': 'Refresh',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.sort': 'Sort',
    'common.export': 'Export',
    'common.import': 'Import',
    'common.copy': 'Copy',
    'common.paste': 'Paste',
    'common.cut': 'Cut',
    'common.selectAll': 'Select All',
    'common.deselectAll': 'Deselect All',

    // 错误消息
    'error.generic': 'An error occurred',
    'error.network': 'Network error',
    'error.timeout': 'Request timeout',
    'error.unauthorized': 'Unauthorized',
    'error.forbidden': 'Forbidden',
    'error.notFound': 'Not found',
    'error.serverError': 'Server error',
    'error.validation': 'Validation error',
  },

  'zh-CN': {
    // DataTable 相关
    'table.search': '搜索...',
    'table.noResults': '暂无数据',
    'table.loading': '加载中...',
    'table.rowsPerPage': '每页显示',
    'table.page': '第',
    'table.of': '页，共',
    'table.previous': '上一页',
    'table.next': '下一页',
    'table.first': '首页',
    'table.last': '末页',
    'table.selectAll': '全选',
    'table.selectRow': '选择行',
    'table.actions': '操作',
    'table.columns': '列',
    'table.toggleColumns': '切换列显示',
    'table.sortAsc': '升序排列',
    'table.sortDesc': '降序排列',
    'table.unsort': '取消排序',
    'table.filter': '筛选',
    'table.clearFilter': '清除筛选',
    'table.selectedRows': '已选择 {count} 行',

    // FormBuilder 相关
    'form.submit': '提交',
    'form.cancel': '取消',
    'form.save': '保存',
    'form.reset': '重置',
    'form.loading': '提交中...',
    'form.required': '此字段为必填项',
    'form.invalid': '输入值无效',
    'form.minLength': '至少需要 {min} 个字符',
    'form.maxLength': '最多允许 {max} 个字符',
    'form.email': '请输入有效的邮箱地址',
    'form.url': '请输入有效的网址',
    'form.number': '请输入有效的数字',
    'form.min': '值必须大于等于 {min}',
    'form.max': '值必须小于等于 {max}',
    'form.pattern': '格式不正确',
    'form.selectOption': '请选择选项',
    'form.selectMultiple': '请选择选项',
    'form.noOptions': '暂无选项',
    'form.searchOptions': '搜索选项...',
    'form.addItem': '添加项目',
    'form.removeItem': '移除项目',
    'form.uploadFile': '上传文件',
    'form.dragDropFile': '拖拽文件到此处，或点击选择文件',
    'form.fileSize': '文件大小必须小于 {size}',
    'form.fileType': '文件类型不支持',

    // SearchableSelect 相关
    'select.search': '搜索...',
    'select.noResults': '暂无结果',
    'select.loading': '加载中...',
    'select.placeholder': '请选择',
    'select.multiPlaceholder': '请选择选项',
    'select.clear': '清除',
    'select.clearAll': '清除全部',
    'select.selected': '已选择 {count} 项',

    // Dialog 相关
    'dialog.close': '关闭',
    'dialog.confirm': '确认',
    'dialog.cancel': '取消',
    'dialog.ok': '确定',
    'dialog.yes': '是',
    'dialog.no': '否',
    'dialog.delete': '删除',
    'dialog.save': '保存',

    // Toast 相关
    'toast.success': '成功',
    'toast.error': '错误',
    'toast.warning': '警告',
    'toast.info': '信息',
    'toast.close': '关闭',
    'toast.undo': '撤销',

    // 通用
    'common.loading': '加载中...',
    'common.save': '保存',
    'common.cancel': '取消',
    'common.confirm': '确认',
    'common.close': '关闭',
    'common.retry': '重试',
    'common.back': '返回',
    'common.next': '下一步',
    'common.previous': '上一步',
    'common.finish': '完成',
    'common.edit': '编辑',
    'common.delete': '删除',
    'common.view': '查看',
    'common.add': '添加',
    'common.remove': '移除',
    'common.clear': '清除',
    'common.reset': '重置',
    'common.refresh': '刷新',
    'common.search': '搜索',
    'common.filter': '筛选',
    'common.sort': '排序',
    'common.export': '导出',
    'common.import': '导入',
    'common.copy': '复制',
    'common.paste': '粘贴',
    'common.cut': '剪切',
    'common.selectAll': '全选',
    'common.deselectAll': '取消全选',

    // 错误消息
    'error.generic': '发生错误',
    'error.network': '网络错误',
    'error.timeout': '请求超时',
    'error.unauthorized': '未授权',
    'error.forbidden': '禁止访问',
    'error.notFound': '未找到',
    'error.serverError': '服务器错误',
    'error.validation': '验证错误',
  }
}

/**
 * 获取翻译消息
 */
export function getMessage(
  key: string,
  locale: string = 'zh-CN',
  params?: Record<string, string>
): string {
  const messages = defaultMessages[locale as keyof typeof defaultMessages] || defaultMessages['zh-CN']
  let message = messages[key as keyof typeof messages] || key

  // 替换参数
  if (params) {
    Object.entries(params).forEach(([paramKey, value]) => {
      message = message.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), value)
    })
  }

  return message
}

/**
 * 检查是否支持指定语言
 */
export function isSupportedLocale(locale: string): boolean {
  return locale in defaultMessages
}

/**
 * 获取支持的语言列表
 */
export function getSupportedLocales(): string[] {
  return Object.keys(defaultMessages)
}
