use tauri_plugin_shell::ShellExt;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() -> Result<(), tauri::Error> {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_log::Builder::new()
                .level(log::LevelFilter::Info)
                .targets([
                    tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::LogDir {
                        file_name: Some("smarthome".to_string()),
                    }),
                    tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::Webview),
                ])
                .build(),
        )
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .setup(|app| {
            // B 方案：桌面端内置本地 API（sidecar），默认监听 127.0.0.1:3000
            // - A 方案：用户也可将前端 API_BASE 指向远端，此时本地 API 可不使用
            let shell = app.shell();

            if let Ok(app_data_dir) = app.path().app_data_dir() {
                let db_path = app_data_dir.join("smarthome.db");
                let uploads_dir = app_data_dir.join("uploads");

                let mut cmd = shell
                    .sidecar("node")
                    .map_err(|e| tauri::Error::Setup(e.to_string()))?;

                let api_entry = app
                    .path()
                    .resolve("resources/api/dist/main.js", tauri::path::BaseDirectory::Resource)
                    .map_err(|e| tauri::Error::Setup(e.to_string()))?;

                cmd = cmd.args([api_entry.to_string_lossy().to_string()]);
                cmd = cmd.env("PORT", "3000");
                cmd = cmd.env("DATABASE_PROVIDER", "sqlite");
                cmd = cmd.env("DATABASE_URL", format!("file:{}", db_path.to_string_lossy()));
                cmd = cmd.env("UPLOADS_DIR", uploads_dir.to_string_lossy().to_string());
                cmd = cmd.env("NODE_ENV", "production");
                cmd = cmd.env("SWAGGER_ENABLED", "false");
                cmd = cmd.env("CORS_ORIGIN", "tauri://localhost");
                // Ensure node resolves dependencies from the bundled API folder
                if let Ok(api_root) = app.path().resolve("resources/api", tauri::path::BaseDirectory::Resource) {
                    cmd = cmd.current_dir(api_root.clone());
                    cmd = cmd.env(
                        "NODE_PATH",
                        api_root.join("node_modules").to_string_lossy().to_string(),
                    );
                }

                if let Ok(seed) = app
                    .path()
                    .resolve("resources/binaries/seed.db", tauri::path::BaseDirectory::Resource)
                {
                    if seed.exists() {
                        cmd = cmd.env("DESKTOP_SEED_DB", seed.to_string_lossy().to_string());
                    }
                }

                // Fire-and-forget; if it fails, frontend will show API errors.
                let _child = cmd.spawn();
            }

            Ok(())
        })
        .run(tauri::generate_context!())
}
