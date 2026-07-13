# Task-036G-1 Android Native Source Tracking Report

生成时间：2026-07-13

## 1. 结论

Task-036G-1 已完成 Android native 源码归档和可复现性修复。

- Android native 源码已从整体 ignored 调整为可追踪。
- Boot autostart 相关源码和 Manifest 声明已纳入 Git。
- HTTP cleartext preview 配置已纳入 Git。
- Gradle wrapper/config、app build config、原生入口、打印 Native Module、打印 SDK AAR、Android 资源已纳入 Git。
- APK/AAB、build outputs、Gradle cache、本地配置、keystore 文件仍保持 ignored。
- `pnpm typecheck`、`pnpm test`、Android `assembleRelease` 均已通过。

核心源码归档 commit:

- `69811ff74ee6890823ad4ea30065ee85101f46a2` `chore(app): track Android native preview sources`

## 2. 原始 ignored 状态

修复前，根 `.gitignore` 包含：

```gitignore
android/
```

检查结果：

- `git check-ignore -v android`: `.gitignore:9:android/ android`
- `git check-ignore -v android/app/src/main/AndroidManifest.xml`: `.gitignore:9:android/ android/app/src/main/AndroidManifest.xml`

风险：

- `android/app/src/main/AndroidManifest.xml`
- `android/app/src/main/java/com/aipos/app/BootCompletedReceiver.kt`
- `android/app/src/main/java/com/aipos/app/MainActivity.kt`
- `android/app/src/main/java/com/aipos/app/MainApplication.kt`
- `android/app/src/main/java/com/aipos/app/printer/*`
- Gradle wrapper/config
- app native resources
- printer SDK AAR

这些文件均无法进入 GitHub，重新 clone 后无法复现 Task-036E 已验证的 Android release APK、开机自启动、HTTP cleartext preview 和自动打印能力。

## 3. 修改后的 `.gitignore`

根 `.gitignore` 已移除整体忽略 `android/`，改为只忽略 Android 本地配置、构建产物和敏感文件：

```gitignore
android/local.properties
android/.gradle/
android/.idea/
android/build/
android/app/build/
android/app/.cxx/
android/key.properties
android/keystore.properties
*.apk
*.aab
*.jks
*.keystore
```

继续保留：

```gitignore
node_modules/
.expo/
dist/
build/
coverage/
*.log
.env
.env.*
```

## 4. 已纳入 Git 的 Android native 文件

Gradle / build config:

- `android/.gitignore`
- `android/settings.gradle`
- `android/build.gradle`
- `android/gradle.properties`
- `android/gradlew`
- `android/gradlew.bat`
- `android/gradle/wrapper/gradle-wrapper.jar`
- `android/gradle/wrapper/gradle-wrapper.properties`
- `android/app/build.gradle`
- `android/app/proguard-rules.pro`

Native source:

- `android/app/src/main/AndroidManifest.xml`
- `android/app/src/main/java/com/aipos/app/BootCompletedReceiver.kt`
- `android/app/src/main/java/com/aipos/app/MainActivity.kt`
- `android/app/src/main/java/com/aipos/app/MainApplication.kt`
- `android/app/src/main/java/com/aipos/app/printer/PrinterConnectionManager.kt`
- `android/app/src/main/java/com/aipos/app/printer/PrinterModule.kt`
- `android/app/src/main/java/com/aipos/app/printer/PrinterPackage.kt`
- `android/app/src/main/java/com/aipos/app/printer/ReceiptPrintMapper.kt`

Printer SDK:

- `android/app/libs/printer-lib-3.5.8.aar`

Android manifests/resources:

- `android/app/src/debug/AndroidManifest.xml`
- `android/app/src/debugOptimized/AndroidManifest.xml`
- `android/app/src/main/res/drawable-*/*`
- `android/app/src/main/res/mipmap-*/*`
- `android/app/src/main/res/values/colors.xml`
- `android/app/src/main/res/values/strings.xml`
- `android/app/src/main/res/values/styles.xml`
- `android/app/src/main/res/values-night/colors.xml`

## 5. 明确未纳入 Git 的内容

仍保持 ignored：

- `.expo/`
- `node_modules/`
- `android/.gradle/`
- `android/build/`
- `android/app/build/`
- `android/app/.cxx/`
- `android/app/debug.keystore`
- `*.apk`
- `*.aab`
- `*.jks`
- `*.keystore`
- `android/local.properties`
- `android/key.properties`
- `android/keystore.properties`

