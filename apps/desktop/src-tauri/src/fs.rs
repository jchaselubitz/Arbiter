use serde::Serialize;
use sha2::{Digest, Sha256};
use std::fs;
use std::io::{self, Write};
use std::path::{Path, PathBuf};

#[derive(Debug, Serialize)]
pub struct FileState {
    pub path: String,
    pub exists: bool,
    pub content: Option<String>,
    pub writable_by_app: bool,
    pub is_symlink: bool,
    pub resolved_path: Option<String>,
    pub diagnostics: Vec<String>,
}

pub fn read_text(path: &Path) -> FileState {
    let mut diagnostics = Vec::new();
    let meta = fs::symlink_metadata(path);
    let Ok(metadata) = meta else {
        return FileState {
            path: path.to_string_lossy().to_string(),
            exists: false,
            content: None,
            writable_by_app: false,
            is_symlink: false,
            resolved_path: None,
            diagnostics,
        };
    };

    let is_symlink = metadata.file_type().is_symlink();
    let resolved_path = if is_symlink { fs::canonicalize(path).ok().map(path_to_string) } else { None };
    if !metadata.file_type().is_file() && !is_symlink {
        diagnostics.push("Path exists but is not a regular file.".to_string());
    }

    let content = match fs::read_to_string(path) {
        Ok(value) => Some(value),
        Err(error) => {
            diagnostics.push(format!("Unable to read file: {error}"));
            None
        }
    };

    let writable_by_app = path.parent().map(|parent| parent.exists()).unwrap_or(false)
        && fs::OpenOptions::new().append(true).open(path).is_ok();

    FileState {
        path: path.to_string_lossy().to_string(),
        exists: true,
        content,
        writable_by_app,
        is_symlink,
        resolved_path,
        diagnostics,
    }
}

pub fn ensure_parent(path: &Path) -> io::Result<()> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }
    Ok(())
}

pub fn atomic_write(path: &Path, content: &str) -> io::Result<()> {
    ensure_parent(path)?;
    let parent = path.parent().unwrap_or_else(|| Path::new("."));
    let tmp = parent.join(format!(
        ".{}.arbiter.tmp",
        path.file_name().and_then(|name| name.to_str()).unwrap_or("write")
    ));
    {
        let mut file = fs::File::create(&tmp)?;
        file.write_all(content.as_bytes())?;
        file.sync_all()?;
    }
    fs::rename(tmp, path)?;
    Ok(())
}

pub fn sha256(content: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(content.as_bytes());
    format!("{:x}", hasher.finalize())
}

pub fn path_to_string(path: PathBuf) -> String {
    path.to_string_lossy().to_string()
}
