use std::fs;
use std::path::Path;

pub fn validate_write_target(path: &Path) -> Result<(), String> {
    if let Ok(metadata) = fs::symlink_metadata(path) {
        if metadata.file_type().is_symlink() {
            return Err("Refusing to write through a symlink in the MVP.".to_string());
        }
        if !metadata.file_type().is_file() {
            return Err("Refusing to write because the target is not a regular file.".to_string());
        }
    }
    Ok(())
}
