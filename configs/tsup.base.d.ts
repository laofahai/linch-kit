import { type Options } from 'tsup';
export interface TsupBaseOptions {
    /** 入口文件配置 */
    entry?: Options['entry'];
    /** 是否为 CLI 包 */
    isCli?: boolean;
    /** 是否为 React 组件库 */
    isReact?: boolean;
    /** 额外的外部依赖 */
    external?: string[];
    /** 是否启用代码分割 */
    splitting?: boolean;
    /** 是否启用 treeshaking */
    treeshake?: boolean;
    /** 自定义配置覆盖 */
    override?: Partial<Options>;
}
/**
 * 创建基础的 tsup 配置
 */
export declare function createTsupConfig(options?: TsupBaseOptions): Options;
/**
 * 标准库包配置
 */
export declare function createLibraryConfig(options?: Omit<TsupBaseOptions, 'isCli'>): Options | Options[] | ((overrideOptions: Options) => Options | Options[] | Promise<Options | Options[]>);
/**
 * CLI 包配置
 */
export declare function createCliConfig(options?: Omit<TsupBaseOptions, 'isCli'>): Options | Options[] | ((overrideOptions: Options) => Options | Options[] | Promise<Options | Options[]>);
/**
 * React 组件库配置
 */
export declare function createReactConfig(options?: Omit<TsupBaseOptions, 'isReact'>): Options | Options[] | ((overrideOptions: Options) => Options | Options[] | Promise<Options | Options[]>);
/**
 * 多入口配置
 */
export declare function createMultiEntryConfig(entries: Record<string, string>, options?: TsupBaseOptions): Options | Options[] | ((overrideOptions: Options) => Options | Options[] | Promise<Options | Options[]>);
//# sourceMappingURL=tsup.base.d.ts.map