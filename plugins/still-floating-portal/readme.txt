=== Still Floating 3D 开屏 ===
Version: 1.1.0
Requires at least: 6.0
Requires PHP: 7.4

完整保留提供的 3D 星球开屏成品及其本地 Three.js 资源。

安装：WordPress 后台 > 插件 > 安装插件 > 上传插件，上传 still-floating-portal-1.1.0.zip 并启用。
清除网站和 CDN 的首页缓存后，用新标签页访问网站首页。

首页展示开屏，底部提供两个站点入口：
  BLOG / 博客 —— 进入博客首页（?sf_blog=1；若已有独立文章列表页，则自动链接到该页）
  QUIZ / 刷题 —— 进入刷题站 https://quiz.stillfloating.top/
刷题地址可用过滤器 sf_portal_quiz_url 调整，无需改插件文件。
直接文章链接、后台、搜索、分页、Feed 不显示开屏。
原来的 Still Floating Site Transition 插件可以保持启用；本插件避免重复输出过渡脚本。
停用本插件即可恢复原来的首页，不修改文章、主题或 WordPress 首页设置。

缓存说明：运行时首页响应禁用页面缓存。若服务器/CDN 绕过 WordPress 直接返回已有缓存，
需清除旧缓存，并将首页和 sf_blog 参数请求排除在强制整页缓存规则之外。

1.1.0：开屏改为双入口（博客 + 刷题），刷题地址可过滤；构建产物文件名从 assets 目录自动解析。
1.0.1：移除过渡脚本对 html 背景色的永久覆盖，恢复 Argon 日夜壁纸。
