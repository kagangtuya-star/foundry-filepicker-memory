# FilePicker Memory

---

## English

### What this module does
`FilePicker Memory` remembers the last directory you opened in Foundry's file picker, then reopens the picker at that location next time.

### Who this is for
- GMs/players who upload many images, maps, music, or sound files
- Users working with S3 storage and buckets

### Features
- Stores history per picker type (`image`, `audio`, etc.)
- Stores source (`data` / `public` / `s3`)
- Restores S3 `bucket` together with path
- Includes a setting `Force restore last path` (enabled by default):
  on first open of a picker instance, it restores the remembered path even if the field already has a default file path

### Installation (beginner-friendly)
1. Install and enable `libWrapper`.
2. Put this module in `Data/modules/filepicker-memory/`.
3. Restart Foundry (or refresh module list), then enable `FilePicker Memory`.
4. Browse at least once in any file picker so the module can save history.

### Settings
- Path: `Game Settings -> Module Settings -> FilePicker Memory`
- Option: `Force restore last path` (default: enabled)
- Behavior:
  - Enabled: first picker open prefers remembered path, even when a default path already exists.
  - Disabled: restore only when target is empty/root.

### FAQ
1. It does not work  
   Make sure `libWrapper` is enabled, and confirm you already browsed at least once.
2. S3 path is not what I expect  
   Verify permissions for that `bucket` and confirm the bucket is available in your environment.
3. I do not want to override existing avatar path  
   Turn off `Force restore last path`.

### Compatibility
- Foundry Virtual Tabletop v13

### Localization
- Built-in: `Simplified Chinese` and `English`
- Language follows your Foundry client locale

### Data storage
- Stored in user `flags`
- `scope`: `filepicker-memory`
- `key`: `lastPaths`

## 简体中文

### 这是什么

`FilePicker Memory` 是一个 Foundry VTT v13 模组。  
它会记住你上一次打开文件选择器时所在的目录，下次再打开时自动回到那里。

### 适合谁

- 经常上传头像、地图、音乐、音效的 GM/玩家
- 使用 S3 存储并经常切换目录或桶的用户

### 功能说明

- 按文件类型分别记忆路径（例如 `image`、`audio`）。
- 同时记忆来源（`data` / `public` / `s3`）。
- 使用 `s3` 时会记忆并恢复 `bucket`。
- 提供设置项 `强制使用上次路径`（默认开启）：
  即使当前字段已有默认文件路径（例如角色已经有头像），首次打开文件选择器时也会优先跳到上次目录。

### 安装步骤

1. 安装并启用依赖模组 `libWrapper`。
2. 将本模组放入 Foundry 的 `Data/modules/filepicker-memory/` 目录。
3. 重启 Foundry 或在“管理模组”里刷新并启用 `FilePicker Memory`。
4. 打开任意文件选择器使用一次后，路径会开始被记忆。

### 设置项

- 路径：`游戏设置 -> 模组设置 -> FilePicker Memory`
- 选项：`强制使用上次路径`（默认：开启）
- 说明：
  - 开启：首次打开选择器时，无论是否已有默认路径，都优先使用上次目录。
  - 关闭：仅当目标为空/根目录时才恢复上次目录。

### 常见问题

1. 没有生效  
   先检查 `libWrapper` 是否启用，再确认你已经实际浏览过一次目录（第一次没有历史可恢复）。
2. S3 没跳到预期位置  
   确认账号对对应 `bucket` 有权限，且该桶在当前环境可见。
3. 我不想覆盖已有头像路径  
   关闭 `强制使用上次路径` 即可。

### 兼容性

- Foundry Virtual Tabletop v13

### 语言

- 内置 `简体中文` 与 `English`。
- 会跟随 Foundry 客户端语言自动切换。

### 数据存储

- 存储位置：当前用户 `flags`
- `scope`: `filepicker-memory`
- `key`: `lastPaths`
