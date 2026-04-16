use crate::backup::{create_backup, is_expected_config_path, list_backups as read_backup_manifest, BackupRecord, BackupRequest};
use crate::fs::{atomic_write, read_text, sha256, FileState};
use crate::validation::validate_write_target;
use serde::{Deserialize, Serialize};
use std::process::Command;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeContext {
    pub home_dir: String,
    pub platform: String,
    pub app_data_dir: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReadCandidateRequest {
    pub paths: Vec<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WriteRequest {
    pub path: String,
    pub before_hash: String,
    pub before: String,
    pub after: String,
    pub repo_path: Option<String>,
    pub backup: BackupRequest,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WriteResponse {
    pub backup: BackupRecord,
    pub reread: FileState,
}

#[tauri::command]
pub fn get_runtime_context(app: AppHandle) -> Result<RuntimeContext, String> {
    let home = std::env::var("HOME").map_err(|_| "HOME is not set".to_string())?;
    let platform = if cfg!(target_os = "macos") {
        "macos"
    } else if cfg!(target_os = "linux") {
        "linux"
    } else if cfg!(target_os = "windows") {
        "windows"
    } else {
        "unknown"
    };
    let app_data_dir = app.path().app_data_dir().map_err(|error| error.to_string())?;
    Ok(RuntimeContext {
        home_dir: home,
        platform: platform.to_string(),
        app_data_dir: app_data_dir.to_string_lossy().to_string(),
    })
}

#[tauri::command]
pub fn read_candidate_files(request: ReadCandidateRequest) -> Vec<FileState> {
    request.paths.iter().map(|path| read_text(&PathBuf::from(path))).collect()
}

#[tauri::command]
pub fn read_text_file(path: String) -> FileState {
    read_text(&PathBuf::from(path))
}

#[tauri::command]
pub fn write_permission_file(app: AppHandle, request: WriteRequest) -> Result<WriteResponse, String> {
    let home_dir = std::env::var("HOME").map_err(|_| "HOME is not set".to_string())?;
    let target = PathBuf::from(&request.path);
    if !is_expected_config_path(&target, &home_dir, request.repo_path.as_deref()) {
        return Err("Refusing to write outside known agent config paths.".to_string());
    }
    validate_write_target(&target)?;
    if sha256(&request.before) != request.before_hash {
        return Err("Planned before-hash does not match the submitted before content.".to_string());
    }
    if target.exists() {
        let current = std::fs::read_to_string(&target).map_err(|error| error.to_string())?;
        if sha256(&current) != request.before_hash {
            return Err("File changed since the change was planned. Re-run discovery before writing.".to_string());
        }
    }
    let backup = create_backup(&app, &request.backup)?;
    atomic_write(&target, &request.after).map_err(|error| error.to_string())?;
    let reread = read_text(&target);
    Ok(WriteResponse { backup, reread })
}

#[tauri::command]
pub fn list_backups(app: AppHandle) -> Result<Vec<BackupRecord>, String> {
    read_backup_manifest(&app)
}

#[tauri::command]
pub fn open_in_finder(path: String) -> Result<(), String> {
    let target = PathBuf::from(path);
    if !target.exists() {
        return Err("File does not exist.".to_string());
    }

    let status = if cfg!(target_os = "macos") {
        Command::new("open").arg("-R").arg(&target).status()
    } else if cfg!(target_os = "windows") {
        let arg = if target.is_dir() {
            target.to_string_lossy().to_string()
        } else {
            format!("/select,{}", target.to_string_lossy())
        };
        Command::new("explorer").arg(arg).status()
    } else {
        let target = if target.is_dir() {
            target
        } else {
            target.parent().map(PathBuf::from).unwrap_or(target)
        };
        Command::new("xdg-open").arg(target).status()
    };

    match status {
        Ok(exit) if exit.success() => Ok(()),
        Ok(exit) => Err(format!("Failed to open file manager (exit code: {:?}).", exit.code())),
        Err(error) => Err(format!("Failed to open file manager: {error}")),
    }
}
