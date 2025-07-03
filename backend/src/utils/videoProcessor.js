const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const ffmpeg = require('ffmpeg-static');

class VideoProcessor {
  constructor() {
    this.ffmpegPath = ffmpeg;
  }

  /**
   * Generate a thumbnail from the first frame of a video
   * @param {Buffer} videoBuffer - The video file buffer
   * @param {string} outputPath - Where to save the thumbnail
   * @param {number} width - Thumbnail width (default: 400)
   * @param {number} height - Thumbnail height (default: 400)
   * @returns {Promise<Buffer>} - The thumbnail buffer
   */
  async generateThumbnail(videoBuffer, outputPath, width = 400, height = 400) {
    return new Promise(async (resolve, reject) => {
      try {
        // Save video buffer to temporary file
        const tempVideoPath = path.join(os.tmpdir(), `temp_video_${Date.now()}.mov`);
        fs.writeFileSync(tempVideoPath, videoBuffer);

        const args = [
          '-i', tempVideoPath,     // Read from temp file instead of stdin
          '-vframes', '1',         // Extract only 1 frame
          '-vf', `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:black`,
          '-f', 'image2',
          '-y',
          outputPath
        ];

        const ffmpegProcess = spawn(this.ffmpegPath, args, {
          stdio: ['ignore', 'pipe', 'pipe']
        });

        let stderr = '';

        ffmpegProcess.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        ffmpegProcess.on('close', (code) => {
          // Clean up temp video file
          try {
            fs.unlinkSync(tempVideoPath);
          } catch (error) {
            console.log('Failed to clean up temp video file:', error.message);
          }

          if (code === 0) {
            try {
              const thumbnailBuffer = fs.readFileSync(outputPath);
              // Clean up temp thumbnail file
              fs.unlinkSync(outputPath);
              resolve(thumbnailBuffer);
            } catch (error) {
              reject(new Error(`Failed to read thumbnail: ${error.message}`));
            }
          } else {
            // Try alternative approach
            console.log('First attempt failed, trying alternative approach...');
            this.generateThumbnailAlternative(videoBuffer, outputPath, width, height)
              .then(resolve)
              .catch(() => reject(new Error(`FFmpeg failed with code ${code}: ${stderr}`)));
          }
        });

        ffmpegProcess.on('error', (error) => {
          // Clean up temp video file
          try {
            fs.unlinkSync(tempVideoPath);
          } catch (cleanupError) {
            console.log('Failed to clean up temp video file:', cleanupError.message);
          }
          reject(new Error(`FFmpeg process error: ${error.message}`));
        });

      } catch (error) {
        reject(new Error(`Failed to create temp video file: ${error.message}`));
      }
    });
  }

  /**
   * Alternative thumbnail generation method
   */
  async generateThumbnailAlternative(videoBuffer, outputPath, width = 400, height = 400) {
    return new Promise(async (resolve, reject) => {
      try {
        // Save video buffer to temporary file
        const tempVideoPath = path.join(os.tmpdir(), `temp_video_alt_${Date.now()}.mov`);
        fs.writeFileSync(tempVideoPath, videoBuffer);

        const args = [
          '-i', tempVideoPath,     // Read from temp file
          '-ss', '00:00:01',       // Seek to 1 second (more reliable than first frame)
          '-vframes', '1',         // Extract only 1 frame
          '-vf', `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:black`,
          '-f', 'image2',
          '-y',
          outputPath
        ];

        const ffmpegProcess = spawn(this.ffmpegPath, args, {
          stdio: ['ignore', 'pipe', 'pipe']
        });

        let stderr = '';

        ffmpegProcess.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        ffmpegProcess.on('close', (code) => {
          // Clean up temp video file
          try {
            fs.unlinkSync(tempVideoPath);
          } catch (error) {
            console.log('Failed to clean up temp video file:', error.message);
          }

          if (code === 0) {
            try {
              const thumbnailBuffer = fs.readFileSync(outputPath);
              fs.unlinkSync(outputPath);
              resolve(thumbnailBuffer);
            } catch (error) {
              reject(new Error(`Failed to read thumbnail: ${error.message}`));
            }
          } else {
            reject(new Error(`Alternative FFmpeg failed with code ${code}: ${stderr}`));
          }
        });

        ffmpegProcess.on('error', (error) => {
          // Clean up temp video file
          try {
            fs.unlinkSync(tempVideoPath);
          } catch (cleanupError) {
            console.log('Failed to clean up temp video file:', cleanupError.message);
          }
          reject(new Error(`FFmpeg process error: ${error.message}`));
        });

      } catch (error) {
        reject(new Error(`Failed to create temp video file: ${error.message}`));
      }
    });
  }

