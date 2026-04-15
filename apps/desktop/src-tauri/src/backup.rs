use crate::fs::{ensure_parent, path_to_string, sha256};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Manager};

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BackupRequest {
    pub adapter_id: String,
    pub adapter_version: String,
    pub original_path: String,
    pub before: String,
    pub after: String,
    pub action_label: String,
    pub diff_summary: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct BackupRecord {
    pub id: String,
    pub created_at: String,
    pub app_version: String,
    pub adapter_id: String,
    pub adapter_version: String,
    pub original_path: String,
    pub backup_path: String,
    pub content_sha256_before: String,
    pub content_sha256_after: String,
    pub action_label: String,
    pub diff_summary: String,
}

pub fn create_backup(app: &AppHandle, request: &BackupRequest) -> Result<BackupRecord, String> {
    let root = backup_root(app)?;
    ensure_parent(&root.join("manifest.json")).map_err(|error| error.to_string())?;
    let created_at = Utc::now().to_rfc3339();
    let id = format!("backup-{}", Utc::now().timestamp_millis());
    let backup_path = root.join(format!("{id}.bak"));
    fs::write(&backup_path, &request.before).map_err(|error| error.to_string())?;

    let record = BackupRecord {
        id,
        created_at,
        app_version: env!("CARGO_PKG_VERSION").to_string(),
        adapter_id: request.adapter_id.clone(),
        adapter_version: request.adapter_version.clone(),
        original_path: request.original_path.clone(),
        backup_path: path_to_string(backup_path),
        content_sha256_before: sha256(&request.before),
        content_sha256_after: sha256(&request.after),
        action_label: request.action_label.clone(),
        diff_summary: request.diff_summary.clone(),
    };

    let mut records = list_backups(app)?;
    records.push(record.clone());
    fs::write(manifest_path(app)?, serde_json::to_string_pretty(&records).map_err(|error| error.to_string())?)
        .map_err(|error| error.to_string())?;
    Ok(record)
}

pub fn list_backups(app: &AppHandle) -> Result<Vec<BackupRecord>, String> {
    let path = manifest_path(app)?;
    if !path.exists() {
        return Ok(Vec::new());
    }
    let content = fs::read_to_string(path).map_err(|error| error.to_string())?;
    serde_json::from_str(&content).map_err(|error| error.to_string())
}

fn backup_root(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app.path().app_data_dir().map_err(|error| error.to_string())?.join("backups");
    fs::create_dir_all(&dir).map_err(|error| error.to_string())?;
    Ok(dir)
}

fn manifest_path(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(backup_root(app)?.join("manifest.json"))
}

pub fn is_expected_config_path(path: &Path, home_dir: &str, repo_path: Option<&str>) -> bool {
    let value = path.to_string_lossy();
    let home_allowed = [
        format!("{home_dir}/.claude/settings.json"),
        format!("{home_dir}/.codex/config.toml"),
        format!("{home_dir}/.cursor/cli-config.json"),
    ];
    if home_allowed.iter().any(|allowed| value == allowed.as_str()) {
        return true;
    }
    if let Some(repo) = repo_path {
        return [
            format!("{repo}/.claude/settings.json"),
            format!("{repo}/.claude/settings.local.json"),
            format!("{repo}/.cursor/cli.json"),
        ]
        .iter()
        .any(|allowed| value == allowed.as_str());
    }
    false
}
