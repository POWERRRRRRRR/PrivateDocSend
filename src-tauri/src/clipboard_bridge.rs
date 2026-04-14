use arboard::Clipboard;
use std::thread;
use std::time::Duration;

#[derive(Debug, Clone)]
pub struct ClipboardSnapshot {
    pub text: Option<String>,
}

fn with_retry<T, F>(mut op: F) -> Result<T, String>
where
    F: FnMut() -> Result<T, String>,
{
    let mut last_err = String::new();
    for _ in 0..5 {
        match op() {
            Ok(v) => return Ok(v),
            Err(err) => {
                last_err = err;
                thread::sleep(Duration::from_millis(40));
            }
        }
    }
    Err(last_err)
}

pub fn capture_clipboard() -> ClipboardSnapshot {
    let text = Clipboard::new().ok().and_then(|mut cb| cb.get_text().ok());
    ClipboardSnapshot { text }
}

pub fn set_text(text: &str) -> Result<(), String> {
    with_retry(|| {
        let mut clipboard = Clipboard::new().map_err(|e| format!("Clipboard open failed: {e}"))?;
        clipboard
            .set_text(text.to_string())
            .map_err(|e| format!("Clipboard write failed: {e}"))
    })
}

pub fn restore_clipboard(snapshot: &ClipboardSnapshot) -> Result<(), String> {
    match &snapshot.text {
        Some(text) => set_text(text),
        None => Ok(()),
    }
}
