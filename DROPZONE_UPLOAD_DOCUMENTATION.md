# Dropzone.js Large Video Upload Implementation

## Overview
This implementation adds Dropzone.js support for large video uploads with chunking, retry, and resume capabilities.

## Features

### ✅ Chunked Upload
- Videos are split into 8MB chunks
- Parallel chunk uploads for faster uploads
- Automatic retry on chunk failure (up to 3 retries)

### ✅ Resume Support
- If connection drops, upload can resume from last uploaded chunk
- Chunk status endpoint to check progress

### ✅ Large File Support
- Supports videos up to 10GB
- No timeout for chunked uploads
- Backend handles chunk assembly automatically

### ✅ Security
- Admin-only access (protected by auth middleware)
- Video mime type validation
- Automatic cleanup of incomplete uploads

## Frontend Implementation

### Component: `DropzoneVideoUpload.jsx`
Located at: `Frontend/src/components/DropzoneVideoUpload.jsx`

**Features:**
- Drag & drop interface
- Real-time upload progress
- Visual status indicators (uploading, success, error)
- Automatic chunking (8MB chunks)
- Retry on failure

**Usage:**
```jsx
<DropzoneVideoUpload
  courseId={courseId}
  contentId={contentId}
  onUploadComplete={(data, file) => {
    // Handle successful upload
    setUploadedVideoUrl(data.videoUrl);
  }}
  onUploadError={(error, file) => {
    // Handle upload error
  }}
/>
```

### Integration in `AdminCourseContentManage.jsx`
- Dropzone is used for large video uploads
- Traditional file input remains as fallback for small videos
- Uploaded video URL is automatically included in form submission

## Backend Implementation

### Endpoints

#### 1. Upload Video Chunk
**POST** `/api/admin/upload/video-chunk`

**Description:** Uploads a single chunk of a video file.

**Request:**
- `chunk` (file): The video chunk file
- `dzuuid` (string): Dropzone unique identifier
- `dzchunkindex` (number): Current chunk index
- `dztotalchunkcount` (number): Total number of chunks
- `dztotalfilesize` (number): Total file size in bytes
- `dzchunksize` (number): Size of each chunk
- `dzchunkbyteoffset` (number): Byte offset of current chunk

**Response:**
```json
{
  "success": true,
  "message": "Chunk uploaded successfully",
  "data": {
    "uploadedChunks": 5,
    "totalChunks": 10
  }
}
```

**Final Response (when all chunks uploaded):**
```json
{
  "success": true,
  "message": "Video uploaded successfully",
  "data": {
    "videoUrl": "/uploads/videos/uuid.mp4",
    "fileName": "uuid.mp4",
    "fileSize": 1048576000
  }
}
```

#### 2. Get Chunk Status
**GET** `/api/admin/upload/video-chunk-status?dzuuid=<uuid>`

**Description:** Check which chunks have been uploaded (for resume).

**Response:**
```json
{
  "success": true,
  "data": {
    "uploadedChunks": [0, 1, 2, 3, 4],
    "totalChunks": 10
  }
}
```

#### 3. Cleanup Chunks
**DELETE** `/api/admin/upload/cleanup-chunks`

**Description:** Clean up incomplete uploads older than 24 hours.

**Response:**
```json
{
  "success": true,
  "message": "Cleaned up 3 incomplete upload(s)",
  "data": {
    "cleanedCount": 3
  }
}
```

### File Structure

**Chunks Directory:** `Backend/uploads/chunks/<uuid>/`
- Each upload gets a unique directory
- Chunks are stored as `chunk-0`, `chunk-1`, etc.
- Automatically cleaned up after successful merge

**Videos Directory:** `Backend/uploads/videos/`
- Final merged videos are stored here
- Filename format: `<uuid>.<extension>`

### Chunk Assembly Process

1. Each chunk is saved to `chunks/<uuid>/chunk-<index>`
2. When all chunks are received, they are read in order
3. Chunks are merged into a single buffer
4. Merged file is saved to `videos/<uuid>.<ext>`
5. Chunk directory is cleaned up

### Security

- **Authentication:** All endpoints require admin authentication
- **File Type Validation:** Only video mime types allowed:
  - `video/mp4`
  - `video/webm`
  - `video/quicktime`
  - `video/x-msvideo`
  - `video/x-matroska`
- **Size Limits:** 50MB per chunk (safety limit)

## Configuration

### Dropzone Configuration
```javascript
{
  chunking: true,
  chunkSize: 8 * 1024 * 1024, // 8MB
  retryChunks: true,
  retryChunksLimit: 3,
  parallelChunkUploads: true,
  maxFilesize: 10 * 1024 * 1024 * 1024, // 10GB
  timeout: 0, // No timeout
}
```

### Backend Configuration
- Chunk size limit: 50MB per chunk
- Max video size: 10GB (configurable via `MAX_VIDEO_SIZE` env var)
- Cleanup interval: 24 hours (incomplete uploads)

## Usage Example

### Frontend
```jsx
import DropzoneVideoUpload from "@/components/DropzoneVideoUpload";

function MyComponent() {
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState(null);

  return (
    <DropzoneVideoUpload
      courseId="course-id"
      onUploadComplete={(data) => {
        setUploadedVideoUrl(data.videoUrl);
      }}
      onUploadError={(error) => {
        console.error("Upload failed:", error);
      }}
    />
  );
}
```

### Backend Integration
The uploaded video URL is automatically included when creating/updating course content:

```javascript
// In createCourseContent or updateCourseContent
if (videoUrl && videoUrl.startsWith('/uploads/videos/')) {
  finalVideoUrl = videoUrl; // Use chunked upload URL
}
```

## Troubleshooting

### Upload Fails
1. Check browser console for errors
2. Verify authentication token is valid
3. Check network connection
4. Verify file type is supported

### Chunks Not Merging
1. Check server logs for errors
2. Verify all chunks were uploaded successfully
3. Check disk space on server
4. Verify chunk directory permissions

### Resume Not Working
1. Verify `dzuuid` is consistent
2. Check chunk status endpoint
3. Ensure chunks directory exists and is accessible

## Maintenance

### Cleanup Cron Job
Set up a cron job to clean up incomplete uploads:

```bash
# Run daily at 2 AM
0 2 * * * curl -X DELETE http://localhost:5005/api/admin/upload/cleanup-chunks -H "Authorization: Bearer <admin-token>"
```

Or use the endpoint manually when needed.

## Performance

- **Parallel Uploads:** Multiple chunks upload simultaneously
- **Resume Capability:** Failed uploads can resume from last chunk
- **Progress Tracking:** Real-time progress updates
- **No Timeout:** Large files won't timeout during upload

## Future Enhancements

- [ ] Add upload queue for multiple videos
- [ ] Add pause/resume UI controls
- [ ] Add upload speed indicator
- [ ] Add estimated time remaining
- [ ] Add support for multiple video formats
- [ ] Add video preview before upload


