use once_cell::sync::Lazy;
use serde::Serialize;
use std::ptr::null_mut;
use std::sync::Mutex;
use std::thread;
use std::time::Duration;

#[cfg(target_os = "windows")]
use windows_sys::Win32::Foundation::HWND;
#[cfg(target_os = "windows")]
use windows_sys::Win32::System::Threading::{AttachThreadInput, GetCurrentThreadId};
#[cfg(target_os = "windows")]
use windows_sys::Win32::UI::WindowsAndMessaging::{
    GetClassNameW, GetForegroundWindow, GetWindowTextLengthW, GetWindowTextW, GetWindowThreadProcessId,
    IsIconic, IsWindow, IsWindowVisible, SetForegroundWindow, ShowWindow, SW_RESTORE, SW_SHOW,
};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum EditorKind {
    Word,
    Typora,
    VsCode,
    NotepadPlusPlus,
    Wps,
    Unknown,
}

impl EditorKind {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Word => "word",
            Self::Typora => "typora",
            Self::VsCode => "vscode",
            Self::NotepadPlusPlus => "notepadpp",
            Self::Wps => "wps",
            Self::Unknown => "unknown",
        }
    }

    pub fn is_supported(self) -> bool {
        !matches!(self, Self::Unknown)
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct WindowInfo {
    pub hwnd: i64,
    pub title: String,
    pub class_name: String,
    pub editor_kind: String,
    pub supported: bool,
    pub source: String,
}

impl WindowInfo {
    fn unavailable() -> Self {
        Self {
            hwnd: 0,
            title: "No editor window detected".to_string(),
            class_name: String::new(),
            editor_kind: EditorKind::Unknown.as_str().to_string(),
            supported: false,
            source: "none".to_string(),
        }
    }
}

static LAST_EXTERNAL_WINDOW: Lazy<Mutex<Option<WindowInfo>>> = Lazy::new(|| Mutex::new(None));

#[cfg(target_os = "windows")]
fn is_own_process(hwnd: HWND) -> bool {
    let mut pid: u32 = 0;
    unsafe {
        GetWindowThreadProcessId(hwnd, &mut pid as *mut u32);
    }
    pid == std::process::id()
}

fn detect_editor_kind(title: &str, class_name: &str) -> EditorKind {
    let t = title.to_lowercase();
    let c = class_name.to_lowercase();

    if c == "notepad++" || t.contains("notepad++") {
        return EditorKind::NotepadPlusPlus;
    }
    if t.contains("visual studio code") || t.contains(" - code") || t.contains(" - code-insiders")
    {
        return EditorKind::VsCode;
    }
    if t.contains("typora") {
        return EditorKind::Typora;
    }
    if t.contains("wps") || c.contains("wps") {
        return EditorKind::Wps;
    }
    if c == "opusapp" || t.contains("microsoft word") || t.contains(" - word") {
        return EditorKind::Word;
    }

    EditorKind::Unknown
}

#[cfg(target_os = "windows")]
fn read_window_text(hwnd: HWND) -> String {
    let len = unsafe { GetWindowTextLengthW(hwnd) };
    if len <= 0 {
        return String::new();
    }
    let mut buf = vec![0u16; (len as usize) + 1];
    let written = unsafe { GetWindowTextW(hwnd, buf.as_mut_ptr(), len + 1) };
    if written <= 0 {
        return String::new();
    }
    String::from_utf16_lossy(&buf[..written as usize])
        .trim()
        .to_string()
}

#[cfg(target_os = "windows")]
fn read_class_name(hwnd: HWND) -> String {
    let mut buf = vec![0u16; 256];
    let written = unsafe { GetClassNameW(hwnd, buf.as_mut_ptr(), 256) };
    if written <= 0 {
        return String::new();
    }
    String::from_utf16_lossy(&buf[..written as usize])
        .trim()
        .to_string()
}

#[cfg(target_os = "windows")]
fn window_info_from_hwnd(hwnd: HWND, source: &str) -> Option<WindowInfo> {
    if hwnd.is_null() {
        return None;
    }
    if unsafe { IsWindow(hwnd) } == 0 || unsafe { IsWindowVisible(hwnd) } == 0 {
        return None;
    }

    let title = read_window_text(hwnd);
    let class_name = read_class_name(hwnd);
    let editor_kind = detect_editor_kind(&title, &class_name);

    Some(WindowInfo {
        hwnd: hwnd as i64,
        title,
        class_name,
        editor_kind: editor_kind.as_str().to_string(),
        supported: editor_kind.is_supported(),
        source: source.to_string(),
    })
}

#[cfg(target_os = "windows")]
fn foreground_window_info() -> Option<WindowInfo> {
    let hwnd = unsafe { GetForegroundWindow() };
    window_info_from_hwnd(hwnd, "foreground")
}

pub fn start_foreground_tracker() {
    thread::spawn(|| loop {
        #[cfg(target_os = "windows")]
        {
            if let Some(info) = foreground_window_info() {
                if info.hwnd != 0 {
                    let hwnd = info.hwnd as HWND;
                    if !is_own_process(hwnd) {
                        let mut guard = LAST_EXTERNAL_WINDOW.lock().expect("window tracker poisoned");
                        *guard = Some(WindowInfo {
                            source: "last_seen".to_string(),
                            ..info
                        });
                    }
                }
            }
        }
        thread::sleep(Duration::from_millis(250));
    });
}

pub fn current_editor_context() -> WindowInfo {
    #[cfg(target_os = "windows")]
    {
        if let Some(info) = foreground_window_info() {
            if !is_own_process(info.hwnd as HWND) {
                return info;
            }
        }
        if let Some(saved) = LAST_EXTERNAL_WINDOW
            .lock()
            .expect("window tracker poisoned")
            .clone()
        {
            return saved;
        }
    }

    WindowInfo::unavailable()
}

pub fn select_target_editor() -> Result<WindowInfo, String> {
    let context = current_editor_context();
    if context.hwnd == 0 {
        return Err("No editor window detected. Focus your editor once, then retry.".to_string());
    }
    if !context.supported {
        return Err(format!(
            "Unsupported editor window: '{}' (class: {}).",
            context.title, context.class_name
        ));
    }
    Ok(context)
}

pub fn editor_kind_from_window(info: &WindowInfo) -> EditorKind {
    detect_editor_kind(&info.title, &info.class_name)
}

pub fn foreground_hwnd() -> i64 {
    #[cfg(target_os = "windows")]
    {
        return unsafe { GetForegroundWindow() as i64 };
    }
    #[allow(unreachable_code)]
    0
}

pub fn focus_window(hwnd: i64) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    unsafe {
        let hwnd = hwnd as HWND;
        if hwnd.is_null() || IsWindow(hwnd) == 0 {
            return Err("Target editor window is no longer available.".to_string());
        }

        if IsIconic(hwnd) != 0 {
            ShowWindow(hwnd, SW_RESTORE);
        }

        let current_foreground = GetForegroundWindow();
        let this_thread = GetCurrentThreadId();
        let foreground_thread = if current_foreground != null_mut() {
            GetWindowThreadProcessId(current_foreground, null_mut())
        } else {
            0
        };

        if foreground_thread != 0 && foreground_thread != this_thread {
            AttachThreadInput(this_thread, foreground_thread, 1);
            SetForegroundWindow(hwnd);
            AttachThreadInput(this_thread, foreground_thread, 0);
        } else {
            SetForegroundWindow(hwnd);
        }
        ShowWindow(hwnd, SW_SHOW);

        thread::sleep(Duration::from_millis(120));

        if GetForegroundWindow() != hwnd {
            return Err("Failed to focus target editor window.".to_string());
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        let _ = hwnd;
        return Err("Active editor automation is only supported on Windows.".to_string());
    }

    Ok(())
}
