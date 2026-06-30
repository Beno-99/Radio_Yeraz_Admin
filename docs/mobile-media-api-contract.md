# Mobile Media API Contract

React Native clients must use the API base URL:

```text
https://api.radioyeraz.com/api
```

Mobile apps must never connect directly to the database.

## Authentication

Public read endpoints do not require a bearer token. Protected admin endpoints require:

```text
Authorization: Bearer <access_token>
```

Tokens are issued by the existing auth endpoints and should be refreshed through the API, not by reading server-side data.

## Carousel Endpoints

Public read:

```text
GET /carousels?page=1&limit=10
GET /carousels/public?page=1&limit=10
GET /carousels/:id
```

Protected admin write:

```text
POST /carousels
PUT /carousels/:id
POST /carousels/:id/upload-image
PUT /carousels/:id/toggle-active
DELETE /carousels/:id
```

`POST`, `PUT`, and image upload requests use `multipart/form-data` for the `image` file when an image is created or replaced.

## Carousel Response Fields

Carousel responses expose a stable mobile shape:

```json
{
  "id": "24-char-id",
  "_id": "24-char-id",
  "name": "Homepage banner",
  "image": "/uploads/carousels/carousel-file.png",
  "targetUrl": "https://example.com",
  "startDate": "2026-06-30T00:00:00.000Z",
  "endDate": null,
  "isActive": true,
  "status": "active",
  "displayOrder": 0,
  "clicks": 0,
  "createdAt": "2026-06-30T00:00:00.000Z",
  "updatedAt": "2026-06-30T00:00:00.000Z"
}
```

Image paths are relative to `https://api.radioyeraz.com`. Mobile clients should build the full media URL by prefixing that media host when the value does not already start with `http`.

## Carousel Ordering And Status

Carousel listings sort by `displayOrder` ascending, then `createdAt` descending.

Public carousel results include only active, currently valid carousel items:

```text
isActive = true
status = active
startDate <= now
endDate is null or endDate >= now
```

The backend recalculates lifecycle status from `startDate`, `endDate`, and `isActive`.

## Post Media Fields

Post responses include:

```json
{
  "videoSource": "YOUTUBE",
  "video": null,
  "youtubeUrl": "https://www.youtube.com/watch?v=VIDEO_ID",
  "youtubeVideoId": "VIDEO_ID"
}
```

Legacy uploaded-video posts remain supported:

```json
{
  "videoSource": "UPLOAD",
  "video": "/uploads/posts/videos/example.mp4",
  "youtubeUrl": null,
  "youtubeVideoId": null
}
```

A post with no video media returns `null` values for these fields.

## YouTube URL Validation

New uploaded video files are not accepted for posts. New video media must be sent as `youtubeUrl`.

Accepted input formats:

```text
https://www.youtube.com/watch?v=VIDEO_ID
https://youtu.be/VIDEO_ID
https://www.youtube.com/shorts/VIDEO_ID
https://www.youtube.com/embed/VIDEO_ID
https://www.youtube.com/live/VIDEO_ID
https://m.youtube.com/watch?v=VIDEO_ID
```

Allowed hosts:

```text
youtube.com
www.youtube.com
m.youtube.com
youtu.be
```

The backend parses URLs with the URL parser, extracts an 11-character YouTube video ID, normalizes `youtubeUrl` to `https://www.youtube.com/watch?v=VIDEO_ID`, and exposes `youtubeVideoId` directly for mobile clients.

Mobile clients should render YouTube videos with:

```text
https://www.youtube-nocookie.com/embed/{youtubeVideoId}
```

Do not send arbitrary iframe HTML and do not proxy or download YouTube video data through the Radio Yeraz backend.

## Validation Errors

The API rejects:

```text
malformed URLs
missing video IDs
lookalike YouTube domains
javascript URLs
unrelated hosts
new uploaded video files
```

Invalid YouTube inputs return `400 Bad Request`.

## Legacy Uploaded Video Behavior

Existing uploaded-video posts can continue to render from `video` when `videoSource` is `UPLOAD`.

Creating or updating a post with a new uploaded video file is rejected. Updating a post to YouTube media clears the database video path but does not require downloading, proxying, or replacing the old uploaded file.
