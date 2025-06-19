#!/bin/bash

# 批量更新剩余包的配置文件

PACKAGES=("trpc" "crud" "ui")

for pkg in "${PACKAGES[@]}"; do
  echo "Updating $pkg..."
  
  # 更新 tsconfig.json
  if [ -f "packages/$pkg/tsconfig.json" ]; then
    cat > "packages/$pkg/tsconfig.json" << 'EOF'
{
  "extends": "../../configs/tsconfig.base.json",
  "compilerOptions": {
    "tsBuildInfoFile": ".tsbuildinfo"
  }
}
EOF
    echo "Updated packages/$pkg/tsconfig.json"
  fi
  
  # 更新 tsconfig.build.json
  if [ -f "packages/$pkg/tsconfig.build.json" ]; then
    cat > "packages/$pkg/tsconfig.build.json" << 'EOF'
{
  "extends": "../../configs/tsconfig.build.json"
}
EOF
    echo "Updated packages/$pkg/tsconfig.build.json"
  fi
  
  # 更新 tsup.config.ts
  if [ -f "packages/$pkg/tsup.config.ts" ]; then
    cat > "packages/$pkg/tsup.config.ts" << 'EOF'
import { createLibraryConfig } from '../../configs/tsup.base'

export default createLibraryConfig({
  entry: ['src/index.ts']
})
EOF
    echo "Updated packages/$pkg/tsup.config.ts"
  fi
done

echo "Batch update completed!"
