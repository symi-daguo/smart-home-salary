use tauri::Manager;
use std::process::{Command, Stdio};
use std::time::Duration;
use std::thread;
use std::io::{Read, BufRead, BufReader};

fn check_api_health() -> bool {
    let mut attempts = 0;
    while attempts < 30 {
        let output = Command::new("powershell")
            .args(["-Command", "try { Invoke-WebRequest -Uri 'http://127.0.0.1:3000/api/health' -UseBasicParsing -TimeoutSec 2 | Select-Object -ExpandProperty StatusCode } catch { 0 }"])
            .output();

        let status_code = if let Ok(output) = output {
            let result = String::from_utf8_lossy(&output.stdout).trim().to_string();
            result.parse::<u16>().unwrap_or(0)
        } else {
            let curl_output = Command::new("curl")
                .args(["-s", "-o", "/dev/null", "-w", "%{http_code}", "http://127.0.0.1:3000/api/health"])
                .output();

            if let Ok(curl_out) = curl_output {
                String::from_utf8_lossy(&curl_out.stdout).trim().parse::<u16>().unwrap_or(0)
            } else {
                0
            }
        };

        if status_code == 200 {
            log::info!("API health check passed");
            return true;
        }

        attempts += 1;
        thread::sleep(Duration::from_secs(1));
        log::info!("Waiting for API to start... attempt {}", attempts);
    }
    log::warn!("API health check timed out after 30 seconds");
    false
}

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

    log::info!("API directory: {:?}", api_dir);
    log::info!("Database path: {:?}", db_path);

    let node_check = Command::new("node").arg("--version").output();

    if node_check.is_err() {
        log::error!("Node.js not found, cannot run B mode");
        return Ok(());
    }

    if let Ok(output) = &node_check {
        log::info!("Node version: {}", String::from_utf8_lossy(output.stdout).trim());
    }

    let npm_check = Command::new("npm").arg("--version").output();

    if npm_check.is_err() {
        log::error!("npm not found, cannot run B mode");
        return Ok(());
    }

    if let Ok(output) = &npm_check {
        log::info!("npm version: {}", String::from_utf8_lossy(output.stdout).trim());
    }

    let api_installed = api_dir.join("node_modules").exists();
    log::info!("API node_modules exists: {}", api_installed);

    if !api_installed {
        log::info!("Installing API dependencies for the first time...");

        let api_source = app_handle
            .path()
            .resolve("resources/api", tauri::path::BaseDirectory::Resource);

        if let Ok(source_path) = &api_source {
            log::info!("API source path: {:?}", source_path);
            if source_path.exists() {
                log::info!("Copying API resources...");
                let _ = copy_dir_all(source_path, &api_dir);
                log::info!("API resources copied, running npm install...");

                let install_result = Command::new("npm")
                    .arg("install")
                    .current_dir(&api_dir)
                    .env("NODE_ENV", "production")
                    .stdout(Stdio::piped())
                    .stderr(Stdio::piped())
                    .output();

                match install_result {
                    Ok(output) => {
                        if output.status.success() {
                            log::info!("npm install succeeded");
                        } else {
                            let stderr = String::from_utf8_lossy(&output.stderr);
                            let stdout = String::from_utf8_lossy(&output.stdout);
                            log::error!("npm install failed. stdout: {}, stderr: {}", stdout, stderr);
                        }
                    }
                    Err(e) => {
                        log::error!("Failed to run npm install: {}", e);
                    }
                }
            } else {
                log::error!("API source path does not exist: {:?}", source_path);
            }
        }
    } else {
        log::info!("API dependencies already installed, skipping npm install");
    }

    let api_entry = api_dir.join("dist").join("main.js");
    log::info!("API entry point: {:?}", api_entry);

    if !api_entry.exists() {
        log::error!("API entry point not found!");
        log::error!("API dist directory contents:");
        if let Ok(entries) = std::fs::read_dir(api_dir.join("dist")) {
            for entry in entries {
                if let Ok(entry) = entry {
                    log::error!("  - {:?}", entry.file_name());
                }
            }
        }
        return Ok(());
    }

    let seed_source = app_handle
        .path()
        .resolve("resources/binaries/seed.db", tauri::path::BaseDirectory::Resource);

    let seed_path = if let Ok(p) = &seed_source {
        if p.exists() {
            log::info!("Seed database found: {:?}", p);
            Some(p.clone())
        } else {
            log::warn!("Seed database not found at {:?}", p);
            None
        }
    } else {
        log::warn!("Could not resolve seed database path");
        None
    };

    log::info!("Starting API server...");

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
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    match cmd.spawn() {
        Ok(child) => {
            log::info!("API server spawned with PID: {:?}", child.id());

            if let Ok(output) = child.stdout {
                let reader = BufReader::new(output);
                for line in reader.lines().take(10) {
                    if let Ok(line) = line {
                        log::info!("[API] {}", line);
                    }
                }
            }

            log::info!("Waiting for API to be ready...");
            if check_api_health() {
                log::info!("API server is ready and accepting connections");
            } else {
                log::warn!("API may not be fully ready, but has been started");
            }
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
