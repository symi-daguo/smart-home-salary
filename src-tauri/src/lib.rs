use tauri::Manager;
use std::process::Command;
use std::thread;
use std::time::Duration;

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
            let app_handle = app.handle().clone();
            
            thread::spawn(move || {
                if let Ok(app_data_dir) = app_handle.path().app_data_dir() {
                    let db_path = app_data_dir.join("smarthome.db");
                    let uploads_dir = app_data_dir.join("uploads");
                    
                    let _ = std::fs::create_dir_all(&uploads_dir);
                    
                    let api_dir = app_data_dir.join("api");
                    let _ = std::fs::create_dir_all(&api_dir);
                    
                    let node_check = Command::new("node").arg("--version").output();
                    
                    if node_check.is_err() {
                        log::warn!("Node.js not found, running in A mode only");
                        return;
                    }
                    
                    let npm_check = Command::new("npm").arg("--version").output();
                    
                    if npm_check.is_err() {
                        log::warn!("npm not found, running in A mode only");
                        return;
                    }
                    
                    let api_installed = api_dir.join("node_modules").exists();
                    
                    if !api_installed {
                        log::info!("Installing API dependencies...");
                        
                        let api_source = app_handle
                            .path()
                            .resolve("resources/api", tauri::path::BaseDirectory::Resource);
                        
                        if let Ok(source_path) = api_source {
                            if source_path.exists() {
                                let _ = copy_dir_all(&source_path, &api_dir);
                                
                                let _ = Command::new("npm")
                                    .arg("install")
                                    .current_dir(&api_dir)
                                    .env("NODE_ENV", "production")
                                    .output();
                                
                                log::info!("API dependencies installed");
                            }
                        }
                    }
                    
                    let api_entry = api_dir.join("dist").join("main.js");
                    
                    if !api_entry.exists() {
                        log::warn!("API entry point not found, running in A mode only");
                        return;
                    }
                    
                    let mut cmd = Command::new("node");
                    cmd.arg(&api_entry)
                        .env("PORT", "3000")
                        .env("DATABASE_PROVIDER", "sqlite")
                        .env("DATABASE_URL", format!("file:{}", db_path.display()))
                        .env("UPLOADS_DIR", uploads_dir.display().to_string())
                        .env("NODE_ENV", "production")
                        .env("SWAGGER_ENABLED", "false")
                        .env("CORS_ORIGIN", "tauri://localhost")
                        .current_dir(&api_dir);
                    
                    match cmd.spawn() {
                        Ok(_) => {
                            log::info!("API server started on port 3000");
                            
                            thread::sleep(Duration::from_secs(3));
                        }
                        Err(e) => {
                            log::error!("Failed to start API: {}", e);
                        }
                    }
                }
            });
            
            Ok(())
        })
        .run(tauri::generate_context!())
}

fn copy_dir_all(src: &std::path::Path, dst: &std::path::Path) -> std::io::Result<()> {
    std::fs::create_dir_all(dst)?;
    
    for entry in std::fs::read_dir(src)? {
        let entry = entry?;
        let ty = entry.file_type()?;
        
        if ty.is_dir() {
            if entry.file_name() != "node_modules" && entry.file_name() != "dist" {
                copy_dir_all(&entry.path(), &dst.join(entry.file_name()))?;
            }
        } else {
            std::fs::copy(entry.path(), dst.join(entry.file_name()))?;
        }
    }
    
    Ok(())
}
