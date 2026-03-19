module.exports = {
  apps: [
    {
      name: 'catalog-api',
      cwd: './api',
      script: 'pnpm',
      args: 'start',
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'catalog-web',
      cwd: './web',
      script: 'pnpm',
      args: 'start',
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'catalog-admin',
      cwd: './admin',
      script: 'pnpm',
      args: 'start',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
}