  /**
   * Generate a compressed preview video
   * @param {Buffer} videoBuffer - The original video buffer
   * @param {string} outputPath - Where to save the preview
   * @param {number} maxWidth - Maximum width (default: 1280)
   * @param {number} maxHeight - Maximum height (default: 720)
   * @param {number} bitrate - Target bitrate in kbps (default: 1000)
   * @returns {Promise<Buffer>} - The preview video buffer
   */
  async generatePreview(videoBuffer, outputPath, maxWidth = 1280, maxHeight = 720, bitrate = 1000) {
    return new Promise(async (resolve, reject) => {
      try {
        // Save video buffer to temporary file
        const tempVideoPath = path.join(os.tmpdir(), `temp_video_preview_${Date.now()}.mov`);
        fs.writeFileSync(tempVideoPath, videoBuffer);

        const args = [
          '-i', tempVideoPath,     // Read from temp file instead of stdin
          '-vf', `scale=min(${maxWidth}\\,iw):min(${maxHeight}\\,ih):force_original_aspect_ratio=decrease`,
          '-c:v', 'libx264',
          '-preset', 'fast',
          '-crf', '23',
          '-c:a', 'aac',
          '-b:a', '128k',
          '-movflags', '+faststart',
          '-f', 'mp4',
          '-y',
          outputPath
        ];

        const ffmpegProcess = spawn(this.ffmpegPath, args, {
          stdio: ['ignore', 'pipe', 'pipe']
        });

        let stderr = '';

        ffmpegProcess.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        ffmpegProcess.on('close', (code) => {
          // Clean up temp video file
          try {
            fs.unlinkSync(tempVideoPath);
          } catch (error) {
            console.log('Failed to clean up temp video file:', error.message);
          }

          if (code === 0) {
            try {
              const previewBuffer = fs.readFileSync(outputPath);
              // Clean up temp preview file
              fs.unlinkSync(outputPath);
              resolve(previewBuffer);
            } catch (error) {
              reject(new Error(`Failed to read preview: ${error.message}`));
            }
          } else {
            // Try alternative approach
            console.log('Preview generation failed, trying alternative approach...');
            this.generatePreviewAlternative(videoBuffer, outputPath, maxWidth, maxHeight, bitrate)
              .then(resolve)
              .catch(() => reject(new Error(`FFmpeg failed with code ${code}: ${stderr}`)));
          }
        });

        ffmpegProcess.on('error', (error) => {
          // Clean up temp video file
          try {
            fs.unlinkSync(tempVideoPath);
          } catch (cleanupError) {
            console.log('Failed to clean up temp video file:', cleanupError.message);
          }
          reject(new Error(`FFmpeg process error: ${error.message}`));
        });

      } catch (error) {
        reject(new Error(`Failed to create temp video file: ${error.message}`));
      }
    });
  }

  /**
   * Alternative preview generation method
   */
  async generatePreviewAlternative(videoBuffer, outputPath, maxWidth = 1280, maxHeight = 720, bitrate = 1000) {
    return new Promise(async (resolve, reject) => {
      try {
        // Save video buffer to temporary file
        const tempVideoPath = path.join(os.tmpdir(), `temp_video_preview_alt_${Date.now()}.mov`);
        fs.writeFileSync(tempVideoPath, videoBuffer);

        const args = [
          '-i', tempVideoPath,     // Read from temp file
          '-vf', `scale=min(${maxWidth}\\,iw):min(${maxHeight}\\,ih):force_original_aspect_ratio=decrease`,
          '-c:v', 'libx264',
          '-preset', 'ultrafast',   // Use ultrafast preset for better compatibility
          '-crf', '28',             // Slightly lower quality for better compatibility
          '-c:a', 'aac',
          '-b:a', '128k',
          '-movflags', '+faststart',
          '-f', 'mp4',
          '-y',
          outputPath
        ];

        const ffmpegProcess = spawn(this.ffmpegPath, args, {
          stdio: ['ignore', 'pipe', 'pipe']
        });

        let stderr = '';

        ffmpegProcess.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        ffmpegProcess.on('close', (code) => {
          // Clean up temp video file
          try {
            fs.unlinkSync(tempVideoPath);
          } catch (error) {
            console.log('Failed to clean up temp video file:', error.message);
          }

          if (code === 0) {
            try {
              const previewBuffer = fs.readFileSync(outputPath);
              fs.unlinkSync(outputPath);
              resolve(previewBuffer);
            } catch (error) {
              reject(new Error(`Failed to read preview: ${error.message}`));
            }
          } else {
            reject(new Error(`Alternative preview FFmpeg failed with code ${code}: ${stderr}`));
          }
        });

        ffmpegProcess.on('error', (error) => {
          // Clean up temp video file
          try {
            fs.unlinkSync(tempVideoPath);
          } catch (cleanupError) {
            console.log('Failed to clean up temp video file:', cleanupError.message);
          }
          reject(new Error(`FFmpeg process error: ${error.message}`));
        });

      } catch (error) {
        reject(new Error(`Failed to create temp video file: ${error.message}`));
      }
    });
  }