验证结果：

- `git check-ignore -v android/app/build/outputs/apk/release/app-release.apk`: ignored by `android/.gitignore:7:build/`
- `git check-ignore -v android/app/debug.keystore`: ignored by root `.gitignore` `*.keystore`

## 6. Boot autostart 可复现性

Boot autostart 已可从 Git 复现。

证据：

- `android/app/src/main/AndroidManifest.xml` 包含 `android.permission.RECEIVE_BOOT_COMPLETED`
- `android/app/src/main/AndroidManifest.xml` 注册 `.BootCompletedReceiver`
- receiver intent-filter 包含：
  - `android.intent.action.BOOT_COMPLETED`
  - `android.intent.action.LOCKED_BOOT_COMPLETED`
- `android/app/src/main/java/com/aipos/app/BootCompletedReceiver.kt` 存在并在收到 boot action 后启动 `MainActivity`
- `android/app/src/main/java/com/aipos/app/MainActivity.kt` 已纳入 Git

## 7. Cleartext preview 配置可复现性

HTTP cleartext preview 已可从 Git 复现。

证据：

- `app.json` 包含 `usesCleartextTraffic: true`
- `android/app/src/main/AndroidManifest.xml` 的 `<application>` 包含 `android:usesCleartextTraffic="true"`
- `android/app/src/debug/AndroidManifest.xml` 包含 `android:usesCleartextTraffic="true"`
- `android/app/src/debugOptimized/AndroidManifest.xml` 包含 `android:usesCleartextTraffic="true"`

当前 Android App API Base 保持：

- `EXPO_PUBLIC_API_BASE_URL=http://49.235.186.154/ai-pos`

未修改：

- `/ai-pos/`
- `/ai-pos/api`
- 未引入 `/api/api`

## 8. 安全检查结果

staged 后执行：

- `git diff --cached --name-only`
- staged artifact path scan:
  - `.apk`
  - `.aab`
  - `.jks`
  - `.keystore`
  - `local.properties`
  - `/build/`
  - `/.gradle/`
  - `/.cxx/`
  - `key.properties`
  - `keystore.properties`
- staged secret keyword scan:
  - `DEEPSEEK_API_KEY`
  - `DATABASE_URL`
  - `JWT_SECRET`
  - `PRIVATE KEY`
  - `keystorePassword`
  - `storePassword`
  - `keyPassword`
  - `ghp_`
  - `github_pat_`

结果：

- 未 staged APK/AAB。
- 未 staged build outputs。
- 未 staged `.gradle` / `.cxx` cache。
- 未 staged `local.properties`。
- 未 staged keystore 文件。
- 未发现真实 token/private key/数据库密码/JWT/DeepSeek key。
- 唯一 secret 关键词命中为 `android/app/build.gradle` debug signing config 中的默认值：
  - `storePassword 'android'`
  - `keyPassword 'android'`

说明：该命中为 Android debug signing 默认配置，不是 release keystore secret。本次未提交 `android/app/debug.keystore`。

## 9. 验证命令和结果

App TypeScript:

- `pnpm typecheck`: PASS

App tests:

- `pnpm test`: PASS, 15 tests passed

Android release build:

- `cd android && EXPO_PUBLIC_API_BASE_URL=http://49.235.186.154/ai-pos ./gradlew --no-daemon --stacktrace assembleRelease -PreactNativeArchitectures=arm64-v8a`
- Result: PASS
- Gradle output: `BUILD SUCCESSFUL in 35s`
- Tasks: `633 actionable tasks: 36 executed, 597 up-to-date`

说明：

- 首次在 sandbox 内运行 Gradle 时因无法写入 `~/.gradle` lock 文件失败。
- 经授权后重新运行同一 release build 命令并通过。
- build 生成的 APK 仍保持 ignored，未纳入 Git。

## 10. Push 状态

待报告提交后执行 push 到当前 branch：

- Branch: `develop`
- Remote: `origin git@chicha-github:zyycjjj/ai-pos-app.git`

## 11. 最终状态

源码归档 commit 后工作树仅剩 ignored 本地/构建内容：

- `.expo/`
- `android/.gradle/`
- `android/app/.cxx/`
- `android/app/build/`
- `android/app/debug.keystore`
- `android/build/`
- `node_modules/`

本任务修复后，重新 clone 仓库应具备复现当前 Android preview release build、boot autostart、HTTP cleartext preview、Native printer module 和打印 SDK 接入的必要源码基础。
