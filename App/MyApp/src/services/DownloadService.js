/**
 * Download Service
 * Handles file downloads from Cloudinary to local storage
 */

import { Platform } from 'react-native';
import TrainingService from './TrainingService';

class DownloadService {
  constructor() {
    this.downloads = new Map(); // Track active downloads
    this.RNFS = null;
    this.downloadPath = null;
  }

  /**
   * Lazy load RNFS to avoid import errors at startup
   */
  getRNFS() {
    if (!this.RNFS) {
      this.RNFS = require('react-native-fs');
      this.downloadPath = Platform.OS === 'ios' 
        ? this.RNFS.DocumentDirectoryPath + '/ArogyaJal/Training'
        : this.RNFS.ExternalStorageDirectoryPath + '/ArogyaJ

  /**
   * Initialize download directory
   */
  async initializeDirectory() {
    try {
      const exists = await RNFS.exists(this.downloadPath);
      if (!exists) {
        await RNFS.mkdir(this.downloadPath, { NSURLIsExcludedFromBackupKey: true });
        console.log('[DownloadService] Directory created:', this.downloadPath);
      }
      return { success: true, path: this.downloadPath };
    } catch (error) {
      console.error('[DownloadService] Directory init error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Download file from URL
   */
  async downloadFile(url, moduleData, onProgress) {
    try {
      // Initialize directory
      await this.initializeDirectory();

      // Generate file name
      const fileExtension = this.getFileExtension(url, moduleData.type);
      const fileName = `${moduleData.id}.${fileExtension}`;
      const filePath = `${this.downloadPath}/${fileName}`;

      // Check if file already exists
      const exists = await RNFS.exists(filePath);
      if (exists) {
        console.log('[DownloadService] File already exists:', filePath);
        return { success: true, filePath };
      }

      // Start download
      console.log('[DownloadService] Starting download:', url);
      
      const downloadOptions = {
        fromUrl: url,
        toFile: filePath,
        background: true,
        discretionary: true,
        progress: (res) => {
          const progress = (res.bytesWritten / res.contentLength) * 100;
          if (onProgress) {
            onProgress({
              progress: progress.toFixed(0),
              bytesWritten: this.formatBytes(res.bytesWritten),
              totalBytes: this.formatBytes(res.contentLength),
            });
          }
        },
      };

      const download = RNFS.downloadFile(downloadOptions);
      this.downloads.set(moduleData.id, download);

      const result = await download.promise;

      if (result.statusCode === 200) {
        console.log('[DownloadService] Download completed:', filePath);
        
        // Save to local database
        await TrainingService.saveDownloadedModule({
          moduleId: moduleData.id,
          title: moduleData.title,
          titleHindi: moduleData.titleHindi,
          filePath: filePath,
          fileSize: moduleData.fileSize,
          fileType: moduleData.type,
          duration: moduleData.duration,
          category: moduleData.category,
        });

        this.downloads.delete(moduleData.id);
        return { success: true, filePath };
      } else {
        throw new Error(`Download failed with status: ${result.statusCode}`);
      }
    } catch (error) {
      console.error('[DownloadService] Download error:', error);
      this.downloads.delete(moduleData.id);
      return { success: false, error: error.message };
    }
  }

  /**
   * Cancel download
   */
  async cancelDownload(moduleId) {
    const download = this.downloads.get(moduleId);
    if (download) {
      download.stop();
      this.downloads.delete(moduleId);
      console.log('[DownloadService] Download cancelled:', moduleId);
      return { success: true };
    }
    return { success: false, error: 'Download not found' };
  }

  /**
   * Delete downloaded file
   */
  async deleteFile(filePath, moduleId) {
    try {
      const exists = await RNFS.exists(filePath);
      if (exists) {
        await RNFS.unlink(filePath);
        console.log('[DownloadService] File deleted:', filePath);
      }

      // Remove from local database
      await TrainingService.deleteDownloadedModule(moduleId);

      return { success: true };
    } catch (error) {
      console.error('[DownloadService] Delete file error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get file size
   */
  async getFileSize(filePath) {
    try {
      const stat = await RNFS.stat(filePath);
      return this.formatBytes(stat.size);
    } catch (error) {
      console.error('[DownloadService] Get file size error:', error);
      return '0 MB';
    }
  }

  /**
   * Check available storage
   */
  async getAvailableStorage() {
    try {
      const freeSpace = await RNFS.getFSInfo();
      return {
        success: true,
        freeSpace: this.formatBytes(freeSpace.freeSpace),
        totalSpace: this.formatBytes(freeSpace.totalSpace),
      };
    } catch (error) {
      console.error('[DownloadService] Get storage error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get file extension from URL or type
   */
  getFileExtension(url, type) {
    if (type === 'pdf') return 'pdf';
    if (type === 'image') return 'jpg';
    
    // Try to extract from URL
    const match = url.match(/\.([a-zA-Z0-9]+)(\?|$)/);
    if (match) return match[1];
    
    // Default to mp4 for videos
    return 'mp4';
  }

  /**
   * Format bytes to human readable
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Check if file exists
   */
  async fileExists(filePath) {
    try {
      return await RNFS.exists(filePath);
    } catch (error) {
      return false;
    }
  }
}

export default new DownloadService();
