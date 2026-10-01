# CI 集成样例（Jenkins）

模板自带 GitHub Actions 样例（`.github/workflows/ci.yml`）。团队实际 CI 在 Jenkins 时，参考以下声明式流水线；按项目情况裁剪。

```jenkinsfile
pipeline {
    agent any

    options {
        // 锁文件冻结安装；不要使用 --force（会绕过锁文件并拖慢构建）
        timestamps()
        timeout(time: 30, unit: 'MINUTES')
    }

    environment {
        // 内部 npm 源（@jhlc / @agile-team scope 同源）
        npm_config_registry = 'https://npm.walsin.com.cn/'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                // 核对 vendor/xlsx-0.20.3.tgz 完整性（本地冻结依赖）
                sh 'python3 -c "import hashlib;print(hashlib.sha256(open(\'vendor/xlsx-0.20.3.tgz\',\'rb\').read()).hexdigest().upper())" | grep 8DC73FC3B00203E72D176E85B50938627C7B086E607C682E8D3C22C02BB99FE8'
            }
        }

        stage('Install') {
            steps {
                sh 'corepack enable && pnpm install --frozen-lockfile --prefer-offline'
            }
        }

        stage('Quality') {
            steps {
                sh 'pnpm check'
                sh 'pnpm exec wl-ui check --project .'
            }
        }

        stage('Build') {
            steps {
                // 分支与环境一一对应：sit 分支构建 sit 包（串线防控由
                // wl-ui-public 闸门 + env.json 运行时接管兜底）
                sh 'pnpm build:sit'
            }
        }

        stage('Verify artifacts') {
            steps {
                // 身份卡与联邦产物核验
                sh 'test -f dist/env.json && test -f dist/version.js'
                sh 'test -f dist/assets/remoteEntry.js && test -f dist/assets/remoteEntry-tw.js'
            }
        }
    }

    post {
        always {
            archiveArtifacts artifacts: 'dist/env.json', fingerprint: false
        }
    }
}
```

## 分阶段计时建议

在 Install / Quality / Build 各 stage 记录耗时，用相同节点、相同 pnpm store、至少三次成功构建取中位数对比，避免把网络重试计入编译时间（对齐 produce 的性能基线方法）。
