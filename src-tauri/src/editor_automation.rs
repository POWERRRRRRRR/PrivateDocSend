use crate::active_window::{self, EditorKind, WindowInfo};
use crate::clipboard_bridge;
use serde::{Deserialize, Serialize};
use std::thread;
use std::time::Duration;

#[cfg(target_os = "windows")]
use windows_sys::Win32::UI::Input::KeyboardAndMouse::{
    SendInput, INPUT, INPUT_0, INPUT_KEYBOARD, KEYBDINPUT, KEYEVENTF_KEYUP, VK_A, VK_CONTROL,
    VK_ESCAPE, VK_H, VK_MENU, VK_RETURN, VK_TAB, VK_V,
};
#[cfg(target_os = "windows")]
use windows_sys::Win32::UI::WindowsAndMessaging::FindWindowW;

#[derive(Debug, Clone, Deserialize)]
pub struct MappingEntryInput {
    pub placeholder: String,
    pub original: String,
    pub entity_type: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct AutomationResponse {
    pub ok: bool,
    pub message: String,
    pub steps: usize,
    pub target: Option<WindowInfo>,
}

pub fn replace_all_in_active_editor(
    find_text: &str,
    replace_text: &str,
) -> Result<AutomationResponse, String> {
    if find_text.trim().is_empty() {
        return Err("Find text cannot be empty.".to_string());
    }

    let caller_hwnd = active_window::foreground_hwnd();
    let target = active_window::select_target_editor()?;
    let kind = active_window::editor_kind_from_window(&target);
    ensure_shortcut_compatibility(kind)?;
    let clipboard_snapshot = clipboard_bridge::capture_clipboard();

    let result = (|| {
        active_window::focus_window(target.hwnd)?;
        run_replace_cycle(kind, find_text, replace_text)?;
        Ok::<(), String>(())
    })();

    let restore_result = clipboard_bridge::restore_clipboard(&clipboard_snapshot);
    let _ = active_window::focus_window(caller_hwnd);

    if let Err(err) = result {
        return Err(err);
    }
    if let Err(err) = restore_result {
        return Err(err);
    }

    Ok(AutomationResponse {
        ok: true,
        message: format!("Replace-all executed in '{}' window.", target.title.trim()),
        steps: 1,
        target: Some(target),
    })
}

pub fn restore_all_in_active_editor(
    mut mapping: Vec<MappingEntryInput>,
) -> Result<AutomationResponse, String> {
    if mapping.is_empty() {
        return Err("Mapping is empty.".to_string());
    }

    mapping.retain(|entry| !entry.placeholder.trim().is_empty() && !entry.original.is_empty());
    mapping.sort_by(|a, b| b.placeholder.len().cmp(&a.placeholder.len()));
    if mapping.is_empty() {
        return Err("No valid mapping entries found.".to_string());
    }

    let caller_hwnd = active_window::foreground_hwnd();
    let target = active_window::select_target_editor()?;
    let kind = active_window::editor_kind_from_window(&target);
    ensure_shortcut_compatibility(kind)?;
    let clipboard_snapshot = clipboard_bridge::capture_clipboard();

    let result = (|| {
        active_window::focus_window(target.hwnd)?;
        let mut steps = 0usize;
        for entry in &mapping {
            let _ = entry.entity_type.as_str();
            run_replace_cycle(kind, &entry.placeholder, &entry.original)?;
            steps += 1;
        }
        Ok::<usize, String>(steps)
    })();

    let restore_result = clipboard_bridge::restore_clipboard(&clipboard_snapshot);
    let _ = active_window::focus_window(caller_hwnd);

    let steps = result?;
    if let Err(err) = restore_result {
        return Err(err);
    }

    Ok(AutomationResponse {
        ok: true,
        message: format!("Restore-all executed with {steps} mapping entries."),
        steps,
        target: Some(target),
    })
}

fn run_replace_cycle(kind: EditorKind, find_text: &str, replace_text: &str) -> Result<(), String> {
    open_replace_dialog()?;
    fill_current_input(find_text)?;
    press_key(VK_TAB as u16)?;
    wait_ms(80);
    fill_current_input(replace_text)?;
    trigger_replace_all(kind)?;
    wait_ms(200);
    finalize_replace_dialog(kind)?;
    Ok(())
}

fn open_replace_dialog() -> Result<(), String> {
    send_combo(&[VK_CONTROL as u16], VK_H as u16)?;
    wait_ms(220);
    Ok(())
}

fn fill_current_input(value: &str) -> Result<(), String> {
    clipboard_bridge::set_text(value)?;
    send_combo(&[VK_CONTROL as u16], VK_A as u16)?;
    wait_ms(50);
    send_combo(&[VK_CONTROL as u16], VK_V as u16)?;
    wait_ms(100);
    Ok(())
}

fn trigger_replace_all(kind: EditorKind) -> Result<(), String> {
    match kind {
        EditorKind::VsCode => {
            send_combo(&[VK_CONTROL as u16, VK_MENU as u16], VK_RETURN as u16)?;
        }
        EditorKind::Typora => {
            // Typora behavior varies across versions/themes: the same action may
            // apply to only one match instead of all matches. Run multiple passes
            // to emulate replace-all safely without touching document model.
            const TYPORA_COMPAT_PASSES: usize = 80;
            for _ in 0..TYPORA_COMPAT_PASSES {
                send_combo(&[VK_CONTROL as u16, VK_MENU as u16], VK_RETURN as u16)?;
                wait_ms(24);
            }
        }
        EditorKind::Word | EditorKind::Wps | EditorKind::NotepadPlusPlus => {
            send_combo(&[VK_MENU as u16], VK_A as u16)?;
        }
        EditorKind::Unknown => {
            send_combo(&[VK_MENU as u16], VK_A as u16)?;
            wait_ms(80);
            send_combo(&[VK_CONTROL as u16, VK_MENU as u16], VK_RETURN as u16)?;
        }
    }
    wait_ms(120);
    Ok(())
}

fn finalize_replace_dialog(kind: EditorKind) -> Result<(), String> {
    if matches!(
        kind,
        EditorKind::Word | EditorKind::Wps | EditorKind::NotepadPlusPlus
    ) {
        // Word/WPS may show replace summary dialog that needs confirmation.
        press_key(VK_RETURN as u16)?;
        wait_ms(80);
    }

    // Close remaining replace UI (single or double ESC depending on editor state).
    press_key(VK_ESCAPE as u16)?;
    wait_ms(70);
    press_key(VK_ESCAPE as u16)?;
    wait_ms(70);
    Ok(())
}

fn ensure_shortcut_compatibility(kind: EditorKind) -> Result<(), String> {
    if is_wechat_running()
        && matches!(
            kind,
            EditorKind::Word | EditorKind::Wps | EditorKind::NotepadPlusPlus | EditorKind::Unknown
        )
    {
        return Err(
            "Detected WeChat screenshot shortcut conflict (Alt+A). Please disable WeChat screenshot hotkey or close WeChat, then retry.".to_string(),
        );
    }

    Ok(())
}

#[cfg(target_os = "windows")]
fn is_wechat_running() -> bool {
    let class_name: Vec<u16> = "WeChatMainWndForPC\0".encode_utf16().collect();
    unsafe { FindWindowW(class_name.as_ptr(), std::ptr::null()) != std::ptr::null_mut() }
}

#[cfg(not(target_os = "windows"))]
fn is_wechat_running() -> bool {
    false
}

fn wait_ms(ms: u64) {
    thread::sleep(Duration::from_millis(ms));
}

#[cfg(target_os = "windows")]
fn send_combo(modifiers: &[u16], key: u16) -> Result<(), String> {
    for &modifier in modifiers {
        key_event(modifier, false)?;
    }
    key_event(key, false)?;
    key_event(key, true)?;
    for &modifier in modifiers.iter().rev() {
        key_event(modifier, true)?;
    }
    Ok(())
}

#[cfg(target_os = "windows")]
fn press_key(key: u16) -> Result<(), String> {
    key_event(key, false)?;
    key_event(key, true)
}

#[cfg(target_os = "windows")]
fn key_event(vk: u16, key_up: bool) -> Result<(), String> {
    let flags = if key_up { KEYEVENTF_KEYUP } else { 0 };
    let input = INPUT {
        r#type: INPUT_KEYBOARD,
        Anonymous: INPUT_0 {
            ki: KEYBDINPUT {
                wVk: vk,
                wScan: 0,
                dwFlags: flags,
                time: 0,
                dwExtraInfo: 0,
            },
        },
    };
    let sent = unsafe {
        SendInput(
            1,
            &input as *const INPUT,
            std::mem::size_of::<INPUT>() as i32,
        )
    };
    if sent == 0 {
        return Err(format!("Keyboard automation failed for VK={vk}."));
    }
    Ok(())
}

#[cfg(not(target_os = "windows"))]
fn send_combo(_modifiers: &[u16], _key: u16) -> Result<(), String> {
    Err("Keyboard automation is only supported on Windows.".to_string())
}

#[cfg(not(target_os = "windows"))]
fn press_key(_key: u16) -> Result<(), String> {
    Err("Keyboard automation is only supported on Windows.".to_string())
}