  /**
   * Get video metadata (duration, dimensions, etc.)
   * @param {Buffer} videoBuffer - The video file buffer
   * @returns {Promise<Object>} - Video metadata
   */
  async getVideoMetadata(videoBuffer) {
    return new Promise(async (resolve, reject) => {
      try {
        // Save video buffer to temporary file
        const tempVideoPath = path.join(os.tmpdir(), `temp_video_meta_${Date.now()}.mov`);
        fs.writeFileSync(tempVideoPath, videoBuffer);

        const args = [
          '-i', tempVideoPath,
          '-f', 'null',
          '-'
        ];

        const ffmpegProcess = spawn(this.ffmpegPath, args, {
          stdio: ['ignore', 'pipe', 'pipe']
        });

        let stderr = '';

        ffmpegProcess.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        ffmpegProcess.on('close', (code) => {
          // Clean up temp video file
          try {
            fs.unlinkSync(tempVideoPath);
          } catch (error) {
            console.log('Failed to clean up temp video file:', error.message);
          }

          if (code === 0 || code === 1) { // FFmpeg returns 1 for info-only commands
            const metadata = this.parseFFmpegOutput(stderr);
            resolve(metadata);
          } else {
            // Try alternative metadata extraction
            console.log('Metadata extraction failed, trying alternative approach...');
            this.getVideoMetadataAlternative(videoBuffer)
              .then(resolve)
              .catch(() => reject(new Error(`FFmpeg failed with code ${code}: ${stderr}`)));
          }
        });

        ffmpegProcess.on('error', (error) => {
          // Clean up temp video file
          try {
            fs.unlinkSync(tempVideoPath);
          } catch (cleanupError) {
            console.log('Failed to clean up temp video file:', cleanupError.message);
          }
          reject(new Error(`FFmpeg process error: ${error.message}`));
        });

      } catch (error) {
        reject(new Error(`Failed to create temp video file: ${error.message}`));
      }
    });
  }

  /**
   * Alternative metadata extraction method
   */
  async getVideoMetadataAlternative(videoBuffer) {
    return new Promise(async (resolve, reject) => {
      try {
        // Save video buffer to temporary file
        const tempVideoPath = path.join(os.tmpdir(), `temp_video_meta_alt_${Date.now()}.mov`);
        fs.writeFileSync(tempVideoPath, videoBuffer);

        const args = [
          '-i', tempVideoPath,
          '-f', 'null',
          '-'
        ];

        const ffmpegProcess = spawn(this.ffmpegPath, args, {
          stdio: ['ignore', 'pipe', 'pipe']
        });

        let stderr = '';

        ffmpegProcess.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        ffmpegProcess.on('close', (code) => {
          // Clean up temp video file
          try {
            fs.unlinkSync(tempVideoPath);
          } catch (error) {
            console.log('Failed to clean up temp video file:', error.message);
          }

          if (code === 0 || code === 1) {
            const metadata = this.parseFFmpegOutput(stderr);
            resolve(metadata);
          } else {
            reject(new Error(`Alternative metadata FFmpeg failed with code ${code}: ${stderr}`));
          }
        });

        ffmpegProcess.on('error', (error) => {
          // Clean up temp video file
          try {
            fs.unlinkSync(tempVideoPath);
          } catch (cleanupError) {
            console.log('Failed to clean up temp video file:', cleanupError.message);
          }
          reject(new Error(`FFmpeg process error: ${error.message}`));
        });

      } catch (error) {
        reject(new Error(`Failed to create temp video file: ${error.message}`));
      }
    });
  }

  /**
   * Parse FFmpeg output to extract metadata
   * @param {string} output - FFmpeg stderr output
   * @returns {Object} - Parsed metadata
   */
  parseFFmpegOutput(output) {
    const metadata = {
      duration: null,
      width: null,
      height: null,
      fps: null,
      bitrate: null
    };

    // Extract duration
    const durationMatch = output.match(/Duration: (\d{2}):(\d{2}):(\d{2})\.(\d{2})/);
    if (durationMatch) {
      const hours = parseInt(durationMatch[1]);
      const minutes = parseInt(durationMatch[2]);
      const seconds = parseInt(durationMatch[3]);
      const centiseconds = parseInt(durationMatch[4]);
      metadata.duration = hours * 3600 + minutes * 60 + seconds + centiseconds / 100;
    }

    // Extract video stream info
    const videoStreamMatch = output.match(/Video: .* (\d+)x(\d+)/);
    if (videoStreamMatch) {
      metadata.width = parseInt(videoStreamMatch[1]);
      metadata.height = parseInt(videoStreamMatch[2]);
    }

    // Extract FPS
    const fpsMatch = output.match(/(\d+(?:\.\d+)?) fps/);
    if (fpsMatch) {
      metadata.fps = parseFloat(fpsMatch[1]);
    }

    // Extract bitrate
    const bitrateMatch = output.match(/(\d+) kb\/s/);
    if (bitrateMatch) {
      metadata.bitrate = parseInt(bitrateMatch[1]);
    }

    return metadata;
  }
}

module.exports = VideoProcessor; 