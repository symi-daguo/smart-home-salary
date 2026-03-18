#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    if let Err(err) = smarthome_lib::run() {
        #[cfg(windows)]
        show_startup_error(&err.to_string());
        std::process::exit(1);
    }
}

#[cfg(windows)]
fn show_startup_error(details: &str) {
    use windows_sys::Win32::Foundation::HWND;
    use windows_sys::Win32::UI::WindowsAndMessaging::{MessageBoxW, MB_ICONERROR, MB_OK};

    let title = "SmartHome 启动失败";
    let message = format!(
        "应用启动失败，请将下述错误信息与日志一起反馈。\n\n错误：\n{details}\n\n日志位置（Windows）：\n%APPDATA%\\\\com.smarthome.desktop\\\\logs\\\\smarthome.log"
    );
    let message = message.replace("%APPDATA%", "%LOCALAPPDATA%");

    let title_w: Vec<u16> = title.encode_utf16().chain(std::iter::once(0)).collect();
    let msg_w: Vec<u16> = message.encode_utf16().chain(std::iter::once(0)).collect();

    unsafe {
        MessageBoxW(0 as HWND, msg_w.as_ptr(), title_w.as_ptr(), MB_OK | MB_ICONERROR);
    }
}
