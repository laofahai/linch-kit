'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var zod = require('zod');

/**
 * @linch-kit/schema v0.2.1
 * (c) 2025 Linch Kit
 * @license MIT
 */


// src/core/core-types.ts
var FIELD_META_SYMBOL = Symbol("fieldMeta");
var ENTITY_META_SYMBOL = Symbol("entityMeta");
function validateFieldConfig(config) {
  if (!config || typeof config !== "object") return false;
  const cfg = config;
  if (cfg.primary !== void 0 && typeof cfg.primary !== "boolean") return false;
  if (cfg.unique !== void 0 && typeof cfg.unique !== "boolean") return false;
  if (cfg.label !== void 0 && typeof cfg.label !== "string") return false;
  if (cfg.order !== void 0 && typeof cfg.order !== "number") return false;
  if (cfg.hidden !== void 0 && typeof cfg.hidden !== "boolean") return false;
  return true;
}

// src/core/optimized-decorators.ts
function defineFieldOptimized(schema, config) {
  if (!config) return schema;
  if (!validateFieldConfig(config)) {
    console.warn("Invalid field config provided, using default");
    return schema;
  }
  const metadata = {};
  if (config.primary) metadata.isPrimary = true;
  if (config.unique) metadata.isUnique = true;
  if (config.default !== void 0) metadata.defaultValue = config.default;
  schema[FIELD_META_SYMBOL] = {
    ...metadata,
    // 保存完整配置用于后续处理
    _fullConfig: config
  };
  return schema;
}
function defineEntityOptimized(name, fields, config) {
  const zodSchema = zod.z.object(fields);
  const metadata = {
    name,
    tableName: config?.tableName || name.toLowerCase(),
    indexes: config?.indexes,
    fields: {}
  };
  for (const [fieldName, fieldSchema] of Object.entries(fields)) {
    const fieldMeta = fieldSchema[FIELD_META_SYMBOL];
    if (fieldMeta) {
      metadata.fields[fieldName] = {
        name: fieldName,
        type: fieldSchema._def?.typeName || "unknown",
        isPrimary: fieldMeta.isPrimary,
        isUnique: fieldMeta.isUnique,
        isOptional: fieldSchema.isOptional(),
        defaultValue: fieldMeta.defaultValue
      };
    }
  }
  const entitySchema = zodSchema;
  entitySchema[ENTITY_META_SYMBOL] = metadata;
  return {
    name,
    schema: entitySchema,
    meta: metadata
  };
}
function primaryOptimized(schema) {
  return defineFieldOptimized(schema, { primary: true });
}
function uniqueOptimized(schema) {
  return defineFieldOptimized(schema, { unique: true });
}
function createdAtOptimized(schema) {
  return defineFieldOptimized(schema, { createdAt: true });
}
function updatedAtOptimized(schema) {
  return defineFieldOptimized(schema, { updatedAt: true });
}
function basicFieldOptimized(schema, config) {
  return defineFieldOptimized(schema, config);
}
function timestampFieldsOptimized() {
  return {
    createdAt: createdAtOptimized(zod.z.date()),
    updatedAt: updatedAtOptimized(zod.z.date())
  };
}

// src/test-performance.ts
var SimpleUser = defineEntityOptimized("SimpleUser", {
  id: primaryOptimized(zod.z.string().uuid()),
  email: uniqueOptimized(zod.z.string().email()),
  name: zod.z.string().min(1).max(100),
  ...timestampFieldsOptimized()
}, {
  tableName: "simple_users"
});
var ComplexUser = defineEntityOptimized("ComplexUser", {
  // 主键
  id: primaryOptimized(zod.z.string().uuid()),
  // 基本信息
  email: basicFieldOptimized(zod.z.string().email(), {
    label: "user.email",
    placeholder: "Enter your email",
    order: 1
  }),
  username: basicFieldOptimized(zod.z.string().min(3).max(50), {
    label: "user.username",
    placeholder: "Enter username",
    order: 2
  }),
  name: basicFieldOptimized(zod.z.string().min(1).max(100), {
    label: "user.name",
    placeholder: "Enter your name",
    order: 3
  }),
  // JSON 字段
  profile: defineFieldOptimized(zod.z.object({
    firstName: zod.z.string().optional(),
    lastName: zod.z.string().optional(),
    avatar: zod.z.string().url().optional(),
    bio: zod.z.string().max(500).optional()
  }).optional(), {
    label: "user.profile",
    order: 4,
    db: { type: "JSON" }
  }),
  preferences: defineFieldOptimized(zod.z.object({
    theme: zod.z.enum(["light", "dark"]).default("light"),
    language: zod.z.string().default("en"),
    notifications: zod.z.boolean().default(true)
  }).default({
    theme: "light",
    language: "en",
    notifications: true
  }), {
    label: "user.preferences",
    order: 5,
    db: { type: "JSON" }
  }),
  // 状态字段
  status: defineFieldOptimized(zod.z.enum(["active", "inactive"]).default("active"), {
    label: "user.status",
    order: 10
  }),
  emailVerified: defineFieldOptimized(zod.z.boolean().default(false), {
    label: "user.emailVerified",
    order: 11
  }),
  // 时间戳
  ...timestampFieldsOptimized()
}, {
  tableName: "complex_users",
  indexes: [
    { fields: ["email"], unique: true },
    { fields: ["username"], unique: true },
    { fields: ["status"] }
  ]
});
var TestEntities = {
  User1: defineEntityOptimized("User1", {
    id: primaryOptimized(zod.z.string()),
    name: zod.z.string(),
    ...timestampFieldsOptimized()
  }),
  User2: defineEntityOptimized("User2", {
    id: primaryOptimized(zod.z.string()),
    email: uniqueOptimized(zod.z.string().email()),
    ...timestampFieldsOptimized()
  }),
  User3: defineEntityOptimized("User3", {
    id: primaryOptimized(zod.z.string()),
    data: defineFieldOptimized(zod.z.object({
      value: zod.z.string()
    }), {
      db: { type: "JSON" }
    }),
    ...timestampFieldsOptimized()
  }),
  User4: defineEntityOptimized("User4", {
    id: primaryOptimized(zod.z.string()),
    items: defineFieldOptimized(zod.z.array(zod.z.string()), {
      db: { type: "JSON" }
    }),
    ...timestampFieldsOptimized()
  }),
  User5: defineEntityOptimized("User5", {
    id: primaryOptimized(zod.z.string()),
    config: defineFieldOptimized(zod.z.record(zod.z.string(), zod.z.unknown()), {
      db: { type: "JSON" }
    }),
    ...timestampFieldsOptimized()
  })
};
var CreateSimpleUserSchema = SimpleUser.schema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var CreateComplexUserSchema = ComplexUser.schema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var test_performance_default = {
  SimpleUser,
  ComplexUser,
  TestEntities
};

exports.ComplexUser = ComplexUser;
exports.CreateComplexUserSchema = CreateComplexUserSchema;
exports.CreateSimpleUserSchema = CreateSimpleUserSchema;
exports.SimpleUser = SimpleUser;
exports.TestEntities = TestEntities;
exports.default = test_performance_default;
//# sourceMappingURL=test-performance.js.map
//# sourceMappingURL=test-performance.js.map