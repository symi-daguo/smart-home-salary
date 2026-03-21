use tauri::Manager;
use std::process::{Command, Stdio};

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
            
            std::thread::spawn(move || {
                let _ = start_api(&app_handle);
            });
            
            Ok(())
        })
        .run(tauri::generate_context!())
}

fn start_api(app_handle: &tauri::AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let app_data_dir = app_handle.path().app_data_dir()?;
    let db_path = app_data_dir.join("smarthome.db");
    let uploads_dir = app_data_dir.join("uploads");
    
    let _ = std::fs::create_dir_all(&uploads_dir);
    
    let api_dir = app_data_dir.join("api");
    let _ = std::fs::create_dir_all(&api_dir);
    
    let node_check = Command::new("node").arg("--version").output();
    
    if node_check.is_err() {
        log::warn!("Node.js not found, running in A mode only");
        return Ok(());
    }
    
    let npm_check = Command::new("npm").arg("--version").output();
    
    if npm_check.is_err() {
        log::warn!("npm not found, running in A mode only");
        return Ok(());
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
                
                let install_result = Command::new("npm")
                    .arg("install")
                    .current_dir(&api_dir)
                    .env("NODE_ENV", "production")
                    .output();
                
                match install_result {
                    Ok(output) => {
                        if output.status.success() {
                            log::info!("API dependencies installed successfully");
                        } else {
                            log::error!("npm install failed: {}", String::from_utf8_lossy(&output.stderr));
                        }
                    }
                    Err(e) => {
                        log::error!("Failed to run npm install: {}", e);
                    }
                }
            } else {
                log::warn!("API source not found in resources");
            }
        }
    }
    
    let api_entry = api_dir.join("dist").join("main.js");

    if !api_entry.exists() {
        log::warn!("API entry point not found at {:?}", api_entry);
        log::warn!("Running in A mode only");
        return Ok(());
    }

    let seed_source = app_handle
        .path()
        .resolve("resources/binaries/seed.db", tauri::path::BaseDirectory::Resource);

    let seed_path = if let Ok(p) = &seed_source {
        if p.exists() {
            Some(p.clone())
        } else {
            None
        }
    } else {
        None
    };

    let mut cmd = Command::new("node");
    cmd.arg(&api_entry)
        .env("PORT", "3000")
        .env("DATABASE_PROVIDER", "sqlite")
        .env("DATABASE_URL", format!("file:{}", db_path.display()))
        .env("UPLOADS_DIR", uploads_dir.display().to_string())
        .env("NODE_ENV", "production")
        .env("SWAGGER_ENABLED", "false")
        .env("CORS_ORIGIN", "tauri://localhost");

    if let Some(seed) = seed_path {
        cmd.env("DESKTOP_SEED_DB", seed.display().to_string());
    }

    cmd.current_dir(&api_dir)
        .stdout(Stdio::null())
        .stderr(Stdio::piped());

    match cmd.spawn() {
        Ok(_child) => {
            log::info!("API server started on port 3000");
        }
        Err(e) => {
            log::error!("Failed to start API server: {}", e);
        }
    }

    Ok(())
}

fn copy_dir_all(src: &std::path::Path, dst: &std::path::Path) -> std::io::Result<()> {
    std::fs::create_dir_all(dst)?;

    for entry in std::fs::read_dir(src)? {
        let entry = entry?;
        let ty = entry.file_type()?;

        if ty.is_dir() {
            copy_dir_all(&entry.path(), &dst.join(entry.file_name()))?;
        } else {
            std::fs::copy(entry.path(), dst.join(entry.file_name()))?;
        }
    }

    Ok(())
}
