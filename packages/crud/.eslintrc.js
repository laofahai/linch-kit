module.exports = {
  extends: ['../../.eslintrc.js'],
  rules: {
    // 临时禁用 any 类型检查，待后续重构时解决
    '@typescript-eslint/no-explicit-any': 'off'
  }
}