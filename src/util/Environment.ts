enum NodeEnv {
    Development = 'development',
    Production = 'production',
}

export const isDevelopment = () => process.env.NODE_ENV === NodeEnv.Development;
export const isProduction = () => process.env.NODE_ENV === NodeEnv.Production;